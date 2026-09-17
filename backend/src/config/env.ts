// Cấu hình môi trường cho Backend

export const ENV = {
  PORT: Number(process.env.PORT || 5000),
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET?.trim() || "",
  
  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim() || "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID?.trim() || "",
  
  // SMTP
  SMTP_HOST: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER?.trim() || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO?.trim() || "",
};
