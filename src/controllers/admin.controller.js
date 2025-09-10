import prisma from "../lib/prisma.js";

/**
 * Create a new quiz
 * Request body:
 * {
 *   "title": "Finance Basics",
 *   "questions": [
 *      { "text": "2+2?", "optionA": "3", "optionB": "4", "optionC": "5", "optionD": "6", "correct": "optionB" },
 *      { "text": "Capital of India?", "optionA": "Mumbai", "optionB": "Delhi", "optionC": "Kolkata", "optionD": "Chennai",           "correct": "optionB" }
 *   ]
 * }
 */
export const createQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Quiz title is required" });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        questions: {
          create: questions || [],
        },
      },
      include: { questions: true },
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(500).json({ error: "Failed to create quiz" });
  }
};

/**
 * Add a single question to an existing quiz
 * Request body:
 * {
 *   "text": "Who is CEO of Tesla?",
 *   "optionA": "Elon Musk",
 *   "optionB": "Jeff Bezos",
 *   "optionC": "Bill Gates",
 *   "optionD": "Mark Zuckerberg",
 *   "correct": "optionA"
 * }
 */

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
