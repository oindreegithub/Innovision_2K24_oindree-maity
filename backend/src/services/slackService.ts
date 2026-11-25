
import "dotenv/config";
import { WebClient } from "@slack/web-api";

export function getSlackAuthorizationUrl(state: string) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Slack OAuth environment variables are missing");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "chat:write",
    redirect_uri: redirectUri,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(code: string) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Slack OAuth credentials are missing");
  }

  const response = await fetch(
    "https://slack.com/api/oauth.v2.access",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    }
  );

  const data = await response.json();

  if (!data.ok || !data.access_token || !data.team?.id) {
    throw new Error(data.error || "Slack OAuth failed");
  }

  return {
    workspaceId: data.team.id,
    workspaceName: data.team.name,
    botUserId: data.bot_user_id,
    botToken: data.access_token,
  };
}


export async function sendSlackNotification(
  botToken: string,
  message: string
) {
  const channelId = process.env.SLACK_CHANNEL_ID;

  if (!channelId) {
    throw new Error("SLACK_CHANNEL_ID is missing from .env");
  }

  const client = new WebClient(botToken);

  const response = await client.chat.postMessage({
    channel: channelId,
    text: message,
  });

  if (!response.ok) {
    throw new Error("Slack notification failed");
  }

  console.log("Slack notification sent successfully!");

  return response;
}

