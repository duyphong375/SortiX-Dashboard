"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Info,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// Map path → breadcrumb labels
const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Tổng quan",
  "/conveyor": "Băng tải",
  "/analytics": "Thống kê",
  "/history": "Lịch sử",
  "/alerts": "Cảnh báo",
  "/config": "Cấu hình",
  "/devices": "Thiết bị & IoT",
  "/users": "Người dùng",
};

const SEARCH_LINKS = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard, group: "Điều hướng" },
  { label: "Băng tải", href: "/conveyor", icon: Layers, group: "Điều hướng" },
  { label: "Thống kê", href: "/analytics", icon: BarChart3, group: "Điều hướng" },
  { label: "Lịch sử", href: "/history", icon: History, group: "Điều hướng" },
  { label: "Cảnh báo", href: "/alerts", icon: Bell, group: "Điều hướng" },
  { label: "Cấu hình", href: "/config", icon: SlidersHorizontal, group: "Hệ thống" },
  { label: "Thiết bị & IoT", href: "/devices", icon: Cpu, group: "Hệ thống" },
  { label: "Người dùng", href: "/users", icon: Users, group: "Hệ thống" },
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
  onManualSync?: () => Promise<void> | void;
  isSyncing?: boolean;
  teamName?: string;
  projectName?: string;
  lastUpdated?: string;
}

