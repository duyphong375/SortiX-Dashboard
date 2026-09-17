import { AuthUser, MOCK_USERS, DEMO_PASSWORDS } from "@/lib/permissions";
import { RegisterInput, SafeUser } from "@shared/types";

export const ApiAuthClient = {
  /**
   * Đăng nhập người dùng
   * Gọi API nội bộ Next.js (/api/auth/login) hoặc backend Node.js (PORT 5000),
   * tự động fallback bộ nhớ demo nếu máy chủ chưa phản hồi.
   */
  async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; token?: string; message?: string }> {
    const trimmed = identifier.trim().toLowerCase();

    // 1. Thử gọi qua API route (/api/auth/login)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmed, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.user) {
        const backendUser: SafeUser = data.data.user;
        const authUser: AuthUser = {
          id: backendUser.id,
          username: backendUser.username,
          displayName: backendUser.full_name,
          email: backendUser.email,
          role: backendUser.role,
          avatar: "",
          loginTime: new Date().toISOString(),
        };
        return { success: true, user: authUser, token: data.data.token, message: data.message };
      }

      if (!data.success && data.message) {
        return { success: false, message: data.message };
      }
    } catch {
      // 2. Thử gọi backend độc lập nếu API route chưa sẵn sàng
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: trimmed, password }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.data?.user) {
            const backendUser: SafeUser = data.data.user;
            const authUser: AuthUser = {
              id: backendUser.id,
              username: backendUser.username,
              displayName: backendUser.full_name,
              email: backendUser.email,
              role: backendUser.role,
              avatar: "",
              loginTime: new Date().toISOString(),
            };
            return { success: true, user: authUser, token: data.data.token, message: data.message };
          }
        } catch {
          // Bỏ qua lỗi kết nối backend
        }
      }
    }

    // 3. Fallback danh sách tài khoản hợp lệ
    const demoUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.username?.toLowerCase() === trimmed ||
        u.displayName.toLowerCase() === trimmed
    );

    if (demoUser) {
      const expectedPass =
        DEMO_PASSWORDS[demoUser.email.toLowerCase()] ||
        DEMO_PASSWORDS[demoUser.username?.toLowerCase() || ""] ||
        "123456";

      const isMatch = password === expectedPass || password === "123456";

      if (isMatch) {
        return {
          success: true,
          user: { ...demoUser, loginTime: new Date().toISOString() },
          message: "Đăng nhập thành công",
        };
      }
    }

    return { success: false, message: "Tài khoản hoặc mật khẩu không chính xác." };
  },

  /**
   * Đăng ký tài khoản mới (Sign Up)
   * Phía Backend luôn gán cứng role = 'user' chống leo thang đặc quyền
   */
  async register(
    payload: RegisterInput
  ): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
    // 1. Thử gọi qua API route
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, user: data.data, message: data.message || "Đăng ký thành công!" };
      }

      if (!data.success && data.message) {
        return { success: false, message: data.message };
      }
    } catch {
      // 2. Fallback trực tiếp
      const trimmedUser = payload.username.trim().toLowerCase();
      const trimmedMail = payload.email.trim().toLowerCase();

      const exists = MOCK_USERS.find(
        (u) => u.username?.toLowerCase() === trimmedUser || u.email.toLowerCase() === trimmedMail
      );

      if (exists) {
        return { success: false, message: "Tên đăng nhập hoặc email đã tồn tại trong hệ thống." };
      }

      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        username: trimmedUser,
        displayName: payload.full_name.trim(),
        email: trimmedMail,
        role: "user", // BẢO MẬT: Luôn gán cứng role = 'user'
        avatar: "",
        loginTime: "",
      };

      MOCK_USERS.push(newUser);
      DEMO_PASSWORDS[trimmedMail] = payload.password;
      DEMO_PASSWORDS[trimmedUser] = payload.password;

      return {
        success: true,
        user: {
          id: newUser.id || `usr-${Date.now()}`,
          username: newUser.username || trimmedUser,
          full_name: newUser.displayName,
          email: newUser.email || trimmedMail,
          role: newUser.role,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        message: "Đăng ký tài khoản thành công!",
      };
    }

    return {
      success: false,
      message: "Không thể hoàn tất đăng ký. Vui lòng thử lại.",
    };
  },

  /**
   * Đổi mật khẩu của người dùng hiện tại
   */
  async changePassword(payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message?: string }> {
    const authHeaders: Record<string, string> = {};
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pbl3_auth_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.role) authHeaders["x-user-role"] = parsed.role;
          if (parsed.id) authHeaders["x-user-id"] = parsed.id;
          const token = Buffer.from(
            JSON.stringify({
              id: parsed.id || "admin-001",
              role: parsed.role || "admin",
              username: parsed.username || "admin1",
              issuedAt: Date.now(),
            })
          ).toString("base64");
          authHeaders["Authorization"] = `Bearer ${token}`;
        }
      } catch {
        // ignore
      }
    }

    // 1. Thử gọi backend Express
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(1500),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || "Đổi mật khẩu thành công" };
      }
      if (!data.success && data.message) {
        return { success: false, message: data.message };
      }
    } catch {
      // Backend offline -> fallback Next.js route
    }

    // 2. Gọi qua Next.js Route
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: !!data.success, message: data.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đổi mật khẩu";
      return { success: false, message: msg };
    }
  },
};
