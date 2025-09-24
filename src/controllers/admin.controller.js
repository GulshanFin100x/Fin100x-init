import prisma from "../lib/prisma.js";
import { generateSignedUrl } from "../utils/gcp.js";
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



export const createAdvisor = async (req, res) => {
  try {
    const {
      salutation,
      firstName,
      lastName,
      designation,
      yearsExperience,
      expertiseTags,
      certificate,
      fees,
      imageUrl, // we’ll replace this later with GCP signed URL
    } = req.body;

    const advisor = await prisma.advisor.create({
      data: {
        salutation,
        firstName,
        lastName,
        designation,
        yearsExperience: yearsExperience || 0,
        expertiseTags,
        certificate,
        fees: fees || 0,
        imageUrl, // this will be the uploaded image URL from GCP
      },
    });

    res.status(201).json(advisor);
  } catch (error) {
    console.error("Error creating advisor:", error);
    res.status(500).json({ error: "Failed to create advisor" });
  }
};


export const getAdvisors = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Fetch advisors with only required fields
    const advisors = await prisma.advisor.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        salutation: true,
        firstName: true,
        lastName: true,
        designation: true,
        yearsExperience: true,
        expertiseTags: true,
        certificate: true,
        fees: true,
      },
    });

    // Total count for pagination
    const totalAdvisors = await prisma.advisor.count();

    res.status(200).json({
      message: "Advisors fetched successfully",
      pagination: {
        total: totalAdvisors,
        page,
        limit,
        totalPages: Math.ceil(totalAdvisors / limit),
      },
      data: advisors,
    });
  } catch (err) {
    console.error("Error fetching advisors:", err);
    res.status(500).json({ error: "Failed to fetch advisors" });
  }
};


// --------------------
// GET /advisors/:id (fetch advisor details by ID)
// --------------------
export const getAdvisorById = async (req, res) => {
  try {
    const { id } = req.params;

    const advisor = await prisma.advisor.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        salutation: true,
        firstName: true,
        lastName: true,
        designation: true,
        yearsExperience: true,
        expertiseTags: true,
        certificate: true,
        fees: true,
        email: true,
        reviews: {
          select: {
            rating: true,
            comment: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Generate signed URL here ⬇️
    const signedImageUrl = advisor.imageUrl
      ? await generateSignedUrl(advisor.imageUrl)
      : null;

    // Format reviews
    const reviews = advisor.reviews.map((r) => ({
      userId: r.user.id,
      userName: r.user.name,
      rating: r.rating,
      comment: r.comment,
    }));

    res.status(200).json({
      message: "Advisor fetched successfully",
      advisor: {
        id: advisor.id,
        imageUrl: signedImageUrl, // ✅ use pre-generated signed URL
        salutation: advisor.salutation,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        designation: advisor.designation,
        yearsExperience: advisor.yearsExperience,
        expertiseTags: advisor.expertiseTags,
        certificate: advisor.certificate,
        fees: advisor.fees,
        email: advisor.email,
        reviews,
      },
    });
  } catch (err) {
    console.error("Error fetching advisor by ID:", err);
    res.status(500).json({ error: "Failed to fetch advisor" });
  }
};


// --------------------
// CREATE GlossaryTerm
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
// GET All GlossaryTerms
// --------------------
export const getAllGlossaryTerms = async (req, res) => {
  try {
    // Get query params (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate offset
    const skip = (page - 1) * limit;

    // Fetch paginated terms
    const [terms, total] = await Promise.all([
      prisma.glossaryTerm.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.glossaryTerm.count(),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: terms,
    });
  } catch (error) {
    console.error("Error fetching glossary terms:", error);
    res.status(500).json({ error: "Failed to fetch glossary terms" });
  }
};

// --------------------
// UPDATE GlossaryTerm
// --------------------
export const updateGlossaryTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, word, definition } = req.body;

    const updatedTerm = await prisma.glossaryTerm.update({
      where: { id },
      data: { tag, word, definition },
    });

    res.json(updatedTerm);
  } catch (error) {
    console.error("Error updating glossary term:", error);
    res.status(500).json({ error: "Failed to update glossary term" });
  }
};

// --------------------
// DELETE GlossaryTerm
// --------------------
export const deleteGlossaryTerm = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.glossaryTerm.delete({
      where: { id },
    });

    res.json({ message: "Glossary term deleted successfully" });
  } catch (error) {
    console.error("Error deleting glossary term:", error);
    res.status(500).json({ error: "Failed to delete glossary term" });
  }
};






