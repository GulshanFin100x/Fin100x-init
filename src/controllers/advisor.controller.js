import prisma from "../lib/prisma.js";


export const reviews = async (req, res) => {
  try {
    const { advisorId, userId, rating, comment } = req.body;

    if (!advisorId || !userId || !rating) {
      return res
        .status(400)
        .json({ error: "advisorId, userId, rating are required" });
    }

    // ✅ create review
    const review = await prisma.review.create({
      data: {
        advisorId,
        userId,
        rating,
        comment,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create review" });
  }
};

export const advisorReview = async (req, res) => {
    try {
        const { advisorId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { advisorId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            }),
            prisma.review.count({ where: { advisorId } }),
        ]);

        res.json({
            reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
};

export const advisorRating = async (req, res) => {
    try {
        const { advisorId } = req.params;

        const stats = await prisma.review.aggregate({
            where: { advisorId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        res.json({
            avgRating: stats._avg.rating || 0,
            totalReviews: stats._count.rating,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rating" });
    }
};

export const addAdvisor = async (req, res) => {
    try {
        const { salutation, firstName, lastName, designation, yearsExperience, expertiseTags, role } = req.body;

        const advisor = await prisma.advisor.create({
            data: {
                salutation,
                firstName,
                lastName,
                designation,
                yearsExperience,
                expertiseTags,
                role,
            },
        });

        res.status(201).json(advisor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/v1/advisor/getAllAdvisorDetails?page=1&limit=5
export const getAllAdvisorDetails = async (req, res) => {
  try {
    // get pagination params (from query or body, I’ll use query)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    // fetch advisors with pagination
    const advisors = await prisma.advisor.findMany({
      skip,
      take: limit,
      include: {
        reviews: true, // if you want advisor reviews as well
      },
    });

    // count total advisors for pagination info
    const totalAdvisors = await prisma.advisor.count();

    res.json({
      page,
      limit,
      totalAdvisors,
      totalPages: Math.ceil(totalAdvisors / limit),
      advisors,
    });
  } catch (error) {
    console.error("Error fetching advisors:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
