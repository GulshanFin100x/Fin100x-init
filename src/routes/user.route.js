import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getQuiz, chat , addUser} from "../controllers/user.controller.js";

const router = express.Router();

// router.use(protectRoute);

router.get("/chat", chat);
router.get("/quiz", getQuiz);
router.post("/users", addUser);
// router.post("/KYC/aadhar", onboardUser);
// router.post("/KYC/pan", onboardUser);
// router.post("/KYC/bankDetails", onboardUser);
// router.get("/profile", getUserDeatils);
// router.get("/shorts", getShorts);
// router.get("/videos", getvideos);
// router.get("/news", getnews);


export default router;