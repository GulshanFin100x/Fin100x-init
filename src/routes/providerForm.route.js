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

router.post("/:providerId", protectAdmin, createProviderForm);
router.get("/:providerId", protectUser, listProviderForms);
router.get("/", protectAdmin, listProviderForms);

//no need of below as such so commented it out -- by gulshan
// router.get("/:providerId", protectAdmin, getProviderFormById);

router.patch("/:providerId", protectAdmin, updateProviderForm);
router.delete("/:providerId", protectAdmin, deleteProviderForm);

export default router;
