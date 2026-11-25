
import { Router } from "express";
import { pool } from "../config/database";
import { emailQueue } from "../config/queue";
import {
  indexEmail,
  searchEmails,
} from "../services/emailSearchService";

const router = Router();

// GET all scheduled emails
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM scheduled_emails
       ORDER BY scheduled_at ASC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      emails: result.rows,
    });
  } catch (error) {
    console.error("Fetch emails error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emails",
    });
  }
});

// SEARCH emails using Elasticsearch
router.get("/search", async (req, res) => {
  try {
    const searchTerm = String(req.query.q || "").trim();

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Provide a search term using ?q=",
      });
    }

    const results = await searchEmails(searchTerm);

    return res.status(200).json({
      success: true,
      count: results.length,
      emails: results,
    });
  } catch (error) {
    console.error("Email search error:", error);

    return res.status(500).json({
      success: false,
      message: "Email search failed",
    });
  }
});

// SCHEDULE a new email
router.post("/", async (req, res) => {
  try {
    const {
      sender_email,
      recipient_email,
      subject,
      body,
      scheduled_at,
    } = req.body;

    if (
      !sender_email ||
      !recipient_email ||
      !subject ||
      !body ||
      !scheduled_at
    ) {
      return res.status(400).json({
        success: false,
        message: "All email fields are required",
      });
    }

    const scheduledDate = new Date(scheduled_at);

    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled date",
      });
    }

    const result = await pool.query(
      `INSERT INTO scheduled_emails
       (sender_email, recipient_email, subject, body, scheduled_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        sender_email,
        recipient_email,
        subject,
        body,
        scheduledDate,
      ]
    );

    const email = result.rows[0];

    // Index the email in Elasticsearch
    try {
      await indexEmail(email);
    } catch (error) {
      console.error("Elasticsearch indexing error:", error);
    }

    // Add the email to BullMQ
    const delay = Math.max(
      0,
      scheduledDate.getTime() - Date.now()
    );

    await emailQueue.add(
      "send-email",
      { emailId: email.id },
      {
        jobId: `email-${email.id}`,
        delay,
      }
    );

    console.log("EMAIL ADDED TO BULLMQ:", email.id);

    return res.status(201).json({
      success: true,
      message: "Email scheduled successfully",
      email,
    });
  } catch (error) {
    console.error("Schedule email error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to schedule email",
    });
  }
});

export default router;
