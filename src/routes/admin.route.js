import express from "express";
import {
  createQuiz,
  createAdvisor,
  getAdvisors,
  getAdvisorById,
  createGlossaryTerm,
  getAllGlossaryTerms,
  updateGlossaryTerm,
  deleteGlossaryTerm,
} from "../controllers/admin.controller.js";

const router = express.Router();



// router.post("/quiz", createQuiz);
// router.post("/glossary", createGlossaryTerm);
router.post("/advisors", createAdvisor);                       //Admin adds advisor
router.get("/advisors", getAdvisors);
router.get("/advisors/:id", getAdvisorById);
router.post("/glossary", createGlossaryTerm);
router.get("/glossary", getAllGlossaryTerms);
router.put("/glossary/:id", updateGlossaryTerm);
router.delete("/glossary/:id", deleteGlossaryTerm);

export default router;