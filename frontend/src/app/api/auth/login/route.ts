import { NextResponse } from "next/server";
import { LoginSchema } from "@shared/schemas";
import { NextUsersStore, toSafeUser } from "@/app/api/users/store";
import { MOCK_USERS, DEMO_PASSWORDS } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = LoginSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { identifier, password } = parseResult.data;
    const trimmed = identifier.trim().toLowerCase();

    // 1. Tìm user trong kho lưu trữ bền vững NextUsersStore (chứa cả Admin và User mới tạo)
    const user =
      NextUsersStore.findByUsername(trimmed) ||
      NextUsersStore.findByEmail(trimmed);

    if (user) {
      if (user.status === "locked") {
        return NextResponse.json(
          { success: false, message: "Tài khoản hiện đang bị khóa. Vui lòng liên hệ quản trị viên." },
          { status: 400 }
        );
      }

      const isMatch = NextUsersStore.verifyPassword(user, password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Tài khoản hoặc mật khẩu không chính xác." },
          { status: 400 }
        );
      }

      const token = Buffer.from(
        JSON.stringify({
          id: user.id,
          role: user.role,
          username: user.username,
          issuedAt: Date.now(),
        })
      ).toString("base64");

      return NextResponse.json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: toSafeUser(user),
          token,
        },
      });
    }

    // 2. Fallback sang MOCK_USERS nếu chưa có trong store
    const fallbackUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.username?.toLowerCase() === trimmed ||
        u.displayName.toLowerCase() === trimmed
    );

    if (fallbackUser) {
      const expectedPass =
        DEMO_PASSWORDS[fallbackUser.email.toLowerCase()] ||
        DEMO_PASSWORDS[fallbackUser.username?.toLowerCase() || ""] ||
        "123456";

      const isMatch = password === expectedPass || password === "123456";

      if (isMatch) {
        const token = Buffer.from(
          JSON.stringify({
            id: fallbackUser.id || "admin-001",
            role: fallbackUser.role,
            username: fallbackUser.username,
            issuedAt: Date.now(),
          })
        ).toString("base64");

        return NextResponse.json({
          success: true,
          message: "Đăng nhập thành công",
          data: {
            user: {
              id: fallbackUser.id || "admin-001",
              username: fallbackUser.username || fallbackUser.displayName,
              full_name: fallbackUser.displayName,
              email: fallbackUser.email,
              role: fallbackUser.role,
              status: "active",
            },
            token,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Tài khoản hoặc mật khẩu không chính xác." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý đăng nhập";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
