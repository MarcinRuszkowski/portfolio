import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // liczba żądań na IP
  message:
    "Too many requests from this IP address. Please try again in 15 minutes.",
});
app.use(limiter);

app.post("/send-email", async (req, res) => {
  const { email, subject, text } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Email ERROR" });
  }
  if (!subject || subject.trim().length === 0) {
    return res.status(400).json({ error: "Subject ERROR" });
  }
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Message ERROR" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: email || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: subject,
      text: `From: ${email}\n\n${text}`,
    });
    res.status(200).json({ message: "MESSAGE SENT" });

    await transporter.sendMail({
      from: `"Marcin Ruszkowski" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: "void@gmail.com",
      subject: "Potwierdzenie otrzymania wiadomości",
      text: `Dziękuję za kontakt!\n\nOtrzymałem Twoją wiadomość i skontaktuję się z Tobą wkrótce.\n\nPozdrawiam\n Marcin Ruszkowski`,
      html: `
          <p>Dziękuję za kontakt!</p>
          <p>Otrzymałem Twoją wiadomość i skontaktuję się z Tobą wkrótce.</p>
          <p>Pozdrawiam,<br/>Marcin Ruszkowski</p>
          <hr/>
          <p style="color: red; font-style: italic; font-size: 12px;">To wiadomość systemowa. Proszę nie odpowiadać na ten email.</p>
        `,
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Sending ERROR" });
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

export default app;
