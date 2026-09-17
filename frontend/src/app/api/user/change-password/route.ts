import { NextResponse } from "next/server";
import { ChangePasswordSchema } from "@shared/schemas";
import { NextUsersStore } from "@/app/api/users/store";
import { DEMO_PASSWORDS } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const xUserId = request.headers.get("x-user-id");
    let currentUserId = xUserId || "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7).trim();
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
        if (decoded && decoded.id) {
          currentUserId = decoded.id;
        }
      } catch {
        // Bỏ qua lỗi parse token
      }
    }

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để đổi mật khẩu" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = ChangePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { current_password, new_password } = parseResult.data;

    // Tìm user trong NextUsersStore hoặc theo ID/Email/Username
    const rawUsers = NextUsersStore.getAllRaw();
    const user =
      NextUsersStore.findById(currentUserId) ||
      rawUsers.find((u) => u.id === currentUserId) ||
      rawUsers.find((u) => u.username.toLowerCase() === currentUserId.toLowerCase()) ||
      rawUsers.find((u) => u.email.toLowerCase() === currentUserId.toLowerCase());

    if (!user) {
      return NextResponse.json({ success: false, message: "Tài khoản không tồn tại" }, { status: 404 });
    }

    // Kiểm tra mật khẩu hiện tại bằng phương thức verifyPassword chuẩn
    const isCurrentValid = NextUsersStore.verifyPassword(user, current_password);

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu hiện tại không chính xác" },
        { status: 400 }
      );
    }

    // Cập nhật mật khẩu mới vào store bền vững (users.json) và danh sách demo
    NextUsersStore.update(user.id, {
      plain_password: new_password,
      password_hash: new_password,
    });
    DEMO_PASSWORDS[user.email.toLowerCase()] = new_password;
    DEMO_PASSWORDS[user.username.toLowerCase()] = new_password;

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi xử lý đổi mật khẩu";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
