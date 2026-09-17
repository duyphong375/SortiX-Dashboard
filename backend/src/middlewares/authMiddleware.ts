import http from "node:http";
import { UserRole } from "@shared/types";
import { UserModel } from "../models/userModel";

export interface AuthenticatedContext {
  userId: string;
  role: UserRole;
  username: string;
  isAuthenticated: boolean;
}

/**
 * Trích xuất và giải mã danh tính người dùng từ Request Headers
 * Hỗ trợ:
 * 1. Authorization: Bearer <token_base64>
 * 2. X-User-Id: <user_id>
 * 3. X-User-Role: <role> (Chỉ dùng cho testing hoặc internal proxy)
 */
export function resolveUserFromRequest(req: http.IncomingMessage): AuthenticatedContext {
  const authHeader = req.headers.authorization;
  const xUserId = req.headers["x-user-id"] as string | undefined;
  const xUserRole = req.headers["x-user-role"] as string | undefined;

  // 1. Kiểm tra Bearer Token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const tokenStr = authHeader.slice(7).trim();
      const decodedJson = JSON.parse(Buffer.from(tokenStr, "base64").toString("utf-8"));
      if (decodedJson && decodedJson.id) {
        const dbUser = UserModel.findById(decodedJson.id);
        if (dbUser && dbUser.status === "active") {
          return {
            userId: dbUser.id,
            role: dbUser.role,
            username: dbUser.username,
            isAuthenticated: true,
          };
        }
      }
    } catch {
      // Bỏ qua lỗi parse token không hợp lệ
    }
  }

  // 2. Kiểm tra X-User-Id
  if (xUserId) {
    const dbUser = UserModel.findById(xUserId);
    if (dbUser && dbUser.status === "active") {
      return {
        userId: dbUser.id,
        role: dbUser.role,
        username: dbUser.username,
        isAuthenticated: true,
      };
    }
  }

  // 3. Fallback theo header role (dành cho kiểm thử hoặc demo mode)
  if (xUserRole === "admin" || xUserRole === "user") {
    return {
      userId: xUserId || (xUserRole === "admin" ? "admin-001" : "user-anonymous"),
      role: xUserRole as UserRole,
      username: xUserRole,
      isAuthenticated: true,
    };
  }

  // 4. Default Guest Context: vai trò 'user' (KHÔNG tự động cấp quyền admin)
  return {
    userId: "guest",
    role: "user",
    username: "guest",
    isAuthenticated: false,
  };
}

/**
 * Kiểm tra phân quyền RBAC
 * Trả về HTTP 403 Forbidden nếu vai trò hiện tại không nằm trong danh sách cho phép
 */
export function checkRolePermission(
  currentRole: UserRole,
  allowedRoles: UserRole[]
): { allowed: boolean; status?: number; error?: string } {
  if (allowedRoles.includes(currentRole)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    status: 403,
    error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (Admin)",
  };
}
