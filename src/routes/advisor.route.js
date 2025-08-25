import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

// router.post("/getAllAdvisorDetails", getAllAdvisorDetails);     //pagination should be implemented;
// router.get("/profile", getUserDeatils);


export default router;