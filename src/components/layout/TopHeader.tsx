"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Search,
  ChevronRight,
  Menu,
  Clock,
  Wifi,
  WifiOff,
  Command,
  X,
  LayoutDashboard,
  Layers,
  BarChart3,
  History,
  SlidersHorizontal,
  Cpu,
  Users,
  FlaskConical,
  Radio,
} from "lucide-react";

// Map path → breadcrumb labels
const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Tổng Quan",
  "/conveyor": "Băng Tải",
  "/analytics": "Thống Kê & Biểu Đồ",
  "/history": "Lịch Sử Phân Loại",
  "/alerts": "Cảnh Báo & Sự Cố",
  "/config": "Cấu Hình Phân Luồng",
  "/devices": "MQTT & Thiết Bị IoT",
  "/users": "Quản Lý Người Dùng",
};

const SEARCH_LINKS = [
  { label: "Tổng Quan Hệ Thống", href: "/", icon: LayoutDashboard, group: "Điều Hướng" },
  { label: "Băng Tải & Phân Loại 2D", href: "/conveyor", icon: Layers, group: "Điều Hướng" },
  { label: "Thống Kê & Báo Cáo", href: "/analytics", icon: BarChart3, group: "Điều Hướng" },
  { label: "Lịch Sử Phân Loại Chi Tiết", href: "/history", icon: History, group: "Điều Hướng" },
  { label: "Trung Tâm Cảnh Báo & Sự Cố", href: "/alerts", icon: Bell, group: "Điều Hướng" },
  { label: "Cấu Hình Phân Luồng Servo", href: "/config", icon: SlidersHorizontal, group: "Cài Đặt" },
  { label: "Cấu Hình MQTT & Thiết Bị IoT", href: "/devices", icon: Cpu, group: "Cài Đặt" },
  { label: "Quản Lý Tài Khoản & Phân Quyền", href: "/users", icon: Users, group: "Cài Đặt" },
];

interface TopHeaderProps {
  themeMode: "dark" | "light";
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  alertCount?: number;
  onMobileMenuToggle?: () => void;
  mqttStatus?: "connected" | "disconnected" | "error";
  pingMs?: number;
  isSimulation?: boolean;
  onToggleSimulationMode?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  themeMode,
  onToggleTheme,
  isMuted,
  onToggleSound,
  alertCount = 0,
  onMobileMenuToggle,
  mqttStatus = "connected",
  pingMs = 24,
  isSimulation = true,
  onToggleSimulationMode,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentPageName = BREADCRUMB_MAP[pathname] || "Dashboard";

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl + K / Cmd + K Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredLinks = SEARCH_LINKS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#111319]/95 lg:px-6 z-20">
        {/* Left: Breadcrumb & Live Clock */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuToggle}
            aria-label="Menu"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#161822] dark:hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hệ Thống</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">{currentPageName}</span>
          </nav>

          {/* Real-time Industrial Clock */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-100/70 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-500" />
            <span>{currentTime || "--:--:--"}</span>
          </div>
        </div>

        {/* Right: Mode Switcher, MQTT Status, Search, Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ VẬN HÀNH: MÔ PHỎNG <-> THỰC TẾ */}
          <div className="flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 dark:border-white/[0.08] dark:bg-[#161822] shadow-xs">
            {/* Chế độ 1: MÔ PHỎNG (Tím/Cyan) */}
            <button
              type="button"
              onClick={() => {
                if (!isSimulation && onToggleSimulationMode) onToggleSimulationMode();
              }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold transition-all duration-300 ${
                isSimulation
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/25 border border-purple-400/40"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              title="Chuyển sang Chế độ Mô phỏng (Simulation Mode) - Cho phép thả phôi ảo"
            >
              <FlaskConical className={`h-3.5 w-3.5 ${isSimulation ? "animate-pulse" : ""}`} />
              <span className="tracking-wide">MÔ PHỎNG</span>
            </button>

            {/* Chế độ 2: THỰC TẾ (Emerald/Amber kèm đèn nhấp nháy Live Hardware) */}
            <button
              type="button"
              onClick={() => {
                if (isSimulation && onToggleSimulationMode) onToggleSimulationMode();
              }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold transition-all duration-300 ${
                !isSimulation
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/40"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              title="Chuyển sang Chế độ Thực tế (Real Hardware Mode) - Khóa nút ảo, nhận diện từ Camera/ESP32"
            >
              <span className="relative flex h-2 w-2">
                {!isSimulation && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    !isSimulation ? "bg-emerald-300 shadow-[0_0_6px_#34d399]" : "bg-slate-400 dark:bg-slate-600"
                  }`}
                />
              </span>
              <Radio className="h-3.5 w-3.5" />
              <span className="tracking-wide">THỰC TẾ</span>
              {!isSimulation && (
                <span className="hidden xl:inline text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-400/40 text-emerald-200">
                  LIVE
                </span>
              )}
            </button>
          </div>

          {/* Live MQTT Status Pill */}
          <div
            title={`Trạng thái MQTT: ${mqttStatus.toUpperCase()} (${pingMs}ms)`}
            className={`hidden md:flex items-center gap-2 rounded-md px-2 py-0.5 text-xs font-semibold border ${
              mqttStatus === "connected"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : mqttStatus === "error"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {mqttStatus === "connected" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  mqttStatus === "connected"
                    ? "bg-emerald-500"
                    : mqttStatus === "error"
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
            </span>
            <span className="font-mono text-[11px]">
              MQTT {mqttStatus === "connected" ? `${pingMs}ms` : "Ngắt kết nối"}
            </span>
          </div>

          {/* Quick Search Shortcut trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Tìm kiếm...</span>
            <kbd className="hidden rounded border border-slate-300/80 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 shadow-xs dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300 sm:inline-block">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push("/alerts")}
            title="Xem danh sách cảnh báo"
            className="relative rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-rose-500/30">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={themeMode === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white"
          >
            {themeMode === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={isMuted ? "Bật âm thanh cơ khí & cảm biến" : "Tắt âm thanh"}
            className="rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white"
          >
            {!isMuted ? (
              <Volume2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {/* User Avatar & Info */}
          {user && (
            <div className="ml-1 hidden items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 dark:border-white/[0.07] dark:bg-[#161822] lg:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E212D] border border-white/10 text-xs font-bold text-white shadow-xs">
                {user.role === "admin" ? "AD" : "OP"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {user.displayName}
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Command Palette Modal (Ctrl + K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="relate-card w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl dark:border-white/[0.07] dark:bg-[#161822]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm trang hoặc tính năng... (nhấn Esc để đóng)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-100/70 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-[#111319] dark:border dark:border-white/[0.06] dark:text-white"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="absolute right-3 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300">
                  ESC
                </kbd>
              )}
            </div>

            {/* List results */}
            <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 transition-colors"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                        {item.group}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Không tìm thấy kết quả phù hợp với &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-slate-200/60 pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
              <span>Mẹo: Sử dụng phím tắt <kbd className="font-mono">Ctrl + K</kbd> mọi lúc</span>
              <span>SortiX OS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
