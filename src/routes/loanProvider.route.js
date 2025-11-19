import express from "express";

import { protectRoute as protectUser } from "../middleware/auth.middleware.js";

import { protectRoute as protectAdmin } from "../middleware/authAdmin.middleware.js";

import {
  createLoanProvider,
  getLoanProviders,
  getLoanProviderById,
  updateLoanProvider,
  deleteLoanProvider,
} from "../controllers/loanProvider.controller.js";

const router = express.Router();

router.post("/", protectAdmin, createLoanProvider);
router.get("/", protectUser, getLoanProviders);
router.get("/:providerId", protectUser, getLoanProviderById);
router.patch("/:providerId", protectAdmin, updateLoanProvider);
router.delete("/:providerId", protectAdmin, deleteLoanProvider);

export default router;
