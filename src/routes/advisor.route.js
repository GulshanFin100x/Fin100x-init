import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  reviews,
  advisorReview,
  advisorRating,
  addAdvisor,
  getAllAdvisorDetails,
  getAdvisors,
  createAdvisor,
} from "../controllers/advisor.controller.js";

const router = express.Router();

// router.use(protectRoute);

router.get("/", getAdvisors);                                   //pagination should be implemented;
router.post("/", createAdvisor);                        
router.post("/reviews", reviews);                              //User posts review
router.get("/reviews/:advisorId", advisorReview);             //Get all reviews of an advisor with pagination
router.get("/:advisorId/rating", advisorRating);              //Get average rating of an advisor
router.post("/advisors", addAdvisor);                        //Admin adds advisor


export default router;