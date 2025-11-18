import express from "express";

import { protectRoute as protectUser } from "../middleware/auth.middleware.js";

import { protectRoute as protectAdmin } from "../middleware/authAdmin.middleware.js";

import {
    createProviderForm, 
    listProviderForms,
    getProviderFormById,
    updateProviderForm,
    deleteProviderForm
} from "../controllers/providerForm.controller.js";

const router = express.Router();

router.post("/", protectAdmin, createProviderForm);
router.get("/", protectAdmin, listProviderForms);
router.get("/:id", protectUser, getProviderFormById);
router.patch("/:id", protectAdmin, updateProviderForm);
router.delete("/:id", protectAdmin, deleteProviderForm);

export default router;
