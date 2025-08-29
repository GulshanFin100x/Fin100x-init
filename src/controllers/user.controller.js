import prisma from "../lib/prisma.js";
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

export const chat = async (req, res) => {
  try {
    // Extract query from frontend request
    const { query } = req.body;
    const user_id = req.user.user_id; // assuming req.user is set by auth middleware

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Forward request to another backend
    const backendResponse = await axios.post(
      "https://another-backend.com/api/chat",
      {
        query,
        user_id
      }
    );

    // Send backend response back to frontend
    res.status(backendResponse.status).json(backendResponse.data);

  } catch (error) {
    console.error("Error in /chat route:", error.message);

    if (error.response) {
      // Forward error response from backend
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

export const addUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNo, email, panCardNo, aadhaarNo } = req.body;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phoneNo,
        email,
        panCardNo,
        aadhaarNo,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};