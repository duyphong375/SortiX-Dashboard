import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import { allowRequest, clientAddress, hasValidInternalSecret, readAlertPayload } from "../_lib/alertPayload";

const rateLimitCache = new Map<string, number>();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[match]!);
}

export async function POST(req: NextRequest) {
  if (!hasValidInternalSecret(req)) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!allowRequest(rateLimitCache, clientAddress(req))) return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
  try {
    const { event_type, severity, description, device_id, timestamp } = await readAlertPayload(req);
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS;
    const to = process.env.ALERT_EMAIL_TO?.trim() || user;
    if (!user || !pass || user.includes("your_email") || !to || !Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json({ success: false, message: "Chưa cấu hình thông tin SMTP hợp lệ trong .env.local" }, { status: 400 });
    }
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 });
    const isCritical = severity === "critical";
    const statusColor = isCritical ? "#ef4444" : "#f59e0b";
    const statusTitle = isCritical ? "CẢNH BÁO NGUY HIỂM - MỨC NGHIÊM TRỌNG" : "CẢNH BÁO VẬN HÀNH - CẢNH BÁO";
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const safeDeviceId = escapeHtml(device_id), safeEventType = escapeHtml(event_type), safeDescription = escapeHtml(description);
    const htmlContent = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:12px;overflow:hidden;color:#f8fafc"><div style="background:${statusColor};padding:18px 24px;text-align:center"><h2 style="margin:0;color:#fff">${statusTitle}</h2></div><div style="padding:24px"><p style="color:#94a3b8">Hệ thống phân loại IoT ghi nhận một sự kiện cần chú ý:</p><table style="width:100%;font-size:14px"><tr><td>Mã Thiết Bị:</td><td>${safeDeviceId}</td></tr><tr><td>Loại Sự Kiện:</td><td>${safeEventType}</td></tr><tr><td>Mô Tả Chi Tiết:</td><td>${safeDescription}</td></tr><tr><td>Thời Gian:</td><td>${formattedTime}</td></tr></table></div></div>`;
    const info = await transporter.sendMail({ from: `"Cảnh báo bộ phân loại IoT PBL3" <${user}>`, to, subject: `[${statusTitle}] ${event_type} - ${device_id}`, html: htmlContent });
    return NextResponse.json({ success: true, message: "Đã gửi email cảnh báo thành công", messageId: info.messageId });
  } catch (error: unknown) {
    if (error instanceof ZodError || error instanceof SyntaxError || (error instanceof Error && error.message === "CONTENT_TYPE")) return NextResponse.json({ success: false, message: "Dữ liệu cảnh báo không hợp lệ" }, { status: 400 });
    console.error("[Lỗi cảnh báo email]:", error);
    return NextResponse.json({ success: false, message: "Không thể gửi email cảnh báo" }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({ success: false, message: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
}
