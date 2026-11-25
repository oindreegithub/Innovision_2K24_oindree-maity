
import { redis } from "../config/redis";

const MIN_DELAY_MS = Number(process.env.MIN_EMAIL_DELAY_MS) || 2000;
const MAX_EMAILS_PER_HOUR =
  Number(process.env.MAX_EMAILS_PER_HOUR) || 200;

export async function checkEmailRateLimit(senderEmail: string) {
  const now = Date.now();

  const key = `email-rate-limit:${senderEmail.toLowerCase()}`;

  const result = await redis.eval(
    `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local minDelay = tonumber(ARGV[2])
    local hourlyLimit = tonumber(ARGV[3])

    local lastSent = tonumber(redis.call("GET", key .. ":last") or "0")

    local hourKey = key .. ":hour:" .. math.floor(now / 3600000)

    local currentCount = tonumber(redis.call("GET", hourKey) or "0")

    local delay = 0

    if now - lastSent < minDelay then
      delay = minDelay - (now - lastSent)
    end

    if currentCount >= hourlyLimit then
      local nextHour = (math.floor(now / 3600000) + 1) * 3600000
      local hourDelay = nextHour - now

      if hourDelay > delay then
        delay = hourDelay
      end
    end

    if delay > 0 then
      return delay
    end

    redis.call("SET", key .. ":last", now)
    redis.call("INCR", hourKey)
    redis.call("EXPIRE", hourKey, 7200)

    return 0
    `,
    1,
    key,
    now,
    MIN_DELAY_MS,
    MAX_EMAILS_PER_HOUR
  );

  return Number(result);
}
