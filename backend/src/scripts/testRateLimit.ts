
import { checkEmailRateLimit } from "../services/rateLimitService";

async function testRateLimit() {
  const testSender = "rate-limit-test@example.com";

  console.log("First request:");
  const firstDelay = await checkEmailRateLimit(testSender);
  console.log("Delay:", firstDelay, "ms");

  console.log("\nSecond request:");
  const secondDelay = await checkEmailRateLimit(testSender);
  console.log("Delay:", secondDelay, "ms");
}

testRateLimit().catch(console.error);
