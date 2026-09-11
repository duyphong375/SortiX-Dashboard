"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, usePermission } from "@/contexts/AuthContext";
import { SIDEBAR_MENU } from "@/lib/permissions";
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  History,
  Bell,
  SlidersHorizontal,
  Cpu,
  Users,
  LogOut,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  Layers,
  BarChart3,
  History,
  Bell,
  SlidersHorizontal,
  Cpu,
  Users,
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, alertCount = 0 }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const canViewConfig = usePermission("config.view");
  const canViewDevices = usePermission("devices.view");
  const canViewUsers = usePermission("users.view");

  const permissionCheck = (perm?: string): boolean => {
    if (!perm) return true;
    if (perm === "config.view") return canViewConfig;
    if (perm === "devices.view") return canViewDevices;
    if (perm === "users.view") return canViewUsers;
    return true;
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      } border-slate-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-[#111319] backdrop-blur-xl`}
    >
      {/* Logo Area */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 px-4 dark:border-white/[0.06]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#161822] text-white shadow-sm dark:border-white/10 dark:bg-[#161822] dark:text-white">
          <Boxes className="h-5 w-5 text-cyan-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sorti<span className="text-cyan-500">X</span>
              </h2>
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
                AI PRO
              </span>
            </div>
            <p className="truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
              Intelligent IoT Sorter
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {SIDEBAR_MENU.map((group) => {
          const visibleItems = group.items.filter((item) =>
            permissionCheck(item.requiredPermission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupLabel} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.groupLabel}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150 border ${
                        active
                          ? "bg-slate-100 font-bold text-slate-900 shadow-xs border-slate-200/80 dark:bg-[#1E212D] dark:text-white dark:border-white/20 dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)]"
                          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border-transparent dark:text-slate-400 dark:hover:bg-[#161822] dark:hover:text-white"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cyan-500 dark:bg-cyan-400" />
                      )}
                      <IconComponent
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}
                      />
                      {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                      {!collapsed && item.id === "alerts" && alertCount > 0 && (
                        <span className="ml-auto rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                          {alertCount > 99 ? "99+" : alertCount}
                        </span>
                      )}
                      {collapsed && item.id === "alerts" && alertCount > 0 && (
                        <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#111319]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-white/[0.06] space-y-2">
        {/* System Status */}
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60 dark:bg-[#161822] dark:border-white/[0.07]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-white">
                Hệ thống trực tuyến
              </span>
              <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                ESP32 & Node-RED Sync
              </span>
            </div>
          </div>
        )}

        {/* User Info */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/80 p-2 dark:border-white/[0.07] dark:bg-[#161822]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E212D] border border-white/10 text-xs font-bold text-white shadow-xs">
              {user.role === "admin" ? "AD" : "OP"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {user.displayName}
              </p>
              <span className="inline-block rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/[0.05]">
                {user.role === "admin" ? "Quản Trị Viên" : "Kỹ Thuật Viên"}
              </span>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Thu gọn thanh bên</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/50 bg-rose-50/60 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100/80 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Đăng Xuất</span>}
        </button>
      </div>
    </aside>
  );
};
