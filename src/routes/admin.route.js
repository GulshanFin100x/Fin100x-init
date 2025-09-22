import express from "express";
import {
  createQuiz,
  createGlossaryTerm,
  createAdvisor,
  getAdvisors,
  getAdvisorById,
} from "../controllers/admin.controller.js";

const router = express.Router();



router.post("/quiz", createQuiz);
router.post("/glossary", createGlossaryTerm);
router.post("/advisors", createAdvisor);                       //Admin adds advisor
router.get("/advisors", getAdvisors);
router.get("/advisors/:id", getAdvisorById);

export default router;