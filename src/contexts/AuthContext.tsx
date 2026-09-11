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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Khôi phục phiên đăng nhập từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed.role === "admin" || parsed.role === "user") {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
