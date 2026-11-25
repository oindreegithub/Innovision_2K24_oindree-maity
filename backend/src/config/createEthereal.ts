
import nodemailer from "nodemailer";

async function createEtherealAccount() {
  const account = await nodemailer.createTestAccount();

  console.log("\nYour Ethereal SMTP account:");
  console.log("SMTP_HOST=smtp.ethereal.email");
  console.log("SMTP_PORT=587");
  console.log("SMTP_USER=" + account.user);
  console.log("SMTP_PASS=" + account.pass);
  console.log("\nKeep these credentials private!");
}

createEtherealAccount().catch(console.error);
