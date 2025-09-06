import prisma from "../lib/prisma.js";
import { generateSignedUrl } from "../utils/gcp.js";


export const getAdvisors = async (req, res) => {
  try {
    const { page = 1, limit = 10, expertise, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    let where = {};
    if (expertise) {
      where.expertiseTags = { has: expertise };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch advisors
    const advisors = await prisma.advisor.findMany({
      where,
      skip,
      take,
      include: {
        reviews: {
          select: { rating: true },
        },
      },
    });

    // Map results (exclude raw reviews, add avg + count + signed image URL)
    const data = await Promise.all(
      advisors.map(async (advisor) => {
        const ratings = advisor.reviews.map((r) => r.rating);
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : null;

        return {
          id: advisor.id,
          salutation: advisor.salutation,
          firstName: advisor.firstName,
          lastName: advisor.lastName,
          designation: advisor.designation,
          yearsExperience: advisor.yearsExperience,
          expertiseTags: advisor.expertiseTags,
          certificate: advisor.certificate,
          imageUrl: advisor.imageUrl
            ? await generateSignedUrl(advisor.imageUrl)
            : null,
          rating: avgRating,
          reviewCount: advisor.reviews.length,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt,
        };
      })
    );

    // Total count for pagination
    const total = await prisma.advisor.count({ where });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      advisors: data,
    });
  } catch (error) {
    console.error("Error fetching advisors:", error);
    res.status(500).json({ error: "Failed to fetch advisors" });
  }
};

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
      imageUrl,
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
        imageUrl,
        kycStatus: kycStatus || "none",
      },
    });

    res.status(201).json(advisor);
  } catch (error) {
    console.error("Error creating advisor:", error);
    res.status(500).json({ error: "Failed to create advisor" });
  }
};

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



