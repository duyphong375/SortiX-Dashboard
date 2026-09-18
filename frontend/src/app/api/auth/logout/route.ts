import { NextResponse } from "next/server";
import { NextUsersStore } from "@/app/api/users/store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (userId && typeof userId === "string") {
      NextUsersStore.setOnline(userId, false);
    }
    return NextResponse.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Lỗi xử lý đăng xuất" },
      { status: 500 }
    );
  }
}
