import "dotenv/config";
import { Queue } from "bullmq";
import { redis } from "./redis";

export const emailQueue = new Queue("email-scheduler", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

console.log("BullMQ email queue initialized");