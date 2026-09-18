"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  ClipboardCheck,
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
  isMqttAlertActive?: boolean;
  reconnectAttempt?: number;
  pingMs?: number;
  isSimulation?: boolean;
  onToggleSimulationMode?: (targetMode?: boolean) => void;
  isDeviceOffline?: boolean;
  onTriggerShiftSummary?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  themeMode,
  onToggleTheme,
  isMuted,
  onToggleSound,
  alertCount = 0,
  onMobileMenuToggle,
  mqttStatus = "connected",
  isMqttAlertActive = false,
  reconnectAttempt = 0,
  pingMs = 24,
  isSimulation = true,
  onToggleSimulationMode,
  isDeviceOffline = false,
  onTriggerShiftSummary,
}) => {
  const pathname = usePathname();
  const router = useRouter();

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

  // Filtered links for Command Palette
  const filteredLinks = SEARCH_LINKS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-white/[0.07] dark:bg-[#0E1017]/80 sm:px-6">
        {/* Left Section: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMobileMenuToggle && (
            <button
              type="button"
              aria-label="Mở danh mục điều hướng"
              onClick={onMobileMenuToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">SortiX OS</span>
            <ChevronRight className="hidden h-3.5 w-3.5 sm:inline" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {currentPageName}
            </span>
          </div>

          {/* MQTT Status Badge: MQTT: ONLINE (Xanh) ➔ MQTT: DISCONNECTED (Đỏ chớp nháy) */}
          {mqttStatus === "connected" && !isMqttAlertActive ? (
            <div
              data-testid="mqtt-badge-online"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 md:flex shadow-2xs transition-all"
              title={`MQTT Broker đang kết nối ổn định (${pingMs}ms)`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              </span>
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>MQTT: ONLINE</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                {pingMs}ms
              </span>
            </div>
          ) : (
            <div
              data-testid="mqtt-badge-disconnected"
              className="hidden items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-600 dark:text-rose-400 md:flex animate-pulse shadow-sm transition-all"
              title="Mất kết nối máy chủ MQTT Broker! Đang tự động thử lại..."
            >
              <WifiOff className="h-3.5 w-3.5 text-rose-500" />
              <span>MQTT: DISCONNECTED</span>
              {reconnectAttempt > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                  Lần {reconnectAttempt}
                </span>
              )}
            </div>
          )}

          {/* ESP32 Hardware Status Badge */}
          {isDeviceOffline && (
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-300/80 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-white/[0.08] dark:bg-[#161822] dark:text-slate-400 md:flex">
              <WifiOff className="h-3.5 w-3.5 text-slate-400" />
              <span>ESP32: OFFLINE</span>
            </div>
          )}


          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ VẬN HÀNH: MÔ PHỎNG <-> THỰC TẾ (Trượt 2 bên) */}
          {onToggleSimulationMode && (
            <div className="hidden sm:flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 dark:border-white/[0.08] dark:bg-[#161822] shadow-xs">
              {/* Chế độ 1: MÔ PHỎNG (Tím/Cyan) */}
              <button
                type="button"
                aria-pressed={isSimulation}
                onClick={() => {
                  if (!isSimulation && onToggleSimulationMode) onToggleSimulationMode(true);
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

              {/* Chế độ 2: THỰC TẾ (Emerald/Teal kèm đèn nhấp nháy Live Hardware) */}
              <button
                type="button"
                aria-pressed={!isSimulation}
                onClick={() => {
                  if (isSimulation && onToggleSimulationMode) onToggleSimulationMode(false);
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
          )}
        </div>

        {/* Right Section: Utilities & Actions */}
        <div className="flex items-center gap-2">
          {/* Nút Xem báo cáo 1 ngày làm việc */}
          {onTriggerShiftSummary && (
            <button
              type="button"
              onClick={onTriggerShiftSummary}
              title="Xem báo cáo 1 ngày làm việc & Đồng bộ dữ liệu"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 transition-all shadow-xs"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Báo cáo 1 ngày làm việc</span>
            </button>
          )}

          {/* Clock */}
          <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-mono text-slate-600 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-300 xl:flex">
            <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{currentTime || "--:--:--"}</span>
          </div>

          {/* Quick Search Button (Ctrl + K) */}
          <button
            type="button"
            aria-label="Tìm kiếm trong hệ thống (nhấn Ctrl+K hoặc Cmd+K)"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-slate-200"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tìm kiếm...</span>
            <kbd className="hidden rounded border border-slate-300/80 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 shadow-xs dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300 sm:inline-block">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label={`Xem cảnh báo${alertCount > 0 ? ` (${alertCount} cảnh báo chưa xử lý)` : ""}`}
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
            type="button"
            aria-label={themeMode === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
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
            type="button"
            aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
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
        </div>
      </header>

      {/* Command Palette Modal (Ctrl + K) */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="relate-card w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl dark:border-white/[0.07] dark:bg-[#161822]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <h2 id="command-palette-title" className="sr-only">Tìm kiếm trong hệ thống</h2>
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
                  type="button"
                  aria-label="Xóa nội dung tìm kiếm"
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
                      type="button"
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
