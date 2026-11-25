
import { pool } from "../config/database";
import { sendSlackNotification } from "./slackService";

export async function notifySlackRateLimit(
  senderEmail: string,
  delay: number
) {
  try {
    const result = await pool.query(
      `SELECT bot_token
       FROM slack_installations
       ORDER BY installed_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log("No Slack workspace connected.");
      return;
    }

    const botToken = result.rows[0].bot_token;

    const message =
      `⚠️ *ReachInbox Email Rate Limit Reached*\n` +
      `Sender: ${senderEmail}\n` +
      `Email sending has been paused temporarily.\n` +
      `Rescheduled delay: ${Math.ceil(delay / 1000)} seconds.`;

    await sendSlackNotification(botToken, message);

  } catch (error) {
    console.error("Slack notification error:", error);
  }
}
