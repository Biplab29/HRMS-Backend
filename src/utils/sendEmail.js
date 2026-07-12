import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
  } = process.env;

  const host = SMTP_HOST || EMAIL_HOST;
  const port = SMTP_PORT || EMAIL_PORT;
  const user = SMTP_USER || EMAIL_USER;
  const pass = SMTP_PASS || EMAIL_PASS;
  const secure = SMTP_SECURE === "true";

  if (!host || !port || !user || !pass) {
    return {
      sent: false,
      reason: "SMTP configuration missing",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465 || secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const fromAddress = host.includes("gmail.com") ? `HRMS <${user}>` : (EMAIL_FROM || user);

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    return {
      sent: true,
    };
  } catch (error) {
    console.error("Nodemailer SMTP execution error:", error);
    return {
      sent: false,
      reason: error.message,
    };
  }
};
