
import { Router } from "express";
import { randomBytes } from "crypto";
import { pool } from "../config/database";
import { redis } from "../config/redis";
import {
  getSlackAuthorizationUrl,
  exchangeSlackCode,
} from "../services/slackService";

const router = Router();

// START SLACK OAUTH
router.get("/connect", async (_req, res) => {
  try {
    const state = randomBytes(32).toString("hex");

    await redis.set(
      `slack-oauth-state:${state}`,
      "valid",
      "EX",
      600
    );

    const authorizationUrl = getSlackAuthorizationUrl(state);

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Slack connection error:", error);
    return res.status(500).send("Unable to start Slack authorization");
  }
});

// SLACK OAUTH CALLBACK
router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (typeof code !== "string" || typeof state !== "string") {
      return res.status(400).send("Invalid Slack OAuth callback");
    }

    // Validate and consume OAuth state
    const savedState = await redis.getdel(
      `slack-oauth-state:${state}`
    );

    if (!savedState) {
      return res.status(403).send("Invalid or expired OAuth state");
    }

    // Exchange authorization code for Slack credentials
    const installation = await exchangeSlackCode(code);

    // Save workspace installation
    await pool.query(
      `INSERT INTO slack_installations
       (workspace_id, workspace_name, bot_user_id, bot_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workspace_id)
       DO UPDATE SET
         workspace_name = EXCLUDED.workspace_name,
         bot_user_id = EXCLUDED.bot_user_id,
         bot_token = EXCLUDED.bot_token,
         installed_at = NOW()`,
      [
        installation.workspaceId,
        installation.workspaceName,
        installation.botUserId,
        installation.botToken,
      ]
    );

    return res.status(200).send(
      "ReachInbox successfully connected to Slack!"
    );
  } catch (error) {
    console.error("Slack OAuth callback error:", error);
    return res.status(500).send("Slack authorization failed");
  }
});

export default router;
