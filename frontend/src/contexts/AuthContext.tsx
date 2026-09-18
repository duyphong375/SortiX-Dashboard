"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, UserRole, PermissionAction, hasPermission, MOCK_USERS } from "@/lib/permissions";
import { ApiAuthClient } from "@/services/apiAuthClient";
import { RegisterInput } from "@shared/types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (userOrRole: UserRole | AuthUser) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterInput) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkPermission: (action: PermissionAction) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "pbl3_auth_user";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

function isValidStoredUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  if (candidate.role !== "admin" && candidate.role !== "user") return false;
  if (typeof candidate.loginTime !== "string") return false;
  const loginAt = Date.parse(candidate.loginTime);
  if (!Number.isFinite(loginAt) || Date.now() - loginAt > SESSION_TTL_MS || loginAt > Date.now() + 60_000) return false;
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Khôi phục phiên đăng nhập từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isValidStoredUser(parsed)) {
          setUser(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
    }
    setIsLoaded(true);
  }, []);

  const login = useCallback((userOrRole: UserRole | AuthUser) => {
    let authUser: AuthUser;
    if (typeof userOrRole === "string") {
      const template = MOCK_USERS.find((u) => u.role === userOrRole) || MOCK_USERS[0];
      authUser = {
        ...template,
        loginTime: new Date().toISOString(),
      };
    } else {
      authUser = {
        ...userOrRole,
        loginTime: userOrRole.loginTime || new Date().toISOString(),
      };
    }

    setUser(authUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } catch {
      // In-memory session remains usable
    }
  }, []);

  const loginWithCredentials = useCallback(async (identifier: string, password: string) => {
    const result = await ApiAuthClient.login(identifier, password);
    if (result.success && result.user) {
      login(result.user);
      return { success: true, message: result.message };
    }
    return { success: false, message: result.message || "Tài khoản hoặc mật khẩu không chính xác." };
  }, [login]);

  const register = useCallback(async (payload: RegisterInput) => {
    const result = await ApiAuthClient.register(payload);
    return {
      success: result.success,
      message: result.message,
    };
  }, []);

  const logout = useCallback(() => {
    if (user?.id) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
  }, [user]);

  const checkPermission = useCallback(
    (action: PermissionAction): boolean => {
      if (!user) return false;
      return hasPermission(user.role, action);
    },
    [user]
  );

  // Hiển thị loading trong khi khôi phục phiên
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithCredentials,
        register,
        logout,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook truy cập auth state và actions */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được gọi bên trong AuthProvider");
  return ctx;
}

/** Hook kiểm tra quyền cho một action cụ thể */
export function usePermission(action: PermissionAction): boolean {
  const { checkPermission } = useAuth();
  return checkPermission(action);
}