const TopHeaderComponent: React.FC<TopHeaderProps> = ({
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
  onManualSync,
  isSyncing = false,
  teamName: propTeamName,
  projectName = "SortiX-Med (IoT Phân Loại Y Tế)",
  lastUpdated,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [teamName, setTeamName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sortix_team_name") || propTeamName || "NHÓM IOT - PBL3";
    }
    return propTeamName || "NHÓM IOT - PBL3";
  });

  const currentPageName = BREADCRUMB_MAP[pathname] || "Tổng quan";

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
        setStatusMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close status menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    if (statusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusMenuOpen]);

  // Filtered links for Command Palette
  const filteredLinks = SEARCH_LINKS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const isRealOnline = !isSimulation && mqttStatus === "connected" && !isMqttAlertActive && !isDeviceOffline;
  const isRealIssue = !isSimulation && (mqttStatus !== "connected" || isMqttAlertActive || isDeviceOffline);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-3.5 backdrop-blur-md transition-colors dark:border-white/[0.07] dark:bg-[#0E1017]/85 sm:px-5">
        {/* Left Section: Breadcrumb + Chế độ (Mode switch duy nhất) + Trạng thái hệ thống */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          {onMobileMenuToggle && (
            <button
              type="button"
              aria-label="Mở danh mục điều hướng"
              onClick={onMobileMenuToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <span className="hidden md:inline font-mono tracking-wider text-slate-400 dark:text-slate-500">
              SortiX OS
            </span>
            <ChevronRight className="hidden md:inline h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-none">
              {currentPageName}
            </span>
            {/* TÊN NHÓM & ĐỀ TÀI TRỰC TIẾP TRÊN HEADER */}
            <div
              data-testid="team-project-badge"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-bold text-cyan-800 dark:text-cyan-300 shrink-0 shadow-2xs hover:bg-cyan-500/15 transition-all"
              title={`${teamName} • ${projectName}`}
            >
              <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="font-extrabold tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[220px]">
                {teamName}
              </span>
              <span className="hidden xl:inline text-[11px] font-normal text-slate-400 dark:text-slate-500 border-l border-cyan-500/25 pl-1.5 truncate max-w-[170px]">
                {projectName}
              </span>
            </div>
          </div>

          {/* Phân cách */}
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-white/[0.08]" />

          {/* 1. NÚT CHUYỂN ĐỔI CHẾ ĐỘ DUY NHẤT (Mô phỏng <-> Thực tế) */}
          {onToggleSimulationMode && (
            <div className="flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-0.5 dark:border-white/[0.08] dark:bg-[#161822] shadow-2xs shrink-0">
              {/* Nút Mô phỏng */}
              <button
                type="button"
                aria-pressed={isSimulation}
                onClick={() => {
                  if (!isSimulation) onToggleSimulationMode(true);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
                  isSimulation
                    ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xs border border-purple-400/40"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
                title="Chế độ Mô phỏng: Cho phép nạp phôi ảo và kiểm thử an toàn"
              >
                <FlaskConical className={`h-3.5 w-3.5 ${isSimulation ? "animate-pulse text-purple-200" : ""}`} />
                <span className="hidden xs:inline text-xs">Mô phỏng</span>
              </button>

              {/* Nút Thực tế */}
              <button
                type="button"
                aria-pressed={!isSimulation}
                onClick={() => {
                  if (isSimulation) onToggleSimulationMode(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
                  !isSimulation
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xs border border-emerald-400/40"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
                title="Chế độ Thực tế: Nhận diện từ Camera và kết nối phần cứng ESP32"
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
                <span className="hidden xs:inline text-xs">Thực tế</span>
              </button>
            </div>
          )}

          {/* 2. GỘP MQTT + HTTP + THỜI GIAN CẬP NHẬT THÀNH NÚT "TRẠNG THÁI HỆ THỐNG" */}
          <div className="relative shrink-0" ref={statusMenuRef}>
            <button
              type="button"
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              className={`hidden sm:flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border transition-all shadow-2xs ${
                isSimulation
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"
                  : isRealOnline
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 animate-pulse"
              }`}
              title="Nhấp để xem chi tiết kết nối MQTT, HTTP và thời gian cập nhật"
            >
              <span className="relative flex h-2 w-2">
                {isRealOnline && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isSimulation
                      ? "bg-purple-500 shadow-[0_0_6px_#a855f7]"
                      : isRealOnline
                      ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                      : "bg-rose-500"
                  }`}
                />
              </span>
              <span className="tracking-wide">
                {isSimulation
                  ? "Dữ liệu mô phỏng"
                  : isRealOnline
                  ? "Hệ thống: Sẵn sàng"
                  : "Mất kết nối"}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  statusMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Popover Chi tiết Trạng thái Hệ thống */}
            {statusMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xl backdrop-blur-md dark:border-white/[0.08] dark:bg-[#161822] z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Trạng thái hệ thống
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSimulation
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                        : isRealOnline
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {isSimulation ? "MÔ PHỎNG" : isRealOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* MQTT Status */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                      MQTT Broker:
                    </span>
                    <span className={`font-mono font-bold ${mqttStatus === "connected" ? "text-slate-800 dark:text-slate-200" : "text-rose-600 animate-pulse"}`}>
                      {isSimulation ? "Mô phỏng" : mqttStatus === "connected" ? `MQTT: ONLINE (${pingMs}ms)` : "MQTT: DISCONNECTED"}
                    </span>
                  </div>

                  {/* HTTP Telemetry */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                      HTTP Telemetry:
                    </span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      POST 5s
                    </span>
                  </div>

                  {/* ESP32 Hardware */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Radio className="h-3.5 w-3.5 text-indigo-500" />
                      Vi điều khiển ESP32:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isDeviceOffline
                        ? "Ngoại tuyến"
                        : isSimulation
                        ? "Dữ liệu ảo"
                        : "Đã đồng bộ"}
                    </span>
                  </div>

                  {/* Last updated */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Cập nhật gần nhất:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {lastUpdated || currentTime || "--:--:--"}
                    </span>
                  </div>
                </div>

                {/* Team / Project Info in status footer */}
                <div className="mt-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-2 border border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-slate-700 dark:text-slate-300 truncate">
                    {teamName}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">{projectName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Badge trạng thái HTTP POST */}
          <div
            data-testid="http-badge-status"
            className="hidden xl:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 shrink-0 shadow-2xs"
            title="Chu kỳ đẩy dữ liệu telemetry HTTP POST 5s từ vi điều khiển ESP32"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-500" />
            <span>HTTP: POST 5s</span>
          </div>
        </div>

        {/* Right Section: Cập nhật gần nhất | Báo cáo | Tìm kiếm | Bell | Theme | Audio */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* CẬP NHẬT GẦN NHẤT TRỰC TIẾP TRÊN HEADER */}
          <div
            data-testid="telemetry-last-updated"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/[0.08] dark:bg-[#161822] dark:text-slate-300 shrink-0 shadow-2xs"
            title="Thời gian nhận dữ liệu cập nhật gần nhất từ hệ thống"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            </span>
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline text-xs font-medium">
              Cập nhật:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {lastUpdated || currentTime || "--:--:--"}
            </span>
          </div>

          {/* Nút Xem báo cáo 1 ngày làm việc */}
          {onTriggerShiftSummary && (
            <button
              type="button"
              onClick={onTriggerShiftSummary}
              title="Xem báo cáo 1 ngày làm việc & Đồng bộ dữ liệu"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 transition-all shadow-xs shrink-0"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Báo cáo ngày</span>
              <span className="sr-only">Báo cáo 1 ngày làm việc</span>
            </button>
          )}

          {/* Nút Đồng bộ tức thì (nếu có handler) */}
          {onManualSync && (
            <button
              type="button"
              onClick={() => void onManualSync()}
              disabled={isSyncing}
              title="Đồng bộ tức thì dữ liệu"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-500/20 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300 dark:hover:bg-cyan-500/25 transition-all shadow-xs disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden xl:inline">Đồng bộ</span>
            </button>
          )}

          {/* Quick Search Button (Ctrl + K) - ẩn trên mobile nhỏ */}
          <button
            type="button"
            aria-label="Tìm kiếm trong hệ thống (nhấn Ctrl+K hoặc Cmd+K)"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-slate-200 shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <kbd className="hidden md:inline-block rounded border border-slate-300/80 bg-white px-1.5 py-0.2 text-[10px] font-mono font-bold text-slate-600 shadow-2xs dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            aria-label={`Xem cảnh báo${alertCount > 0 ? ` (${alertCount} cảnh báo chưa xử lý)` : ""}`}
            onClick={() => router.push("/alerts")}
            title="Xem danh sách cảnh báo"
            className="relative rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white shrink-0"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-rose-500/30">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {/* Theme Toggle - ẩn trên màn hình siêu nhỏ */}
          <button
            type="button"
            aria-label={themeMode === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            onClick={onToggleTheme}
            title={themeMode === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="hidden xs:flex rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white shrink-0"
          >
            {themeMode === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Sound Toggle - ẩn trên màn hình siêu nhỏ */}
          <button
            type="button"
            aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            onClick={onToggleSound}
            title={isMuted ? "Bật âm thanh cơ khí & cảm biến" : "Tắt âm thanh"}
            className="hidden xs:flex rounded-xl border border-slate-200/80 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-400 dark:hover:bg-[#1E212D] dark:hover:text-white shrink-0"
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

export const TopHeader = React.memo(TopHeaderComponent);
