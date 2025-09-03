import prisma from "../lib/prisma.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import axios from "axios";
import { Storage } from "@google-cloud/storage";

// --------------------
// Quiz Controller
// --------------------
export const getQuiz = async (req, res) => {
  try {
    const latestQuiz = await prisma.quiz.findFirst({
      orderBy: { createdAt: "desc" },
      include: { questions: true },
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

// --------------------
// Conversation List
// --------------------
export const conversations = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ matches new schema

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ conversations });
  } catch (err) {
    console.error("Error fetching conversations:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// --------------------
// Messages in a Conversation
// --------------------
export const messages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // conversationId

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation || conversation.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: conversation not found or not yours" });
    }

    const rawMessages = await prisma.message.findMany({
      where: { conversationId: id },
      select: {
        id: true,
        message_query: true,
        message_response: true,
        is_encrypted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

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
        createdAt: msg.createdAt,
      };
    });

    return res.json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// --------------------
// Chat with Bot
// --------------------
export const chatWithBot = async (req, res) => {
  try {
    const { conversationId, query } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    let convId = conversationId;
    let convTitle = null;

    // Create conversation if new
    if (!convId || convId === "null") {
      const title = query.split(" ").slice(0, 5).join(" ");
      const newConversation = await prisma.conversation.create({
        data: { title, userId },
      });
      convId = newConversation.id;
      convTitle = newConversation.title;
    }

    // Fetch last 5 messages
    const lastMessages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { message_query: true, message_response: true },
    });

    // Decrypt context
    const context = lastMessages
      .map((msg) => {
        const userMsg = msg.message_query
          ? decrypt(JSON.parse(msg.message_query))
          : null;
        const botMsg = msg.message_response
          ? decrypt(JSON.parse(msg.message_response))
          : null;
        return { query: userMsg, response: botMsg };
      })
      .reverse();

    // Payload for external API
    const apiPayload = {
      userId,
      conversationId: convId,
      messages: [...context, { role: "user", content: query }],
    };

    console.log("payload", apiPayload);

    // const apiResponse = await axios.post(
    //   "https://your-external-api.com/chat",
    //   apiPayload,
    //   { headers: { Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}` } }
    // );
    // const responseText = apiResponse.data.reply || "No response from API";

    const responseText =
      "This is a demo response since AI API is not yet integrated";

    // Encrypt and save
    const encQuery = encrypt(query);
    const encResponse = encrypt(responseText);

    const message = await prisma.message.create({
      data: {
        message_query: JSON.stringify(encQuery),
        message_response: JSON.stringify(encResponse),
        is_bot: true,
        is_encrypted: true,
        conversation: { connect: { id: convId } },
        user: { connect: { id: userId } },
      },
    });

    res.json({
      conversationId: convId,
      conversationTitle: convTitle,
      messageId: message.id,
      botResponse: responseText,
    });
  } catch (err) {
    console.error("Error in chatWithBot:", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --------------------
// Google Cloud Storage Config
// --------------------
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = process.env.GCP_BUCKET_NAME;

// --------------------
// Helper: Get signed READ URL
// --------------------
async function getSignedUrl(fileName) {
  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
  return url;
}

// --------------------
// GET /media?page=1&limit=10&type=VIDEO
// --------------------
export const media = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type || "VIDEO"; // default

    const videos = await prisma.video.findMany({
      skip,
      take: limit,
      where: { type },
      include: { comments: true },
      orderBy: { createdAt: "desc" },
    });

    // attach signed GCS URL
    const videosWithUrl = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        url: await getSignedUrl(video.fileName),
      }))
    );

    const totalCount = await prisma.video.count({ where: { type } });

    res.json({
      page,
      limit,
      type,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      videos: videosWithUrl,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// --------------------
// POST /media (upload metadata after file upload)
// --------------------
export const uploadMedia = async (req, res) => {
  try {
    const { title, description, fileName } = req.body;

    if (!title || !fileName) {
      return res.status(400).json({ error: "title and fileName are required" });
    }

    // detect type from file path
    let type = "VIDEO";
    if (fileName.startsWith("shorts/")) {
      type = "SHORT";
    }

    const newVideo = await prisma.video.create({
      data: {
        title,
        description,
        fileName,
        type,
      },
    });

    res.status(201).json(newVideo);
  } catch (error) {
    console.error("Error saving video:", error);
    res.status(500).json({ error: "Failed to save video data" });
  }
};
