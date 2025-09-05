import prisma from "../lib/prisma.js";
import { generateSignedUrl } from "../utils/gcp.js";

// GET /api/v1/banners
export const getBanners = async (req, res) => {
  try {
    const today = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        validFrom: { lte: today },
        validTill: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    });

    // Replace fileName with signed URL
    const bannersWithUrls = await Promise.all(
      banners.map(async (banner) => {
        const signedUrl = await generateSignedUrl(banner.imageUrl);
        return { ...banner, imageUrl: signedUrl };
      })
    );

    res.json(bannersWithUrls);
  } catch (err) {
    console.error("Error fetching banners:", err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// POST /api/v1/banners
export const createBanner = async (req, res) => {
  try {
    const { title, imageUrl, redirectUrl, screen, validFrom, validTill } = req.body;

    const banner = await prisma.banner.create({
      data: { title, imageUrl, redirectUrl, screen, validFrom, validTill },
    });

    res.status(201).json(banner);
  } catch (err) {
    console.error("Error creating banner:", err);
    res.status(500).json({ error: "Failed to create banner" });
  }
};
