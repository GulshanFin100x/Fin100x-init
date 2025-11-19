import prisma from "../lib/prisma.js";

import Joi from "joi";


// ---------- Validation Schemas ----------
const createSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  formId: Joi.string().max(200).required(),
  title: Joi.string().max(250).allow("", null),
  description: Joi.string().allow("", null),
  fields: Joi.any().required(), // expecting JSON array/object describing fields
  submitButton: Joi.any().optional(),
  metadata: Joi.any().optional(),
});

const updateSchema = Joi.object({
  formId: Joi.string().max(200).optional(),
  title: Joi.string().max(250).optional().allow("", null),
  description: Joi.string().optional().allow("", null),
  fields: Joi.any().optional(),
  submitButton: Joi.any().optional(),
  metadata: Joi.any().optional(),
});

// ---------- Controllers ----------

// Create ProviderForm for a given providerId

export const createProviderForm = async (req, res) => {
  try {
    const body = { ...req.body, providerId: req.params.providerId };
    const { error, value } = createSchema.validate(body, {
      stripUnknown: true,
    });
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details.map((d) => d.message) });

    // Ensure provider exists
    const provider = await prisma.loanProvider.findUnique({
      where: { id: value.providerId },
    });
    if (!provider)
      return res
        .status(404)
        .json({ success: false, error: "LoanProvider not found" });

    // Optionally: ensure uniqueness of formId per provider
    const existing = await prisma.providerForm.findFirst({
      where: { providerId: value.providerId, formId: value.formId },
    });
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          error: "Provider already has a form with this formId",
        });

    const created = await prisma.providerForm.create({ data: value });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("createProviderForm error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Get list of forms for a provider with optional pagination and search on formId/title

// controllers/providerForm.controller.js

export const listProviderForms = async (req, res) => {
  try {
    // optional route param
    const providerId = req.params.providerId || null;

    // pagination only used for the "list all" case
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * take;

    // If providerId provided -> fetch single form by providerId (unique)
    if (providerId) {
      const form = await prisma.providerForm.findUnique({
        where: { providerId },
      });

      if (!form) {
        return res.status(404).json({ success: false, error: "ProviderForm not found for this provider" });
      }
      return res.json({ success: true, data: form });
    }

    // No providerId -> list all forms (paginated). Allow optional search.
    const where = {};
    if (search) {
      where.OR = [
        { formId: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.providerForm.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.providerForm.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { total, page: pageNum, limit: take },
    });
  } catch (err) {
    console.error("listProviderForms error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// Get a single ProviderForm by id (ensure it belongs to providerId)

export const getProviderFormById = async (req, res) => {
  try {
    const { providerId, id } = req.params;
    const form = await prisma.providerForm.findUnique({ where: { id } });
    if (!form || form.providerId !== providerId)
      return res
        .status(404)
        .json({
          success: false,
          error: "ProviderForm not found for this provider",
        });
    return res.json({ success: true, data: form });
  } catch (err) {
    console.error("getProviderFormById error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Update ProviderForm (partial)

export const updateProviderForm = async (req, res) => {
  try {
    const providerId = req.params.providerId; // provider's id from route
    if (!providerId) {
      return res
        .status(400)
        .json({ success: false, error: "providerId param is required" });
    }

    const { error, value } = updateSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details.map((d) => d.message) });
    }

    // find existing form by providerId (providerId is unique in ProviderForm)
    const form = await prisma.providerForm.findUnique({
      where: { providerId },
    });
    if (!form) {
      return res
        .status(404)
        .json({
          success: false,
          error: "ProviderForm not found for this provider",
        });
    }

    // If changing formId, ensure no other providerForm (other provider) already uses that formId
    if (value.formId && value.formId !== form.formId) {
      const conflict = await prisma.providerForm.findFirst({
        where: {
          formId: value.formId,
          NOT: { providerId }, // exclude current provider's form
        },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          error: "Another provider already uses this formId",
        });
      }
    }

    // Perform update by providerId (providerId is unique so this is valid)
    const updated = await prisma.providerForm.update({
      where: { providerId },
      data: value,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateProviderForm error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

// Delete ProviderForm
 
export const deleteProviderForm = async (req, res) => {
  try {
    // Accept id from params — ignore providerId if present
    const providerId = req.params.providerId;
    if (!providerId) {
      return res
        .status(400)
        .json({ success: false, error: "Form id is required" });
    }

    // Find the form by its id
    const form = await prisma.providerForm.findUnique({
      where: { providerId },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: "ProviderForm not found",
      });
    }

    // Delete the form
    await prisma.providerForm.delete({ where: { providerId } });

    return res.status(204).send();
  } catch (err) {
    console.error("deleteProviderForm error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};