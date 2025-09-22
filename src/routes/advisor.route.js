import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  reviews,
  advisorReview,
  advisorRating,
  getAdvisors,
  getAllTags,
  bookCallWithAdvisor, //++ Suyash
  getAdvisorCalendarSchedule, //++ Suyash
} from "../controllers/advisor.controller.js";

const router = express.Router();

router.get("/", getAdvisors);                                   //pagination should be implemented;                        
router.post("/reviews", reviews);                              //User posts review
router.get("/reviews/:advisorId", advisorReview);             //Get all reviews of an advisor with pagination
router.get("/:advisorId/rating", advisorRating);              //Get average rating of an advisor
router.get("/tags", getAllTags);  


// router.use(protectRoute);


//Start of changes by Suyash
router.post("/bookCall", bookCallWithAdvisor);
router.get("/schedule", getAdvisorCalendarSchedule);
//End of changes by Suyash


export default router;