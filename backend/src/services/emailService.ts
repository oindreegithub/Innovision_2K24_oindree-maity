
import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
  sender: string,
  recipient: string,
  subject: string,
  body: string
) {
  const info = await transporter.sendMail({
    from: sender,
    to: recipient,
    subject,
    text: body,
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

  return info;
}
