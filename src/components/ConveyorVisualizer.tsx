"use client";

import React from "react";
import { TelemetryData, SorterConfig, CATALOG_BRANDS, VisualItem } from "@/lib/types";
import { determineTargetBin } from "@/lib/dataProcessor";
import {
  Play,
  Pause,
  OctagonAlert,
  Sliders,
  Camera,
  Box,
  Cpu,
} from "lucide-react";

interface ConveyorVisualizerProps {
  telemetry: TelemetryData;
  config: SorterConfig;
  items: VisualItem[];
  isRunning: boolean;
  speed: number;
  onToggleRun: () => void;
  onEmergencyStop: () => void;
  onSpeedChange: (newSpeed: number) => void;
  onSpawnPackage: (brandKey?: string) => void;
  arm1Active: boolean;
  arm2Active: boolean;
  binCounts: { bin1: number; bin2: number; bin3: number };
  brandCounts?: Record<string, number>;
}

export const ConveyorVisualizer: React.FC<ConveyorVisualizerProps> = ({
  telemetry,
  config,
  items,
  isRunning,
  speed,
  onToggleRun,
  onEmergencyStop,
  onSpeedChange,
  onSpawnPackage,
  arm1Active,
  arm2Active,
  binCounts,
  brandCounts = {},
}) => {
  const isBeltMoving = isRunning && !telemetry.estop_pressed && items.length > 0;
  const linearSpeedCms = isBeltMoving ? ((speed / 100) * 35).toFixed(1) : "0.0";
  const rollerRpm = isBeltMoving ? Math.floor((speed / 100) * 120) : 0;

  // Xác định danh sách thương hiệu gán cho từng khay
  const bin1Brands = config.bins[0]?.brand_ids || [];
  const bin2Brands = config.bins[1]?.brand_ids || [];
  const assignedBrands = new Set([...bin1Brands, ...bin2Brands]);
  const bin3Brands = Object.keys(CATALOG_BRANDS).filter((b) => !assignedBrands.has(b));

  // Render hình dạng 2D chân thực của từng loại phôi mẫu (Digital Twin)
  const renderPhysicalItem = (item: VisualItem) => {
    const isCoca = item.brandKey === "brand_c";
    const isPepsi = item.brandKey === "brand_a";
    const isRedBull = item.brandKey === "brand_b";
    const isAquafina = item.brandKey === "brand_d";

    const yTranslate = item.yOffset || 0;
    const opacity = item.opacity ?? 1;

    return (
      <div
        key={item.id}
        className="product-sample-3d"
        style={{
          left: `${item.progress}%`,
          transform: `translate(-50%, calc(-50% + ${yTranslate}px))`,
          opacity,
          zIndex: item.deflected ? 25 : 35,
          transition: "transform 0.15s ease-out, opacity 0.2s ease-out",
        }}
      >
        {/* Bóng đổ chân thực trên mặt băng chuyền cao su */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-3 w-11 rounded-full bg-black/80 blur-[3px]" />

        {/* 1. MẪU LON COCA-COLA (Đỏ ruby ánh kim, nắp dập nổi có khoen mở nắp) */}
        {isCoca && (
          <div className="sample-coca relative flex h-14 w-9 flex-col items-center justify-between rounded-lg p-1 text-center shadow-lg overflow-hidden">
            {/* Vệt phản quang ánh kim specular dọc thân lon */}
            <div className="pointer-events-none absolute inset-y-0 left-1 w-1 rounded-full bg-white/35" />
            
            {/* Nắp nhôm bạc dập nổi có khoen kéo */}
            <div className="can-top-rim relative z-10 h-2.5 w-7 border border-slate-300 flex items-center justify-center">
              <div className="h-1 w-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner flex items-center justify-center">
                <div className="h-0.5 w-1 rounded-full bg-slate-600" />
              </div>
            </div>

            {/* Thân lon in chữ Coca-Cola */}
            <div className="my-auto relative z-10 font-black italic tracking-tighter text-[9px] text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Coca<br />Cola
            </div>

            {/* Đáy lon dập lõm */}
            <div className="relative z-10 h-1.5 w-6 rounded-b-md bg-red-950/80 border-t border-red-900/50" />
          </div>
        )}

        {/* 2. MẪU LON PEPSI (Xanh cobalt ánh kim, logo xoáy âm dương sắc nét) */}
        {isPepsi && (
          <div className="sample-pepsi relative flex h-14 w-9 flex-col items-center justify-between rounded-lg p-1 text-center shadow-lg overflow-hidden">
            {/* Vệt phản quang ánh kim specular dọc thân lon */}
            <div className="pointer-events-none absolute inset-y-0 left-1 w-1 rounded-full bg-white/35" />

            {/* Nắp nhôm bạc dập nổi có khoen kéo */}
            <div className="can-top-rim relative z-10 h-2.5 w-7 border border-slate-300 flex items-center justify-center">
              <div className="h-1 w-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner flex items-center justify-center">
                <div className="h-0.5 w-1 rounded-full bg-slate-600" />
              </div>
            </div>

            {/* Thân lon với logo Pepsi xoáy âm dương đỏ-trắng-xanh */}
            <div className="my-auto relative z-10 flex flex-col items-center">
              <div className="relative h-4.5 w-4.5 rounded-full border border-white/80 overflow-hidden shadow-sm">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600" />
                <div className="absolute top-[40%] -left-1 -right-1 h-1.5 bg-white -rotate-12" />
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-blue-700" />
              </div>
              <span className="mt-0.5 text-[8px] font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                PEPSI
              </span>
            </div>

            {/* Đáy lon dập lõm */}
            <div className="relative z-10 h-1.5 w-6 rounded-b-md bg-blue-950/80 border-t border-blue-900/50" />
          </div>
        )}

        {/* 3. MẪU LON RED BULL (Vàng gold & xanh navy kim loại, khoen nắp gold) */}
        {isRedBull && (
          <div className="sample-redbull relative flex h-15 w-8 flex-col items-center justify-between rounded-md p-1 text-center shadow-lg overflow-hidden">
            {/* Vệt phản quang ánh kim specular */}
            <div className="pointer-events-none absolute inset-y-0 left-1 w-0.5 rounded-full bg-amber-200/50" />

            {/* Nắp nhôm mạ gold có khoen kéo */}
            <div className="can-top-rim relative z-10 h-2 w-6 border border-amber-300 bg-gradient-to-r from-amber-200 to-amber-400 flex items-center justify-center">
              <div className="h-0.5 w-2 rounded-full bg-amber-600 border border-amber-500" />
            </div>

            {/* Thân lon phối màu chéo vàng & xanh navy */}
            <div className="my-auto relative z-10">
              <span className="block text-[8px] font-black text-amber-200 uppercase leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                RED<br />BULL
              </span>
            </div>

            {/* Đáy lon dập lõm */}
            <div className="relative z-10 h-1.5 w-5 rounded-b-md bg-blue-950/90" />
          </div>
        )}

        {/* 4. MẪU CHAI AQUAFINA (Nhựa trong suốt có ngấn gân khúc xạ, nắp xanh) */}
        {isAquafina && (
          <div className="sample-aquafina relative flex h-16 w-8 flex-col items-center justify-between rounded-xl p-1 text-center shadow-lg">
            {/* Nắp chai nhựa xanh có gờ ren vặn */}
            <div className="relative z-10 h-2 w-3.5 rounded-t-sm bg-blue-600 border border-blue-400 shadow-sm flex items-center justify-center">
              <div className="h-0.5 w-2 bg-blue-300 rounded-full" />
            </div>

            {/* Thân chai với ngấn gân khúc xạ ánh sáng */}
            <div className="relative z-10 my-auto w-full flex flex-col items-center">
              <div className="w-5 h-[1px] bg-white/60 mb-0.5 shadow-sm" />
              <div className="w-6 h-[1px] bg-white/40 mb-1" />

              {/* Nhãn chai Aquafina */}
              <div className="w-full rounded bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 py-0.5 px-0.5 border border-white/40 shadow-xs">
                <span className="text-[6.5px] font-black tracking-tighter text-white uppercase block leading-tight drop-shadow-sm">
                  AQUAFINA
                </span>
              </div>

              <div className="w-6 h-[1px] bg-white/40 mt-1" />
              <div className="w-5 h-[1px] bg-white/60 mt-0.5 shadow-sm" />
            </div>

            {/* Đáy chai nhựa 5 múi chân */}
            <div className="relative z-10 h-2 w-6 rounded-b-lg bg-sky-900/30 border-t border-sky-400/30" />
          </div>
        )}

        {/* Nhãn mã phôi HUD */}
        <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/90 px-1.5 py-0.5 font-mono text-[8px] font-bold text-cyan-300 border border-cyan-500/40 shadow-xs tracking-wider">
          {item.id}
        </span>
      </div>
    );
  };

  return (
    <div className="relate-card relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 dark:border-white/[0.07] dark:bg-[#161822] min-h-full justify-between gap-3 sm:gap-4">
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
                  : items.length > 0
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : "bg-slate-400"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Mô Phỏng Băng Tải 2D & Cơ Cấu Phân Loại
              </h3>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border shrink-0 ${
                  telemetry.estop_pressed
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                    : !isRunning
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                    : items.length > 0
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    : "bg-white/[0.08] text-slate-300 border-white/[0.05]"
                }`}
              >
                {telemetry.estop_pressed
                  ? "E-STOP KHẨN CẤP"
                  : !isRunning
                  ? "TẠM DỪNG"
                  : items.length > 0
                  ? `ĐANG CHẠY (${items.length} PHÔI)`
                  : "CHỜ PHÔI"}
              </span>
            </div>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {telemetry.estop_pressed
                ? "Băng tải đã ngắt điện khẩn cấp do nút E-Stop"
                : !isRunning
                ? "Hệ thống đang tạm dừng • Nhấn Khởi Động để sẵn sàng"
                : items.length > 0
                ? `Băng tải đang chuyển động đưa ${items.length} phôi qua trạm quét và cơ cấu gạt`
                : "Băng tải tự động đứng yên khi không có phôi • Nhấn nạp nhanh mẫu vật bên dưới để chạy"}
            </p>
          </div>
        </div>

        {/* NÚT THAO TÁC CƠ KHÍ & ĐIỀU KHIỂN CHÍNH */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
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
                <Pause className="h-3.5 w-3.5" /> Tạm Dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Khởi Động
              </>
            )}
          </button>

          {/* Nút E-STOP Dừng Khẩn Cấp */}
          <button
            onClick={onEmergencyStop}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              telemetry.estop_pressed
                ? "border-amber-500 bg-amber-500 text-slate-950 shadow-[0_0_15px_#f59e0b]"
                : "border-rose-600 bg-rose-600 text-white shadow-md hover:bg-rose-500"
            }`}
          >
            <OctagonAlert className="h-3.5 w-3.5" />
            {telemetry.estop_pressed ? "MỞ KHÓA E-STOP" : "E-STOP (IO10)"}
          </button>
        </div>
      </div>

      {/* DẢI NÚT NẠP TỪNG LOẠI VẬT MẪU TRỰC TIẾP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-white/[0.06] dark:bg-[#111319]">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          <Box className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span>Nạp nhanh vật mẫu lên băng tải:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSpawnPackage("brand_c")}
            disabled={!isRunning || telemetry.estop_pressed}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 disabled:opacity-40 shrink-0 shadow-xs active:scale-95"
          >
            <span>🔴 Lon Coca-Cola</span>
          </button>

          <button
            onClick={() => onSpawnPackage("brand_a")}
            disabled={!isRunning || telemetry.estop_pressed}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25 disabled:opacity-40 shrink-0 shadow-xs active:scale-95"
          >
            <span>🔵 Lon Pepsi</span>
          </button>

          <button
            onClick={() => onSpawnPackage("brand_b")}
            disabled={!isRunning || telemetry.estop_pressed}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25 disabled:opacity-40 shrink-0 shadow-xs active:scale-95"
          >
            <span>🟡 Lon Red Bull</span>
          </button>

          <button
            onClick={() => onSpawnPackage("brand_d")}
            disabled={!isRunning || telemetry.estop_pressed}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-700 transition-all hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-400 dark:hover:bg-cyan-500/25 disabled:opacity-40 shrink-0 shadow-xs active:scale-95"
          >
            <span>🔷 Chai Aquafina</span>
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU TỐC BĂNG TẢI (PWM MCPWM IO4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-white/[0.06] dark:bg-[#111319]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Sliders className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Tốc độ Băng tải:
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
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 dark:bg-slate-800 dark:accent-cyan-500"
          />
          <span className="text-[11px] font-bold text-teal-600 dark:text-cyan-400">100%</span>
        </div>
      </div>

      {/* KHUNG MÔ HÌNH VẬT LÝ BĂNG TẢI 2D (INDUSTRIAL DIGITAL TWIN) */}
      <div className="conveyor-chassis relative mt-2 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.07] dark:bg-[#111319] p-3 sm:p-4 shadow-md transition-colors duration-300 flex flex-col justify-between gap-3">
        {/* 4 Đinh ốc lục giác CNC kim loại tinh xảo tại 4 góc khung bệ */}
        <div className="absolute top-2.5 left-2.5 z-30 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 shadow-inner">
          <div className="h-1.5 w-1.5 rounded-xs bg-slate-500 dark:bg-slate-900 border border-slate-400/50 dark:border-slate-600 rotate-45" />
        </div>
        <div className="absolute top-2.5 right-2.5 z-30 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 shadow-inner">
          <div className="h-1.5 w-1.5 rounded-xs bg-slate-500 dark:bg-slate-900 border border-slate-400/50 dark:border-slate-600 rotate-45" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 z-30 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 shadow-inner">
          <div className="h-1.5 w-1.5 rounded-xs bg-slate-500 dark:bg-slate-900 border border-slate-400/50 dark:border-slate-600 rotate-45" />
        </div>
        <div className="absolute bottom-2.5 right-2.5 z-30 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 shadow-inner">
          <div className="h-1.5 w-1.5 rounded-xs bg-slate-500 dark:bg-slate-900 border border-slate-400/50 dark:border-slate-600 rotate-45" />
        </div>

        {/* Thanh Ray Trượt Mạ Crom Sáng Bóng Có Thước Đo Milimet Công Nghiệp Viền Trên */}
        <div className="chrome-rail-ruler rounded-md relative flex items-center px-2 h-5">
          <div className="absolute inset-0 ruler-ticks opacity-60 pointer-events-none" />
          <div className="relative z-10 w-full h-full font-mono font-bold tracking-tight text-slate-700 dark:text-slate-300 pointer-events-none text-[8px] sm:text-[9px]">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap">▲ 0mm</span>
            <span className="absolute left-[15%] top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap text-cyan-700 dark:text-cyan-300 font-black">
              ▲ 150mm <span className="hidden sm:inline">(CAM)</span>
            </span>
            <span className="absolute left-[45%] top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap text-cyan-700 dark:text-cyan-300 font-black">
              ▲ 450mm <span className="hidden sm:inline">(GẠT 1)</span>
            </span>
            <span className="absolute left-[72%] top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap text-blue-700 dark:text-blue-300 font-black">
              ▲ 720mm <span className="hidden sm:inline">(GẠT 2)</span>
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-amber-700 dark:text-amber-300 font-black">
              ▲ 1000mm <span className="hidden sm:inline">(KHAY 3)</span>
            </span>
          </div>
        </div>

        {/* Thanh tiêu đề các trạm công nghiệp */}
        <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-1.5 px-2 text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0">
            <Camera className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">1. CAMERA AI (15%)</span>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-1.5 px-2 text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0">
            <span className="shrink-0">🦾</span>
            <span className="truncate">2. GẠT 1 (IO23 - 45%)</span>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 py-1.5 px-2 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0">
            <span className="shrink-0">🦾</span>
            <span className="truncate">3. GẠT 2 (IO24 - 72%)</span>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 px-2 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0">
            <span className="shrink-0">📥</span>
            <span className="truncate">4. KHAY 3 (96%)</span>
          </div>
        </div>

        {/* DÂY ĐAI BĂNG TẢI CHÍNH & VẬT PHẨM CHẠY 2D */}
        <div className="relative my-8 flex items-center">
          {/* Rulo truyền động đầu băng (Drive Drum - Tiện CNC nhôm thép với bạc đạn đồng) */}
          <div className="relative z-20 flex h-32 w-14 shrink-0 flex-col items-center justify-between rounded-l-2xl border-y-4 border-l-4 border-slate-700 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-700 shadow-xl overflow-hidden py-1">
            {/* Gờ giữ đai trên */}
            <div className="h-2 w-full bg-slate-800 border-b border-slate-600/80 shadow-inner" />
            {/* Ổ bi bạc đạn đồng thau CNC xoay quanh tâm trục */}
            <div
              className={`h-9 w-9 rounded-full border-2 border-amber-500/80 bg-slate-900 shadow-md flex items-center justify-center ${
                isBeltMoving ? "roller-rotating" : ""
              }`}
            >
              <div className="relative h-6 w-6 rounded-full border border-slate-400/50 bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center">
                {/* 4 Chấu ốc cố định trục quay */}
                <div className="absolute top-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute left-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute right-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
              </div>
            </div>
            {/* Gờ giữ đai dưới */}
            <div className="h-2 w-full bg-slate-800 border-t border-slate-600/80 shadow-inner" />
          </div>

          {/* Dây Băng Tải Cao Su / Mắt Xích Modul 12px */}
          <div className="conveyor-belt-track relative h-32 w-full border-y-4 border-slate-700 overflow-visible shadow-inner">
            {/* Lớp hoa văn chuyển động 12px micro-ribbed */}
            <div
              className={`absolute inset-0 conveyor-belt-track ${
                isBeltMoving ? "conveyor-belt-running" : ""
              }`}
              style={{
                animationDuration: `${Math.max(0.18, (110 - speed) / 110)}s`,
              }}
            />

            {/* Chiều sâu 3D quang học: Vệt sáng phản quang kim loại chạy ngang (Specular Sheen) */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-6 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

            {/* Vạch kẻ trung tâm dẫn hướng phôi */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-cyan-400/30 z-10 pointer-events-none" />

            {/* Thông báo chế độ chờ khi không có phôi */}
            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 px-3">
                <div className="rounded-full bg-slate-900/90 px-4 py-1.5 backdrop-blur border border-cyan-500/30 text-[10px] sm:text-xs font-semibold text-cyan-300 shadow-lg flex items-center gap-2 max-w-[92%] text-center">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <span className="truncate">Băng tải đứng yên chờ phôi • Nhấn nút nạp nhanh vật mẫu phía trên để vận hành</span>
                </div>
              </div>
            )}

            {/* 1. CỔNG VÒM CAMERA AI & TIA QUÉT LASER (INSPECTION GANTRY - 15%) */}
            <div className="absolute left-[15%] -top-7 bottom-0 z-30 flex flex-col items-center pointer-events-none">
              {/* Khung cầu vượt cổng vòm kim loại (Truss Arch) */}
              <div className="relative flex items-center gap-1.5 rounded-t-lg border-x-2 border-t-2 border-cyan-400/70 bg-slate-950 px-2.5 py-1 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <div className="flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[9px] font-mono font-black tracking-wider text-cyan-300 whitespace-nowrap">AI-VISION</span>
                </div>
                {/* Mini HUD status indicator */}
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-300 shrink-0 ${
                    telemetry.s1_entry
                      ? "bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"
                      : "bg-cyan-500/40"
                  }`}
                />
              </div>

              {/* Tia quét Laser nón quang học (Holographic Scan Cone) */}
              <div className="relative w-16 flex-1 overflow-hidden">
                <div
                  className={`holographic-scan-cone absolute inset-0 transition-opacity duration-200 ${
                    isBeltMoving ? "opacity-75" : "opacity-30"
                  } ${telemetry.s1_entry ? "!opacity-100 !shadow-[0_0_30px_#06b6d4]" : ""}`}
                >
                  {/* Tia laser quét dọc chạy qua lại */}
                  {isBeltMoving && (
                    <div className="laser-scan-line absolute inset-x-1 h-0.5 bg-cyan-200 shadow-[0_0_10px_#38bdf8]" />
                  )}
                </div>
              </div>

              {/* Cảm biến quang S1 (IO0) */}
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 transition-all shrink-0 ${
                    telemetry.s1_entry
                      ? "border-amber-300 bg-amber-400 shadow-[0_0_12px_#f59e0b]"
                      : "border-slate-400 bg-slate-800"
                  }`}
                />
                <span className="rounded bg-slate-950/90 px-1 font-mono text-[8px] font-bold text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
                  S1:IO0
                </span>
              </div>
            </div>

            {/* 2. CƠ CẤU GẠT SERVO 1 (IO23) & CẢM BIẾN S2 (45%) */}
            <div className="absolute left-[45%] top-0 bottom-0 z-30 flex flex-col items-center justify-between py-0.5 pointer-events-none">
              {/* Đĩa tròn Servo Flange & Khớp quay CNC */}
              <div className="relative z-40 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-900 shadow-md shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe]" />
                {/* 4 Lỗ ốc servo disc */}
                <div className="absolute top-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute left-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute right-0.5 h-1 w-1 rounded-full bg-slate-500" />
              </div>

              {/* Cánh Tay Gạt Hợp Kim Nhôm CNC Phay Nguyên Khối */}
              <div
                className="absolute top-3.5 left-2 h-24 w-4 rounded-md border border-cyan-300 bg-gradient-to-b from-cyan-400 via-cyan-600 to-slate-800 shadow-lg flex flex-col items-center justify-between py-1"
                style={{
                  transformOrigin: "top left",
                  transform: arm1Active ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: arm1Active
                    ? "0 0 20px rgba(6, 182, 212, 0.85), inset 0 0 8px #22d3ee"
                    : "0 4px 8px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Rãnh khoét rỗng giảm trọng lượng CNC (Lightening Slot) */}
                <div className="h-12 w-1.5 rounded-full bg-slate-950/80 border border-cyan-200/40" />
                {/* Đệm cao su giảm chấn bo tròn ở đầu gạt (Industrial Amber Rubber Bumper) */}
                <div className="h-4 w-full rounded-b-md bg-amber-500 border-t border-amber-300 shadow-sm" />
              </div>

              {/* Cảm biến quang học S2 (IO1) */}
              <div className="flex items-center gap-1 mt-auto">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 transition-all shrink-0 ${
                    telemetry.s2_sorter1
                      ? "border-cyan-300 bg-cyan-400 shadow-[0_0_12px_#06b6d4]"
                      : "border-slate-400 bg-slate-800"
                  }`}
                />
                <span className="rounded bg-slate-950/90 px-1 font-mono text-[8px] font-bold text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
                  S2:IO1
                </span>
              </div>
            </div>

            {/* 3. CƠ CẤU GẠT SERVO 2 (IO24) & CẢM BIẾN S3 (72%) */}
            <div className="absolute left-[72%] top-0 bottom-0 z-30 flex flex-col items-center justify-between py-0.5 pointer-events-none">
              {/* Đĩa tròn Servo Flange & Khớp quay CNC */}
              <div className="relative z-40 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-900 shadow-md shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
                {/* 4 Lỗ ốc servo disc */}
                <div className="absolute top-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute left-0.5 h-1 w-1 rounded-full bg-slate-500" />
                <div className="absolute right-0.5 h-1 w-1 rounded-full bg-slate-500" />
              </div>

              {/* Cánh Tay Gạt Hợp Kim Nhôm CNC Phay Nguyên Khối */}
              <div
                className="absolute top-3.5 left-2 h-24 w-4 rounded-md border border-blue-300 bg-gradient-to-b from-blue-400 via-blue-600 to-slate-800 shadow-lg flex flex-col items-center justify-between py-1"
                style={{
                  transformOrigin: "top left",
                  transform: arm2Active ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: arm2Active
                    ? "0 0 20px rgba(59, 130, 246, 0.85), inset 0 0 8px #60a5fa"
                    : "0 4px 8px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Rãnh khoét rỗng giảm trọng lượng CNC (Lightening Slot) */}
                <div className="h-12 w-1.5 rounded-full bg-slate-950/80 border border-blue-200/40" />
                {/* Đệm cao su giảm chấn bo tròn ở đầu gạt (High-density Blue Rubber Bumper) */}
                <div className="h-4 w-full rounded-b-md bg-cyan-400 border-t border-cyan-200 shadow-sm" />
              </div>

              {/* Cảm biến quang học S3 (IO6) */}
              <div className="flex items-center gap-1 mt-auto">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 transition-all shrink-0 ${
                    telemetry.s3_sorter2
                      ? "border-blue-300 bg-blue-400 shadow-[0_0_12px_#3b82f6]"
                      : "border-slate-400 bg-slate-800"
                  }`}
                />
                <span className="rounded bg-slate-950/90 px-1 font-mono text-[8px] font-bold text-blue-400 border border-blue-500/30 whitespace-nowrap">
                  S3:IO6
                </span>
              </div>
            </div>

            {/* HIỂN THỊ CÁC VẬT MẪU 2D ĐANG CHẠY TRÊN BĂNG */}
            {items.map((item) => renderPhysicalItem(item))}
          </div>

          {/* Rulo Bị Động Cuối Băng (Idler Drum - Tiện CNC nhôm thép với bạc đạn đồng) */}
          <div className="relative z-20 flex h-32 w-14 shrink-0 flex-col items-center justify-between rounded-r-2xl border-y-4 border-r-4 border-slate-700 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-600 shadow-xl overflow-hidden py-1">
            {/* Gờ giữ đai trên */}
            <div className="h-2 w-full bg-slate-800 border-b border-slate-600/80 shadow-inner" />
            {/* Ổ bi bạc đạn đồng thau CNC xoay quanh tâm trục */}
            <div
              className={`h-9 w-9 rounded-full border-2 border-amber-500/80 bg-slate-900 shadow-md flex items-center justify-center ${
                isBeltMoving ? "roller-rotating" : ""
              }`}
            >
              <div className="relative h-6 w-6 rounded-full border border-slate-400/50 bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center">
                {/* 4 Chấu ốc cố định trục quay */}
                <div className="absolute top-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute left-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="absolute right-0.5 h-1 w-1 rounded-full bg-amber-400" />
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
              </div>
            </div>
            {/* Gờ giữ đai dưới */}
            <div className="h-2 w-full bg-slate-800 border-t border-slate-600/80 shadow-inner" />
          </div>
        </div>

        {/* Thanh Ray Trượt T-Slot Rãnh Dẫn Hướng Viền Dưới */}
        <div className="chrome-rail-ruler rounded-md relative flex items-center justify-between px-3 h-4 mt-1">
          <div className="absolute inset-0 ruler-ticks opacity-60 pointer-events-none" />
          <div className="relative z-10 w-full flex justify-between text-[8px] font-mono text-slate-600 dark:text-slate-300 pointer-events-none">
            <span className="truncate">T-SLOT 2020 CNC PROFILE</span>
            <span className="hidden md:inline truncate">POSITION SENSORS: S1 (IO0) • S2 (IO1) • S3 (IO6)</span>
            <span className="truncate">INDUSTRIAL DIGITAL TWIN V3.2</span>
          </div>
        </div>

        {/* CÁC MÁNG HỨNG NGHIÊNG THEO TRỌNG LỰC (GRAVITY SLIDE CHUTES) BÊN DƯỚI BĂNG TẢI */}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* MÁNG KHAY 1 (GẠT 1 - 45%) */}
          <div className="relate-card relative overflow-hidden rounded-2xl border border-rose-500/30 bg-white p-3.5 shadow-sm dark:border-rose-500/20 dark:bg-[#161822] hover:border-rose-500/50 transition-colors flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] shrink-0" />
                  <span className="truncate">MÁNG TRƯỢT 1 (GẠT 1)</span>
                </span>
                <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 shrink-0">
                  Servo IO23
                </span>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {bin1Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong máng:
                </span>
                <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0">
                  {binCounts.bin1} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const isFilled = idx < Math.ceil((binCounts.bin1 / 50) * 10);
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFilled
                          ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Góc dốc 25° • Trạm 45%</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin1}/50 SP (Định mức)</span>
              </div>
            </div>
          </div>

          {/* MÁNG KHAY 2 (GẠT 2 - 72%) */}
          <div className="relate-card relative overflow-hidden rounded-2xl border border-blue-500/30 bg-white p-3.5 shadow-sm dark:border-blue-500/20 dark:bg-[#161822] hover:border-blue-500/50 transition-colors flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6] shrink-0" />
                  <span className="truncate">MÁNG TRƯỢT 2 (GẠT 2)</span>
                </span>
                <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 shrink-0">
                  Servo IO24
                </span>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {bin2Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong máng:
                </span>
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0">
                  {binCounts.bin2} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const isFilled = idx < Math.ceil((binCounts.bin2 / 50) * 10);
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFilled
                          ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]"
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Góc dốc 25° • Trạm 72%</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin2}/50 SP (Định mức)</span>
              </div>
            </div>
          </div>

          {/* MÁNG KHAY 3 (ĐI THẲNG - 96%) */}
          <div className="relate-card relative overflow-hidden rounded-2xl border border-amber-500/30 bg-white p-3.5 shadow-sm dark:border-amber-500/20 dark:bg-[#161822] hover:border-amber-500/50 transition-colors flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] shrink-0" />
                  <span className="truncate">KHAY 3 (MẶC ĐỊNH)</span>
                </span>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 shrink-0">
                  Đi Thẳng
                </span>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn tiếp nhận:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {bin3Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Các nhãn còn lại"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong máng:
                </span>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0">
                  {binCounts.bin3} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const isFilled = idx < Math.ceil((binCounts.bin3 / 50) * 10);
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFilled
                          ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]"
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Thoát tự do 1000mm • 96%</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin3}/50 SP (Định mức)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

