import prisma from "../lib/prisma.js";
import { bucket, generateSignedUrl } from "../utils/gcp.js";

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

// --------------------
// POST /advisors (create new advisor)
// --------------------
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
      email,
    } = req.body;

    let parsedTags = [];
    if (expertiseTags) {
      try {
        parsedTags = JSON.parse(expertiseTags);
      } catch {
        parsedTags = [];
      }
    }

    let imageUrl = null;

    // if image uploaded via multipart/form-data
    if (req.file) {
      const newFileName = `advisor/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(newFileName);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      imageUrl = newFileName;
    }

    const advisor = await prisma.advisor.create({
      data: {
        salutation,
        firstName,
        lastName,
        designation,
        yearsExperience: Number(yearsExperience) || 0,
        expertiseTags: parsedTags || [],
        certificate,
        yearsExperience: Number(yearsExperience) || 0,
        email,
        fees: Number(fees) || 0,
        imageUrl,
      },
    });

    const signedUrl = advisor.imageUrl
      ? await generateSignedUrl(advisor.imageUrl)
      : null;

    res.status(201).json({
      message: "Advisor created",
      advisor: {
        ...advisor,
        imageUrl: signedUrl, // return signed URL in API
      },
    });
  } catch (error) {
    console.error("Error creating advisor:", error);
    res.status(500).json({ error: "Failed to create advisor" });
  }
};

// --------------------
// PATCH /advisors/:id (update advisor details)
// --------------------
export const updateAdvisor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      salutation,
      firstName,
      lastName,
      designation,
      yearsExperience,
      expertiseTags,
      certificate,
      fees,
      email,
      calenderId,
    } = req.body;

    // Handle expertiseTags — can be sent as JSON string
    let parsedTags = [];
    if (expertiseTags) {
      try {
        parsedTags = JSON.parse(expertiseTags);
      } catch {
        parsedTags = Array.isArray(expertiseTags) ? expertiseTags : [];
      }
    }

    let imageUrl;

    // If user sent a new image
    if (req.file) {
      const newFileName = `advisor/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(newFileName);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      imageUrl = newFileName;
    }

    const advisor = await prisma.advisor.update({
      where: { id },
      data: {
        ...(salutation && { salutation }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(designation && { designation }),
        ...(yearsExperience && { yearsExperience: Number(yearsExperience) }),
        ...(expertiseTags && { expertiseTags: parsedTags }),
        ...(certificate && { certificate }),
        ...(fees && { fees: parseFloat(fees) }),
        ...(email && { email }),
        ...(calenderId && { calenderId }),
        ...(imageUrl && { imageUrl }),
      },
    });

    const signedUrl = advisor.imageUrl
      ? await generateSignedUrl(advisor.imageUrl)
      : null;

    res.status(201).json({
      message: "Advisor Updated",
      advisor: {
        ...advisor,
        imageUrl: signedUrl, // return signed URL in API
      },
    });
  } catch (error) {
    console.error("Error updating advisor:", error);
    res.status(500).json({ error: "Failed to update advisor"});
  }
};

// --------------------
// GET /advisors (fetch paginated advisors with avg rating & review count)
// --------------------
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
        imageUrl: true,
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

    const data = await Promise.all(
      advisors.map(async (advisor) => {
        const signedImageUrl = advisor.imageUrl
          ? await generateSignedUrl(advisor.imageUrl)
          : null;

        return {
          ...advisor,
          imageUrl: signedImageUrl,
        };
      })
    );

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
      data: data,
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
// DELETE /advisors/:id (delete advisor by ID)
// --------------------
export const deleteAdvisor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if advisor exists
    const advisor = await prisma.advisor.findUnique({ where: { id } });
    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Delete advisor
    await prisma.advisor.delete({ where: { id } });

    res.status(200).json({
      message: "Advisor deleted successfully",
      deletedAdvisorId: id,
    });
  } catch (error) {
    console.error("Error deleting advisor:", error);
    res.status(500).json({ error: "Failed to delete advisor" });
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

// --------------------
// GET All Banners (paginated)
// --------------------
export const getBanners = async (req, res) => {
  try {
    // pagination params
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // get total count for pagination metadata
    const totalCount = await prisma.banner.count();

    // fetch paginated banners
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Replace fileName with signed URL
    const bannersWithUrls = await Promise.all(
      banners.map(async (banner) => {
        const signedUrl = await generateSignedUrl(banner.imageUrl);
        return { ...banner, imageUrl: signedUrl };
      })
    );

    res.json({
      data: bannersWithUrls,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching banners:", err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// --------------------
// CREATE Banner
// --------------------
export const createBanner = async (req, res) => {
  try {
    const { title, redirectUrl, screen, validFrom, validTill, isActive } =
      req.body;

    let imageUrl = null;

    // if image uploaded via multipart/form-data
    if (req.file) {
      const newFileName = `banner/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(newFileName);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      console.log("Uploaded file to GCP:", file.name);

      imageUrl = newFileName;
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        redirectUrl,
        screen,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTill: validTill ? new Date(validTill) : new Date(),
        isActive: isActive !== undefined ? isActive === "true" : true,
        imageUrl,
      },
    });

    // generate signed URL for response
    const signedUrl = banner.imageUrl
      ? await generateSignedUrl(banner.imageUrl)
      : null;

    res.status(201).json({
      message: "Banner created successfully",
      banner: {
        ...banner,
        imageUrl: signedUrl,
      },
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Failed to create banner" });
  }
};

// --------------------
// UPDATE Banner
// --------------------
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      redirectUrl,
      screen,
      validFrom,
      validTill,
      isActive,
    } = req.body;

    // find banner first
    const existingBanner = await prisma.banner.findUnique({ where: { id } });
    if (!existingBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    let imageUrl = existingBanner.imageUrl;

    // if new image uploaded, overwrite old
    if (req.file) {
      const newFileName = `banner/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(newFileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      imageUrl = newFileName;
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(redirectUrl && { redirectUrl }),
        ...(screen && { screen }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validTill && { validTill: new Date(validTill) }),
        ...(typeof isActive !== "undefined" && {
          isActive: isActive === "true" || isActive === true,
        }),
        imageUrl,
      },
    });

    // generate signed URL for response
    const signedUrl = updatedBanner.imageUrl
      ? await generateSignedUrl(updatedBanner.imageUrl)
      : null;

    res.json({
      message: "Banner updated successfully",
      banner: {
        ...updatedBanner,
        imageUrl: signedUrl,
      },
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ error: "Failed to update banner" });
  }
};


