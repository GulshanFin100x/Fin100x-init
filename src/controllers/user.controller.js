import prisma from "../lib/prisma.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import axios from "axios";

export const getQuiz = async (req, res) => {
  try {
    const latestQuiz = await prisma.quiz.findFirst({
      orderBy: {
        createdAt: "desc", // latest first
      },
      include: {
        questions: true, // also fetch related questions
      },
    });

    if (!latestQuiz) {
      return res.status(404).json({ error: "No quiz found" });
    }

    res.status(200).json({
      message: "Latest quiz fetched successfully",
      quiz: latestQuiz,
    });
  } catch (err) {
    console.error("Error fetching latest quiz:", err);
    res.status(500).json({ error: "Failed to fetch latest quiz" });
  }
};

export const conversations = async (req, res) => {
  try {
    const uid = req.user.uid;

    const conversations = await prisma.conversation.findMany({
      where: { uid },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc", // ✅ most recent first
      },
    });

    return res.json({ conversations });
  } catch (err) {
    console.error("Error fetching conversations:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

export const messages = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params; // conversationId

    // ✅ Check if conversation belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation || conversation.firebaseID !== uid) {
      return res
        .status(403)
        .json({ error: "Forbidden: conversation not found or not yours" });
    }

    // ✅ Fetch messages ordered by createdAt (oldest → newest)
    const rawMessages = await prisma.message.findMany({
      where: { conversationId: id },
      select: {
        id: true,
        message_query: true,
        message_response: true,
        is_bot: true,
        is_encrypted: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // ✅ Decrypt messages before sending
    const messages = rawMessages.map((msg) => {
      let query = msg.message_query;
      let response = msg.message_response;

      if (msg.is_encrypted) {
        if (query) {
          try {
            query = decrypt(JSON.parse(query));
          } catch (err) {
            console.error("Failed to decrypt query:", err.message);
          }
        }
        if (response) {
          try {
            response = decrypt(JSON.parse(response));
          } catch (err) {
            console.error("Failed to decrypt response:", err.message);
          }
        }
      }

      return {
        id: msg.id,
        conversationId: id,
        query,
        response,
        is_bot: msg.is_bot,
        createdAt: msg.createdAt,
      };
    });

    return res.json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const chatWithBot = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.body;
    const uid = req.user.uid;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    let convId = conversationId;

    // 1. Create conversation if null
    if (!convId || convId === "null") {
      const title = query.split(" ").slice(0, 5).join(" ");
      const newConversation = await prisma.conversation.create({
        data: {
          title,
          firebaseID: uid,
        },
      });
      convId = newConversation.id;
    }

    // 2. Fetch last 5 messages
    const lastMessages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        message_query: true,
        message_response: true,
        is_bot: true,
        is_encrypted: true,
      },
    });

    // 3. Decrypt context
    const context = lastMessages
      .map((msg) => {
        const userMsg = msg.message_query
          ? decrypt(JSON.parse(msg.message_query))
          : null;
        const botMsg = msg.message_response
          ? decrypt(JSON.parse(msg.message_response))
          : null;
        return msg.is_bot
          ? { role: "assistant", content: botMsg }
          : { role: "user", content: userMsg };
      })
      .reverse();

    // 4. Prepare payload for API
    const apiPayload = {
      messages: [...context, { role: "user", content: query }],
    };

    // 5. Call external API
    const apiResponse = await axios.post(
      "https://your-external-api.com/chat",
      apiPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
        },
      }
    );

    const responseText = apiResponse.data.reply || "No response from API";

    // 6. Encrypt and save
    const encQuery = encrypt(query);
    const encResponse = encrypt(responseText);

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        firebaseID: uid,
        message_query: JSON.stringify(encQuery),
        message_response: JSON.stringify(encResponse),
        is_bot: true,
        is_encrypted: true,
      },
    });

    // 7. Send response
    res.json({
      conversationId: convId,
      messageId: message.id,
      botResponse: responseText,
    });
  } catch (err) {
    console.error("Error in chatWithBot:", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};