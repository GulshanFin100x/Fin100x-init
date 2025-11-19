import prisma from "../lib/prisma.js";

import Joi from "joi";

// ---------- Validation Schemas ----------
const createSchema = Joi.object({
  name: Joi.string().max(100).required(),
  displayName: Joi.string().max(150).allow("", null),
  code: Joi.string().max(50).required(),
  category: Joi.string().required(),
  logoUrl: Joi.string().uri().allow("", null),
  description: Joi.string().allow("", null),
  apiBaseUrl: Joi.string().uri().required(),
  apiVersion: Joi.string().allow("", null),
  authType: Joi.string()
    .valid("OAUTH2", "API_KEY", "BEARER_TOKEN", "BASIC_AUTH", "CUSTOM")
    .required(),
  authConfig: Joi.any().optional(),
  maxLoanAmount: Joi.number().positive().optional().allow(null),
  minLoanAmount: Joi.number().positive().optional().allow(null),
  minCreditScore: Joi.number().integer().min(0).optional().allow(null),
  supportedTenures: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  interestRateRange: Joi.string().optional().allow(null),
  processingFee: Joi.number().precision(2).optional().allow(null),
  isActive: Joi.boolean().optional(),
  supportsInstantApproval: Joi.boolean().optional(),
  supportsEmi: Joi.boolean().optional(),
  supportsTopup: Joi.boolean().optional(),
  requiresKyc: Joi.boolean().optional(),
  rateLimit: Joi.number().integer().optional(),
  timeout: Joi.number().integer().optional(),
  webhookUrl: Joi.string().uri().optional().allow(null),
  webhookSecret: Joi.string().optional().allow(null),
  webhookEvents: Joi.array().items(Joi.string()).optional(),
  priority: Joi.number().integer().optional(),
  metadata: Joi.any().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  displayName: Joi.string().max(150).allow("", null).optional(),
  code: Joi.string().max(50).optional(),
  category: Joi.string().optional(),
  logoUrl: Joi.string().uri().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  apiBaseUrl: Joi.string().uri().optional(),
  apiVersion: Joi.string().allow("", null).optional(),
  authType: Joi.string()
    .valid("OAUTH2", "API_KEY", "BEARER_TOKEN", "BASIC_AUTH", "CUSTOM")
    .optional(),
  authConfig: Joi.any().optional(),
  maxLoanAmount: Joi.number().positive().optional().allow(null),
  minLoanAmount: Joi.number().positive().optional().allow(null),
  minCreditScore: Joi.number().integer().min(0).optional().allow(null),
  supportedTenures: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  interestRateRange: Joi.string().optional().allow(null),
  processingFee: Joi.number().precision(2).optional().allow(null),
  isActive: Joi.boolean().optional(),
  supportsInstantApproval: Joi.boolean().optional(),
  supportsEmi: Joi.boolean().optional(),
  supportsTopup: Joi.boolean().optional(),
  requiresKyc: Joi.boolean().optional(),
  rateLimit: Joi.number().integer().optional(),
  timeout: Joi.number().integer().optional(),
  webhookUrl: Joi.string().uri().optional().allow(null),
  webhookSecret: Joi.string().optional().allow(null),
  webhookEvents: Joi.array().items(Joi.string()).optional(),
  priority: Joi.number().integer().optional(),
  metadata: Joi.any().optional(),
});

// ---------- Controllers ----------

// Create a new LoanProvider
export const createLoanProvider = async(req, res) =>{
  try {
    const { error, value } = createSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details.map((d) => d.message) });

    // Ensure unique constraints (name, code) handled by Prisma - catch unique error
    const provider = await prisma.loanProvider.create({ data: value });
    return res.status(201).json({ success: true, data: provider });
  } catch (err) {
    if (err.code === "P2002") {
      // Prisma unique constraint failed
      const target =
        err.meta && err.meta.target
          ? err.meta.target.join(", ")
          : "unique field";
      return res
        .status(409)
        .json({ success: false, error: `${target} must be unique` });
    }
    console.error("createLoanProvider error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Get list of providers (with optional filters, pagination)
export const getLoanProviders = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isActive, search } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (category) where.category = category;
    if (typeof isActive !== "undefined")
      where.isActive = isActive === "true" || isActive === "1";
    if (search)
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];

    const [items, total] = await Promise.all([
      prisma.loanProvider.findMany({
        where,
        skip,
        take,
        orderBy: { priority: "desc" },
      }),
      prisma.loanProvider.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { total, page: parseInt(page, 10), limit: take },
    });
  } catch (err) {
    console.error("getLoanProviders error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Get single provider by id
export const getLoanProviderById = async (req, res) => {
  try {
    const { providerId : id } = req.params;
    const provider = await prisma.loanProvider.findUnique({
      where: { id },
    });
    if (!provider)
      return res
        .status(404)
        .json({ success: false, error: "LoanProvider not found" });
    return res.json({ success: true, data: provider });
  } catch (err) {
    console.error("getLoanProviderById error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Update provider (partial)
export const updateLoanProvider = async(req, res) => {
  try {
    const { providerId : id } = req.params;
    const { error, value } = updateSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details.map((d) => d.message) });

    // Ensure provider exists
    const exists = await prisma.loanProvider.findUnique({
      where: { id },
    });
    if (!exists)
      return res
        .status(404)
        .json({ success: false, error: "LoanProvider not found" });

    const updated = await prisma.loanProvider.update({
      where: { id },
      data: value,
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err.code === "P2002") {
      const target =
        err.meta && err.meta.target
          ? err.meta.target.join(", ")
          : "unique field";
      return res
        .status(409)
        .json({ success: false, error: `${target} must be unique` });
    }
    console.error("updateLoanProvider error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Delete provider
export const deleteLoanProvider = async (req, res) => {
  try {
    const { providerId : id } = req.params;

    // Option A: Soft-delete (recommended) - set isActive = false or add deletedAt
    // For this schema we will hard delete. If you want soft delete, replace with update.

    // Ensure exists
    const exists = await prisma.loanProvider.findUnique({ where: { id } });
    if (!exists)
      return res
        .status(404)
        .json({ success: false, error: "LoanProvider not found" });

    await prisma.loanProvider.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error("deleteLoanProvider error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
