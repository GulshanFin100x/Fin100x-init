import express from "express";

import { protectRoute } from "../middleware/authAdmin.middleware.js";

import {
  createAdvisor,
  updateAdvisor,
  getAdvisors,
  getAdvisorById,
  deleteAdvisor,
  createGlossaryTerm,
  getAllGlossaryTerms,
  updateGlossaryTerm,
  deleteGlossaryTerm,
  getBanners,
  createBanner,
  updateBanner,
  createQuiz,
  updateQuiz,
  deleteQuiz,   
  getQuizById,
  listQuizzes,
  listMeetings,
} from "../controllers/admin.controller.js";

import multer from "multer";

const router = express.Router();
const upload = multer();             // memory storage for GCP upload

router.use(protectRoute);

//advisor APIs
router.post("/advisors", upload.single("image"), createAdvisor);               //Admin adds advisor
router.patch("/advisors/:id", upload.single("image"), updateAdvisor);         //Admin update advisor
router.get("/advisors", getAdvisors);
router.get("/advisors/:id", getAdvisorById);
router.delete("/advisors/:id", deleteAdvisor);

//dictionary APIs
router.post("/glossary", createGlossaryTerm);
router.get("/glossary", getAllGlossaryTerms);
router.put("/glossary/:id", updateGlossaryTerm);
router.delete("/glossary/:id", deleteGlossaryTerm);

//banner APIs
router.get("/banners", getBanners);
router.post("/banners", upload.single("image"), createBanner);                      //Admin adds banner
router.patch("/banners/:id", upload.single("image"), updateBanner);

//quiz APIs
router.post("/quiz", createQuiz);
router.put("/quiz/:id", updateQuiz);
router.delete("/quiz/:id", deleteQuiz);
router.get("/quiz/:id", getQuizById);
router.get("/quiz", listQuizzes);

//meeting APIs
router.get("/meetings", listMeetings);

export default router;