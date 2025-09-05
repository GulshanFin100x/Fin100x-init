import express from "express";
import "dotenv/config";
import cors from "cors";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import advisorRoutes from "./routes/advisor.route.js";
import authRoutes from "./routes/auth.route.js";
import bannerRoutes from "./routes/banner.route.js";

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: "*", // allow everyone
  })
);

app.use(express.json());

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/advisor", advisorRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/banner", bannerRoutes);

// app.get("/profile", protectRoute);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});