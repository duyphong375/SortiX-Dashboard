"use client";

import React from "react";
import {
  Cpu,
  Pause,
  Play,
  OctagonAlert,
  FlaskConical,
  Radio,
  ShieldAlert,
  Sparkles,
  Lock,
  Box,
  Sliders,
} from "lucide-react";
import type { TelemetryData } from "@/lib/types";

export interface ConveyorToolbarProps {
  telemetry: TelemetryData;
  isRunning: boolean;
  itemsCount: number;
  isSimulation: boolean;
  onToggleRun?: () => void;
  onEmergencyStop?: () => void;
  onSpawnPackage?: (brandKey?: string) => void;
  onGenerateDemoData?: () => void;
  getBrandTargetBinName: (brandKey: string) => string;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isBeltMoving: boolean;
  linearSpeedCms: string;
  rollerRpm: number;
}

export const ConveyorToolbar: React.FC<ConveyorToolbarProps> = ({
  telemetry,
  isRunning,
  itemsCount,
  isSimulation,
  onToggleRun,
  onEmergencyStop,
  onSpawnPackage,
  onGenerateDemoData,
  getBrandTargetBinName,
  speed,
  onSpeedChange,
  isBeltMoving,
  linearSpeedCms,
  rollerRpm,
}) => {
  return (
    <>
      {/* TIÊU ĐỀ: Thông tin vận hành và nút điều khiển nhanh */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Cpu className="h-5 w-5" />
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                telemetry.estop_pressed
                  ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                  : !isRunning
                  ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                  : itemsCount > 0
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : "bg-slate-400"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Băng tải & cơ cấu phân loại
              </h3>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border shrink-0 ${
                  telemetry.estop_pressed
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                    : !isRunning
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                    : itemsCount > 0
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    : "bg-white/[0.08] text-slate-300 border-white/[0.05]"
                }`}
              >
                {telemetry.estop_pressed
                  ? "Dừng khẩn"
                  : !isRunning
                  ? "Tạm dừng"
                  : itemsCount > 0
                  ? `Đang chạy (${itemsCount} phôi)`
                  : "Chờ phôi"}
              </span>
            </div>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {telemetry.estop_pressed
                ? "Băng tải đã ngắt điện do kích hoạt E-Stop"
                : !isRunning
                ? "Hệ thống đang tạm dừng • Nhấn Khởi động để tiếp tục"
                : itemsCount > 0
                ? `Băng tải đang vận chuyển ${itemsCount} phôi qua trạm quét và cơ cấu gạt`
                : "Băng tải tự động dừng khi không có phôi"}
            </p>
          </div>
        </div>

        {/* NÚT THAO TÁC CƠ KHÍ, CHUYỂN ĐỔI CHẾ ĐỘ & ĐIỀU KHIỂN CHÍNH */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-auto">
          {/* HUY HIỆU CHỈ THỊ TRẠNG THÁI CHẾ ĐỘ (READ-ONLY) */}
          {isSimulation ? (
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-300 shadow-xs select-none">
              <FlaskConical className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>
                Chế độ: <span className="text-purple-600 dark:text-purple-300 font-bold">Mô phỏng</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs select-none">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              </span>
              <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Chế độ: <span className="text-emerald-600 dark:text-emerald-300 font-bold">Thực tế (ESP32)</span>
              </span>
            </div>
          )}

          {/* Nút Start/Pause */}
          <button
            onClick={onToggleRun}
            disabled={telemetry.estop_pressed}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              isRunning
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            } disabled:opacity-40`}
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Tạm dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Khởi động
              </>
            )}
          </button>

          {/* Nút E-STOP Dừng Khẩn Cấp */}
          <button
            onClick={onEmergencyStop}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold tracking-wider transition-all duration-200 ${
              telemetry.estop_pressed
                ? "border-amber-500 bg-amber-500 text-slate-950 shadow-[0_0_15px_#f59e0b]"
                : "border-rose-600 bg-rose-600 text-white shadow-md hover:bg-rose-500"
            }`}
          >
            <OctagonAlert className="h-3.5 w-3.5" />
            {telemetry.estop_pressed ? "Mở khóa E-Stop" : "Dừng khẩn E-Stop"}
          </button>
        </div>
      </div>

      {/* CẢNH BÁO CHẾ ĐỘ THỰC TẾ (REAL HARDWARE MODE BANNER) */}
      {!isSimulation ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50/90 px-3.5 py-2 text-xs text-emerald-900 shadow-xs dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
          <span className="leading-relaxed">
            <strong className="font-bold text-emerald-950 dark:text-emerald-100">Chế độ thực tế:</strong> Đang nhận dữ liệu từ cảm biến và camera ESP32. Nút thả phôi ảo được khóa để bảo đảm tính chuẩn xác của phần cứng.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-purple-300 bg-purple-50/90 px-3.5 py-2 text-xs text-purple-900 shadow-xs dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-200">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="leading-relaxed">
            <strong className="font-bold text-purple-950 dark:text-purple-100">Chế độ mô phỏng:</strong> Thả phôi mẫu trực tiếp lên băng tải để kiểm thử phân loại và cơ cấu gạt.
          </span>
        </div>
      )}

      {/* DẢI NÚT NẠP TỪNG LOẠI VẬT MẪU TRỰC TIẾP */}
      {isSimulation && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 transition-all duration-300 dark:border-white/[0.06] dark:bg-[#111319]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            {!isSimulation ? (
              <>
                <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-amber-600 dark:text-amber-400">Khóa ở chế độ thực tế:</span>
              </>
            ) : (
              <>
                <Box className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Thả vật mẫu (Mô phỏng):</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSpawnPackage?.("brand_c")}
              disabled={!isSimulation || !isRunning || telemetry.estop_pressed}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
              title={!isSimulation ? "Nút bị khóa ở chế độ thực tế" : `Thả Lon Coca-Cola (${getBrandTargetBinName("brand_c")})`}
            >
              <span>Lon Coca-Cola</span>
              <span className="text-[10px] font-mono font-normal opacity-75">
                ({getBrandTargetBinName("brand_c")})
              </span>
            </button>

            <button
              onClick={() => onSpawnPackage?.("brand_a")}
              disabled={!isSimulation || !isRunning || telemetry.estop_pressed}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
              title={!isSimulation ? "Nút bị khóa ở chế độ thực tế" : `Thả Lon Pepsi (${getBrandTargetBinName("brand_a")})`}
            >
              <span>Lon Pepsi</span>
              <span className="text-[10px] font-mono font-normal opacity-75">
                ({getBrandTargetBinName("brand_a")})
              </span>
            </button>

            <button
              onClick={() => onSpawnPackage?.("brand_b")}
              disabled={!isSimulation || !isRunning || telemetry.estop_pressed}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
              title={!isSimulation ? "Nút bị khóa ở chế độ thực tế" : `Thả Lon Red Bull (${getBrandTargetBinName("brand_b")})`}
            >
              <span>Lon Red Bull</span>
              <span className="text-[10px] font-mono font-normal opacity-75">
                ({getBrandTargetBinName("brand_b")})
              </span>
            </button>

            <button
              onClick={() => onSpawnPackage?.("brand_d")}
              disabled={!isSimulation || !isRunning || telemetry.estop_pressed}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 transition-all hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-400 dark:hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
              title={!isSimulation ? "Nút bị khóa ở chế độ thực tế" : `Thả Chai Aquafina (${getBrandTargetBinName("brand_d")})`}
            >
              <span>Chai Aquafina</span>
              <span className="text-[10px] font-mono font-normal opacity-75">
                ({getBrandTargetBinName("brand_d")})
              </span>
            </button>

            {/* Nút thả phôi ngẫu nhiên */}
            <button
              onClick={() => onSpawnPackage?.()}
              disabled={!isSimulation || !isRunning || telemetry.estop_pressed}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-400 dark:hover:bg-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
              title={!isSimulation ? "Nút bị khóa ở chế độ thực tế" : "Thả ngẫu nhiên một phôi"}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>Phôi ngẫu nhiên</span>
            </button>

            {isSimulation && (
              <button
                onClick={onGenerateDemoData}
                disabled={telemetry.estop_pressed}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25 shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Tạo dữ liệu lịch sử demo ngẫu nhiên"
              >
                <span>Tạo dữ liệu demo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* THANH ĐIỀU TỐC BĂNG TẢI (PWM MCPWM IO4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-white/[0.06] dark:bg-[#111319]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Sliders className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Tốc độ băng tải:
          </span>
          <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
            {isBeltMoving ? `${speed}%` : "0% (Đứng yên)"}
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
            ({linearSpeedCms} cm/s • {rollerRpm} RPM)
          </span>
        </div>

        <div className="flex w-full sm:max-w-xs md:max-w-sm items-center gap-3 shrink-0">
          <span className="text-[11px] font-bold text-slate-500">10%</span>
          <input
            type="range"
            min="10"
            max="100"
            value={speed}
            disabled={telemetry.estop_pressed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 dark:bg-slate-800 dark:accent-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] font-bold text-teal-600 dark:text-cyan-400">100%</span>
          <span className="shrink-0 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 font-mono text-xs font-black text-teal-700 dark:text-cyan-300">
            {speed}%
          </span>
        </div>
      </div>
    </>
  );
};
