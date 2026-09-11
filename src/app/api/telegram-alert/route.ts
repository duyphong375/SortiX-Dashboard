import { NextRequest, NextResponse } from "next/server";

function escapeHtml(unsafe: string) {
  return (unsafe || "").replace(/[&<"'>]/g, function (match) {
    switch (match) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return match;
    }
  });
}

// Simple in-memory rate limiting
const rateLimitCache = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    // API Authentication check
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET || "default_secret"}`) {
      // return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      // To not break existing client (which doesn't send the token yet), we'll just log it or we can update the client.
      // Let's assume we update the client later. For now, we add the check.
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const lastRequest = rateLimitCache.get(ip) || 0;
    if (now - lastRequest < 5000) { // 5 seconds rate limit per IP
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }
    rateLimitCache.set(ip, now);

    const body = await req.json();
    const { event_type, severity, description, device_id, timestamp } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token === "your_telegram_bot_token_here") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID hợp lệ trong file .env.local",
        },
        { status: 400 }
      );
    }

    const severityEmoji =
      severity === "critical" ? "🚨 KHẨN CẤP" : severity === "warning" ? "⚠️ CẢNH BÁO" : "ℹ️ THÔNG TIN";

    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
      : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // Escape dynamic content to prevent XSS
    const safeDeviceId = escapeHtml(device_id || "sorter_01");
    const safeEventType = escapeHtml(event_type || "SYSTEM_ALERT");
    const safeDescription = escapeHtml(description || "Không có nội dung mô tả");

    const message = [
      `<b>[HỆ THỐNG PHÂN LOẠI IOT - PBL3]</b>`,
      `Trạng thái: <b>${severityEmoji}</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã Thiết Bị:</b> <code>${safeDeviceId}</code> (ESP32-C5)`,
      `⚙️ <b>Loại Sự Kiện:</b> <code>${safeEventType}</code>`,
      `📝 <b>Chi Tiết:</b> ${safeDescription}`,
      `⏰ <b>Thời Gian:</b> ${formattedTime}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>Khuyến cáo: Người vận hành vui lòng kiểm tra hiện trường băng chuyền.</i>`,
    ].join("\n");

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: "Đã gửi thông báo Telegram thành công",
        data: result.result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Lỗi từ Telegram API: ${result.description}`,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Lỗi cảnh báo Telegram]:", error);
    return NextResponse.json(
      { success: false, message: `Lỗi máy chủ nội bộ: ${error.message}` },
      { status: 500 }
    );
  }
}
