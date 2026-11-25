import slackRoutes from "./routes/slackRoutes";
import "dotenv/config";
import express from "express";

import { pool } from "./config/database";
import { redis } from "./config/redis";
import emailRoutes from "./routes/emailRoutes";

// ==================================
// INITIALIZE EXPRESS
// ==================================

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ==================================
// MIDDLEWARE
// ==================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================
// HOMEPAGE
// ==================================

app.get("/", (req, res) => {
  res.send("ReachInbox Email Scheduler API is running!");
});

// ==================================
// HEALTH CHECK
// ==================================

app.get("/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    const redisResult = await redis.ping();

    return res.status(200).json({
      success: true,
      message: "Backend is healthy!",
      database: "Connected",
      redis: redisResult,
      timestamp: dbResult.rows[0].now,
    });

  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Backend health check failed",
    });
  }
});

// ==================================
// EMAIL ROUTES
// ==================================

app.use("/api/emails", emailRoutes);
app.use("/api/slack", slackRoutes);
console.log("EMAIL ROUTES MOUNTED SUCCESSFULLY");

// ==================================
// START SERVER
// ==================================

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("ReachInbox Email Scheduler");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("--------------------------------");
});
