import prisma from "../lib/prisma.js";

const Joi = require("joi");


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
// POST /api/providers/:providerId/forms
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
// GET /api/providers/:providerId/forms?page=1&limit=20&search=registration
export const listProviderForms = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 20, search } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    // Ensure provider exists
    const provider = await prisma.loanProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider)
      return res
        .status(404)
        .json({ success: false, error: "LoanProvider not found" });

    const where = { providerId };
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.providerForm.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { total, page: parseInt(page, 10), limit: take },
    });
  } catch (err) {
    console.error("listProviderForms error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Get a single ProviderForm by id (ensure it belongs to providerId)
// GET /api/providers/:providerId/forms/:id
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
// PATCH /api/providers/:providerId/forms/:id
export const  updateProviderForm = async (req, res)  => {
  try {
    const { providerId, id } = req.params;
    const { error, value } = updateSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details.map((d) => d.message) });

    const form = await prisma.providerForm.findUnique({ where: { id } });
    if (!form || form.providerId !== providerId)
      return res
        .status(404)
        .json({
          success: false,
          error: "ProviderForm not found for this provider",
        });

    // If formId changed, ensure uniqueness per provider
    if (value.formId && value.formId !== form.formId) {
      const exists = await prisma.providerForm.findFirst({
        where: { providerId, formId: value.formId },
      });
      if (exists)
        return res
          .status(409)
          .json({
            success: false,
            error:
              "Another form with this formId already exists for the provider",
          });
    }

    const updated = await prisma.providerForm.update({
      where: { id },
      data: value,
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateProviderForm error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

// Delete ProviderForm
// DELETE /api/providers/:providerId/forms/:id
export const deleteProviderForm = async (req, res) => {
  try {
    const { providerId, id } = req.params;
    const form = await prisma.providerForm.findUnique({ where: { id } });
    if (!form || form.providerId !== providerId)
      return res.status(404).json({
        success: false,
        error: "ProviderForm not found for this provider",
      });

    await prisma.providerForm.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error("deleteProviderForm error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
