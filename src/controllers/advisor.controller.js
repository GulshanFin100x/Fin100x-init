import prisma from "../lib/prisma.js";
import { generateSignedUrl } from "../utils/gcp.js";
import {
  createMeetingWithGoogleMeet,
  getAdvisorScheduleFromGoogle,
} from "../utils/googleCalendar.js";


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
          fees : advisor.fees,
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


// --------------------
// GET /api/v1/advisor/tags (fetch all unique expertise tags)
// --------------------
export const getAllTags = async (req, res) => {
  try {
    // Fetch all advisors with tags
    const advisors = await prisma.advisor.findMany({
      select: { expertiseTags: true },
    });

    // Flatten and deduplicate tags
    const allTags = [
      ...new Set(advisors.flatMap((advisor) => advisor.expertiseTags)),
    ];

    res.json({
      count: allTags.length,
      tags: allTags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};




// Start of changes by Suyash 

export const bookCallWithAdvisor = async (req, res) => {
  try {
    const { userId, advisorId, startTime, endTime } = req.body;

    if (!userId || !advisorId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Missing required fields in request body" });
    }

    // Fetch user and advisor to get their emails (assuming you store emails in separate place or get from elsewhere)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
    });

    if (!user || !advisor) {
      return res.status(400).json({ error: "Invalid userId or advisorId" });
    }

    // For demonstration, assume user and advisor email are stored in phone (replace as per your data)
    // In real use, you should add proper email fields or pass emails explicitly
    // const userEmail = user.phone + "@example.com"; // Placeholder mapping
    const userEmail = "gulshan@fin100x.ai";
    const advisorEmail =
      advisor.yearsExperience > 0
        ? "advisor@example.com"
        : "advisor@example.com"; // Replace accordingly

    console.log("User Email:", userEmail);
    console.log("Advisor Email:", advisorEmail);

    const event = await createMeetingWithGoogleMeet({
      summary: "Advisor Consultation Call",
      description: `Meeting booked by user ${userId}`,
      attendeesEmails: [userEmail, advisorEmail],
      startDateTime: startTime,
      endDateTime: endTime,
    });

    const meeting = await prisma.meeting.create({
      data: {
        userId,
        advisorId,
        meetLink: event.conferenceData.entryPoints[0].uri,
        eventId: event.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    res.json({ success: true, meeting });
  } catch (error) {
    console.error("Book call error:", error);
    res.status(500).json({ error: "Failed to book call" });
  }
};

export const getAdvisorCalendarSchedule = async (req, res) => {
  try {
    const { advisorId, timeMin, timeMax } = req.query;

    if (!advisorId || !timeMin || !timeMax) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters" });
    }

    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
    });
    if (!advisor) {
      return res.status(400).json({ error: "Invalid advisorId" });
    }

    // Use a fixed calendar id or advisor email if you have (using 'primary' here as placeholder)
    // Replace with actual calendarId if available


    const calendarId = "primary";

    const events = await getAdvisorScheduleFromGoogle({
      calendarId,
      timeMin,
      timeMax,
    });

    res.json({ events });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    res.status(500).json({ error: "Failed to fetch advisor schedule." });
  }
};

//End of changes by Suyash