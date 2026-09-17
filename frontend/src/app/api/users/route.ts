import { NextResponse } from "next/server";
import { AdminCreateUserSchema } from "@shared/schemas";
import { NextUsersStore, toSafeUser } from "./store";

function checkAdminAuth(request: Request): { isAuthorized: boolean; userId: string; error?: string } {
  const authHeader = request.headers.get("authorization");
  const xUserRole = request.headers.get("x-user-role");
  const xUserId = request.headers.get("x-user-id");

  if (xUserRole === "admin") {
    return { isAuthorized: true, userId: xUserId || "admin-001" };
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7).trim();
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (decoded && decoded.role === "admin") {
        return { isAuthorized: true, userId: decoded.id || "admin-001" };
      }
    } catch {
      // invalid token
    }
  }

  // Cho phép chế độ development local nếu có x-user-id nhưng chưa đặt header role
  if (xUserId && xUserId.startsWith("admin")) {
    return { isAuthorized: true, userId: xUserId };
  }

  return { isAuthorized: false, userId: "", error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (Admin)" };
}

export async function GET(request: Request) {
  const auth = checkAdminAuth(request);
  if (!auth.isAuthorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: 403 });
  }

  const users = NextUsersStore.getAll();
  return NextResponse.json({ success: true, data: users });
}

export async function POST(request: Request) {
  const auth = checkAdminAuth(request);
  if (!auth.isAuthorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parseResult = AdminCreateUserSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const input = parseResult.data;
    if (NextUsersStore.findByUsername(input.username)) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập đã tồn tại trong hệ thống" },
        { status: 400 }
      );
    }
    if (NextUsersStore.findByEmail(input.email)) {
      return NextResponse.json(
        { success: false, message: "Địa chỉ email đã được sử dụng" },
        { status: 400 }
      );
    }

    const newUser = NextUsersStore.create({
      full_name: input.full_name,
      username: input.username,
      email: input.email,
      password_hash: input.password,
      role: input.role,
      status: input.status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tạo tài khoản người dùng thành công",
        data: toSafeUser(newUser),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý tạo người dùng";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
