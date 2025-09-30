import express from "express";
import {
  createQuiz,
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
} from "../controllers/admin.controller.js";

import multer from "multer";

const router = express.Router();
const upload = multer();             // memory storage for GCP upload



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




export default router;