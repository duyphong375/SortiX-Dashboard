"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, UserRole, PermissionAction, hasPermission, MOCK_USERS } from "@/lib/permissions";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  checkPermission: (action: PermissionAction) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "pbl3_auth_user";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function isValidStoredUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  if (candidate.role !== "admin" && candidate.role !== "user") return false;
  if (typeof candidate.loginTime !== "string") return false;
  const loginAt = Date.parse(candidate.loginTime);
  if (!Number.isFinite(loginAt) || Date.now() - loginAt > SESSION_TTL_MS || loginAt > Date.now() + 60_000) return false;
  // Restore canonical profile data instead of trusting editable localStorage fields.
  const template = MOCK_USERS.find((item) => item.role === candidate.role);
  return Boolean(template);
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
          const template = MOCK_USERS.find((item) => item.role === parsed.role)!;
          setUser({ ...template, loginTime: parsed.loginTime });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
    }
    setIsLoaded(true);
  }, []);

  const login = useCallback((role: UserRole) => {
    const template = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    const authUser: AuthUser = {
      ...template,
      loginTime: new Date().toISOString(),
    };
    setUser(authUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } catch {
      // The in-memory session remains usable when storage is unavailable/full.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
  }, []);

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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, checkPermission }}>
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
