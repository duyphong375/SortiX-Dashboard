import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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

    const message = [
      `<b>[HỆ THỐNG PHÂN LOẠI IOT - PBL3]</b>`,
      `Trạng thái: <b>${severityEmoji}</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã Thiết Bị:</b> <code>${device_id || "sorter_01"}</code> (ESP32-C5)`,
      `⚙️ <b>Loại Sự Kiện:</b> <code>${event_type || "SYSTEM_ALERT"}</code>`,
      `📝 <b>Chi Tiết:</b> ${description || "Không có nội dung mô tả"}`,
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
