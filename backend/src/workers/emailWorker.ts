
import "dotenv/config";

import { Worker, DelayedError } from "bullmq";
import { redis } from "../config/redis";
import { pool } from "../config/database";
import { sendEmail } from "../services/emailService";
import { checkEmailRateLimit } from "../services/rateLimitService";
import { notifySlackRateLimit } from "../services/slackNotificationService";
import { indexEmail } from "../services/emailSearchService";

const emailWorker = new Worker(
  "email-scheduler",
  async (job) => {
    console.log("Processing email job:", job.id);

    const { emailId } = job.data;

    // 1. Fetch email from PostgreSQL
    const result = await pool.query(
      "SELECT * FROM scheduled_emails WHERE id = $1",
      [emailId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Email ${emailId} not found`);
    }

    const email = result.rows[0];

    // 2. Prevent sending an already-sent email
    if (email.status === "sent") {
      console.log(`Email ${emailId} already sent. Skipping.`);
      return;
    }

    // 3. Check sender rate limit
    const delay = await checkEmailRateLimit(email.sender_email);

    if (delay > 0) {
      console.log(
        `Rate limit reached for ${email.sender_email}. Rescheduling in ${delay}ms`
      );

      // Notify connected Slack workspace
      await notifySlackRateLimit(email.sender_email, delay);

      // Move job to delayed state
      await job.moveToDelayed(Date.now() + delay, job.token);

      throw new DelayedError();
    }

    // 4. Update email status
    await pool.query(
      `UPDATE scheduled_emails
       SET status = 'queued'
       WHERE id = $1`,
      [emailId]
    );

    // 5. Send email through Ethereal SMTP
    const info = await sendEmail(
      email.sender_email,
      email.recipient_email,
      email.subject,
      email.body
    );

    // 6. Update PostgreSQL after successful sending
    const updateResult = await pool.query(
      `UPDATE scheduled_emails
       SET status = 'sent',
           sent_at = NOW(),
           error_message = NULL
       WHERE id = $1
       RETURNING *`,
      [emailId]
    );

    const sentEmail = updateResult.rows[0];

    // 7. Update Elasticsearch index
    try {
      await indexEmail(sentEmail);
      console.log(`Email ${emailId} updated in Elasticsearch.`);
    } catch (error) {
      console.error("Elasticsearch indexing error:", error);
    }

    console.log("Email delivered to Ethereal test inbox.");
    console.log("Message ID:", info.messageId);
  },
  {
    connection: redis,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  }
);

// Worker completed event
emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

// Worker failed event
emailWorker.on("failed", async (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      const { emailId } = job.data;

      const result = await pool.query(
        `UPDATE scheduled_emails
         SET status = 'failed',
             error_message = $1
         WHERE id = $2
           AND status != 'sent'
         RETURNING *`,
        [error.message, emailId]
      );

      if (result.rows[0]) {
        try {
          await indexEmail(result.rows[0]);
        } catch (indexError) {
          console.error("Failed to index failed email:", indexError);
        }
      }
    } catch (dbError) {
      console.error("Failed to update email status:", dbError);
    }
  }
});

console.log("BullMQ email worker started!");

export default emailWorker;
