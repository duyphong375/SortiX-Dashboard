import { NextResponse } from "next/server";
import { SafetyService } from "@/services/safetyService";
import { UnlockSystemSchema } from "@shared/schemas";

export async function POST(request: Request) {
  try {
    const roleHeader = request.headers.get("x-user-role") || "admin";
    const userIdHeader = request.headers.get("x-user-id") || "admin-001";

    if (roleHeader !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Từ chối truy cập: Chỉ tài khoản Quản trị viên (Admin) mới có quyền mở khóa an toàn hệ thống.",
        },
        { status: 403 }
      );
    }

    let note: string | undefined;
    try {
      const body = await request.json();
      const validated = UnlockSystemSchema.safeParse(body);
      if (validated.success) {
        note = validated.data.note;
      }
    } catch {
      // Body may be empty
    }

    const result = SafetyService.unlockSystem(userIdHeader, note);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Lỗi xử lý request mở khóa" }, { status: 500 });
  }
}
