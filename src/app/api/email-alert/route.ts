import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, severity, description, device_id, timestamp } = body;

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.ALERT_EMAIL_TO || user;

    if (!user || !pass || user.includes("your_email")) {
      return NextResponse.json(
        {
          success: false,
          message: "Chưa cấu hình thông tin xác thực SMTP (SMTP_USER/SMTP_PASS) trong .env.local",
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const isCritical = severity === "critical";
    const statusColor = isCritical ? "#ef4444" : "#f59e0b";
    const statusTitle = isCritical ? "CẢNH BÁO NGUY HIỂM - MỨC NGHIÊM TRỌNG" : "CẢNH BÁO VẬN HÀNH - CẢNH BÁO";

    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
      : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #334155; color: #f8fafc;">
        <div style="background: ${statusColor}; padding: 18px 24px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.5px;">${statusTitle}</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #94a3b8; margin-top: 0;">
            Hệ thống phân loại IoT (ESP32-C5 và camera AI) ghi nhận một sự kiện cần chú ý:
          </p>
          <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Mã Thiết Bị:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #38bdf8;">${device_id || "sorter_01"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Loại Sự Kiện:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #f8fafc;">${event_type || "SYSTEM_EVENT"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Mô Tả Chi Tiết:</td>
                <td style="padding: 6px 0; color: #f8fafc;">${description || "Chưa có mô tả"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Thời Gian:</td>
                <td style="padding: 6px 0; color: #e2e8f0;">${formattedTime}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            Email này được gửi tự động từ bảng điều khiển phân loại IoT PBL3. Vui lòng không trả lời thư này.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Cảnh báo bộ phân loại IoT PBL3" <${user}>`,
      to,
      subject: `[${statusTitle}] ${event_type || "Sự cố băng chuyền"} - ${device_id || "sorter_01"}`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: "Đã gửi email cảnh báo thành công",
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("[Lỗi cảnh báo email]:", error);
    return NextResponse.json(
      { success: false, message: `Lỗi gửi email: ${error.message}` },
      { status: 500 }
    );
  }
}
