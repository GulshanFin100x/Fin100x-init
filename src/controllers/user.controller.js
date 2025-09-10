import prisma from "../lib/prisma.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import axios from "axios";
import { Storage } from "@google-cloud/storage";

// --------------------
// Quiz Controller
// --------------------
export const getQuiz = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Missing user" });
    }

    // 🔹 Get user and check quiz eligibility
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastQuizTakenAt: true },
    });

    let canTakeQuiz = true;
    if (user?.lastQuizTakenAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastTaken = new Date(user.lastQuizTakenAt);
      lastTaken.setHours(0, 0, 0, 0);

      canTakeQuiz = lastTaken < today;
    }

    // ❌ If not eligible, block immediately
    if (!canTakeQuiz) {
      return res.status(403).json({
        message: "You have already taken the quiz today. Come back tomorrow!",
      });
    }

    // ✅ Get latest quiz only if eligible
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
// Submit Quiz Controller
// --------------------
export const submitQuiz = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { score } = req.body; // 👈 frontend sends score

    if (!userId) {
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Missing user" });
    }

    if (typeof score !== "number" || score < 0) {
      return res
        .status(400)
        .json({
          code: "INVALID_INPUT",
          message: "Score must be a positive number",
        });
    }

    // 🔹 Update user: set lastQuizTakenAt = now, increment totalQuizzes and redeemPoints
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastQuizTakenAt: new Date(),
        totalQuizzes: { increment: 1 },
        redeemPoints: { increment: score },
      },
      select: {
        id: true,
        lastQuizTakenAt: true,
        totalQuizzes: true,
        redeemPoints: true,
      },
    });

    res.status(200).json({
      message: "Quiz submitted successfully",
      userStats: updatedUser,
    });
  } catch (err) {
    console.error("Error submitting quiz:", err);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

// --------------------
// Conversation List
// --------------------
export const conversations = async (req, res) => {
  try {
    const userId = req.user.userId; 

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
    const userId = req.user.userId;
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
    const userId = req.user.userId;

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
// PATCH /user/profile (update name + mark isNew = false if true)
// --------------------
export async function updateUserProfile(req, res) {
  try {
    const userId = req.user?.userId; // comes from middleware
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ code: "NO_AUTH", message: "Unauthorized" });
    }

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Name is required" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        isNew: false, // always set false when updating name
      },
    });

    return res.json({ user });
  } catch (e) {
    console.error("updateUserProfile:", e);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to update profile" });
  }
}


// --------------------
// GET /user/profile
// Fetches all user details by userId from req.user (set by protectRoute middleware).
// Returns user info including phone, name, language, referralCode, isNew, kycStatus, and timestamps.
// Requires authentication via protectRoute middleware.
// --------------------
export async function getUserProfile(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Missing user" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        phoneMasked: true,
        name: true,
        language: true,
        referralCode: true,
        isNew: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
        // You can include related data if needed:
        // session: true,
        // conversations: true,
        // messages: true,
        // reviews: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "User not found" });
    }

    // ✅ Check if user can take quiz today
    let canTakeQuiz = true;
    if (user.lastQuizTakenAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastTaken = new Date(user.lastQuizTakenAt);
      lastTaken.setHours(0, 0, 0, 0);

      canTakeQuiz = lastTaken < today;
    }

    return res.json({ user, canTakeQuiz });
  } catch (error) {
    console.error("getUserProfile:", error);
    return res
      .status(500)
      .json({ code: "SERVER_ERROR", message: "Unable to fetch user" });
  }
}

// --------------------
// POST /user/assets (create or update asset allocation for logged-in user)
// --------------------
export const saveUserAssets = async (req, res) => {
  try {
    const userId = req.user.userId; // middleware attaches authenticated user
    const {
      income,
      expenses,
      savings,
      netWorth,
      cashFlow,
      loans,
      insurance,
      taxSavings,
    } = req.body;

    const asset = await prisma.userAsset.upsert({
      where: { userId },
      update: {
        income,
        expenses,
        savings,
        netWorth,
        cashFlow,
        loans,
        insurance,
        taxSavings,
      },
      create: {
        userId,
        income,
        expenses,
        savings,
        netWorth,
        cashFlow,
        loans,
        insurance,
        taxSavings,
      },
    });

    res.json({ message: "Assets saved successfully", asset });
  } catch (error) {
    console.error("Error saving assets:", error);
    res.status(500).json({ error: "Failed to save assets" });
  }
};

// --------------------
// GET /user/assets (fetch asset allocation for logged-in user)
// --------------------
export const getUserAssets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const asset = await prisma.userAsset.findUnique({
      where: { userId },
    });

    if (!asset) {
      return res.status(404).json({ error: "Assets not found" });
    }

    res.json(asset);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// --------------------
// POST /user/assets (create or update asset allocation for logged-in user)
// --------------------
export const createGlossaryTerm = async (req, res) => {
  try {
    const { tag, word, definition } = req.body;

    if (!tag || !word || !definition) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTerm = await prisma.glossaryTerm.create({
      data: { tag, word, definition },
    });

    res.status(201).json(newTerm);
  } catch (error) {
    console.error("Error creating glossary term:", error);
    res.status(500).json({ error: "Failed to create glossary term" });
  }
};

// --------------------
// GET /glossary?tag=xyz&page=1&limit=10
// Fetch glossary entries filtered by tag (with pagination)
// If no tag is provided, return all glossary entries with pagination
// --------------------
export const getGlossaryTerms = async (req, res) => {
  try {
    const { tag, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = {};
    if (tag) {
      where.tag = { equals: tag, mode: "insensitive" };
    }

    const terms = await prisma.glossaryTerm.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.glossaryTerm.count({ where });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      terms,
    });
  } catch (error) {
    console.error("Error fetching glossary terms:", error);
    res.status(500).json({ error: "Failed to fetch glossary terms" });
  }
};
