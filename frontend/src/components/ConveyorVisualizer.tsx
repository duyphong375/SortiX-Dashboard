"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BinCapacityInput } from "@/components/ui/BinCapacityInput";
import { TelemetryData, SorterConfig, CATALOG_BRANDS, VisualItem, JamDetectedPayload } from "@/lib/types";
import { getBinColorTheme } from "@/lib/binTheme";
import {
  Camera,
  Trash2,
  Boxes,
  PackageCheck,
  SlidersHorizontal,
} from "lucide-react";
import { VisualItemRenderer } from "@/components/conveyor/VisualItemRenderer";
import { ConveyorStations } from "@/components/conveyor/ConveyorStations";
import { ConveyorToolbar } from "@/components/conveyor/ConveyorToolbar";

export interface ConveyorVisualizerProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  isSimulation: boolean;
  onSpawnPackage?: (brandKey?: string) => void;
  onEmergencyStop?: () => void;
  onUnlockEmergency?: () => void;
  onClearBin?: (binIndex: 1 | 2 | 3) => void;
  onConfirmBinReplaced?: (binIndex: 1 | 2 | 3) => void;
  isRunning?: boolean;
  isJammed?: boolean;
  onUnlockJam?: () => void;
  onClearJam?: () => void;
  telemetry: TelemetryData;
  config: SorterConfig;
  events?: any[];
  items?: VisualItem[];
  binCounts?: { bin1: number; bin2: number; bin3: number };
  isBinFull?: boolean;
  fullBinIndex?: number | null;
  onGenerateDemoData?: () => void;
  onTestJamSimulation?: (zone?: string) => void;
  jamPayload?: JamDetectedPayload | null;
  binCapacities?: { bin1: number; bin2: number; bin3: number };
  onSetBinCapacity?: (binIndex: 1 | 2 | 3, capacity: number) => void;
  onSetBinCount?: (binIndex: 1 | 2 | 3, count: number) => void;
  onToggleRun?: () => void;
  arm1Active?: boolean;
  arm2Active?: boolean;
  brandCounts?: Record<string, number>;
  onToggleSimulationMode?: () => void;
  jamIncident?: any;
}

export const ConveyorVisualizer: React.FC<ConveyorVisualizerProps> = ({
  speed,
  onSpeedChange,
  isSimulation,
  onSpawnPackage,
  onEmergencyStop,
  onUnlockEmergency,
  onClearBin,
  onConfirmBinReplaced,
  isRunning = true,
  isJammed = false,
  onUnlockJam,
  onClearJam,
  telemetry,
  config,
  events = [],
  items = [],
  binCounts = { bin1: 0, bin2: 0, bin3: 0 },
  isBinFull = false,
  fullBinIndex = null,
  onGenerateDemoData,
  onTestJamSimulation,
  jamPayload,
  binCapacities = { bin1: 50, bin2: 50, bin3: 50 },
  onSetBinCapacity,
  onSetBinCount,
  onToggleRun,
  arm1Active: propArm1Active,
  arm2Active: propArm2Active,
}) => {
  const [confirmBinClear, setConfirmBinClear] = useState<1 | 2 | 3 | null>(null);

  const arm1Active = propArm1Active ?? telemetry.arm1_active;
  const arm2Active = propArm2Active ?? telemetry.arm2_active;

  const hasActiveItems = items.some((it) => !it.sorted || (it.yOffset || 0) < 45);
  const isBeltMoving =
    isRunning &&
    (isSimulation ? hasActiveItems : hasActiveItems) &&
    !telemetry.estop_pressed &&
    !isBinFull &&
    !isJammed;
  const linearSpeedCms = isBeltMoving ? ((speed / 100) * 35).toFixed(1) : "0.0";
  const rollerRpm = isBeltMoving ? Math.floor((speed / 100) * 120) : 0;

  // Xác định danh sách thương hiệu gán cho từng khay
  const bin1Brands = config.bins[0]?.brand_ids || [];
  const bin2Brands = config.bins[1]?.brand_ids || [];
  const assignedBrands = new Set([...bin1Brands, ...bin2Brands]);
  const bin3Brands = Object.keys(CATALOG_BRANDS).filter((b) => !assignedBrands.has(b));

  // Đồng bộ màu sắc động theo thương hiệu gán cho từng khay
  const bin1Theme = getBinColorTheme(bin1Brands[0], "rose");
  const bin2Theme = getBinColorTheme(bin2Brands[0], "blue");
  const bin3Theme = getBinColorTheme(bin3Brands[0], "amber");

  const getBrandTargetBinName = (brandKey: string) => {
    if (bin1Brands.includes(brandKey)) return "Khay 1";
    if (bin2Brands.includes(brandKey)) return "Khay 2";
    return "Khay 3";
  };

  const cap1 = binCapacities.bin1 || 50;
  const cap2 = binCapacities.bin2 || 50;
  const cap3 = binCapacities.bin3 || 50;

  // Render hình dạng 2D chân thực của từng loại phôi mẫu (Digital Twin)
  const renderPhysicalItem = (item: VisualItem) => (
    <VisualItemRenderer key={item.id} item={item} />
  );

  return (
    <div className="relate-card relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 dark:border-white/[0.07] dark:bg-[#161822] min-h-full justify-between gap-3 sm:gap-4">
      <ConveyorToolbar
        telemetry={telemetry}
        isRunning={isRunning}
        itemsCount={items.length}
        isSimulation={isSimulation}
        onToggleRun={onToggleRun}
        onEmergencyStop={onEmergencyStop}
        onSpawnPackage={onSpawnPackage}
        onGenerateDemoData={onGenerateDemoData}
        getBrandTargetBinName={getBrandTargetBinName}
        speed={speed}
        onSpeedChange={onSpeedChange}
        isBeltMoving={isBeltMoving}
        linearSpeedCms={linearSpeedCms}
        rollerRpm={rollerRpm}
      />


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
            <span className={`absolute left-[45%] top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap font-black ${bin1Theme.rulerText}`}>
              ▲ 450mm <span className="hidden sm:inline">(PISTON 1)</span>
            </span>
            <span className={`absolute left-[72%] top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap font-black ${bin2Theme.rulerText}`}>
              ▲ 720mm <span className="hidden sm:inline">(PISTON 2)</span>
            </span>
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-black ${bin3Theme.rulerText}`}>
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
          <div className={`rounded-lg border py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0 transition-colors ${
            isJammed
              ? "border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse ring-1 ring-rose-500"
              : bin1Theme.stationBadge
          }`}>
            <span className="shrink-0">{isJammed ? "⚠️" : "🎛️"}</span>
            <span className="truncate">{isJammed ? "2. ZONE A: KẸT PHÔI!" : "2. PISTON 1 (IO23 - 45%)"}</span>
          </div>
          <div className={`rounded-lg border py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0 ${bin2Theme.stationBadge}`}>
            <span className="shrink-0">🎛️</span>
            <span className="truncate">3. PISTON 2 (IO24 - 72%)</span>
          </div>
          <div className={`rounded-lg border py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-sm font-mono min-w-0 ${bin3Theme.stationBadge}`}>
            <span className="shrink-0">📥</span>
            <span className="truncate">4. KHAY 3 (96%)</span>
          </div>
        </div>

        {/* Thông báo trạng thái: Khay đầy tạm dừng / Đứng yên chờ phôi / Tạm dừng */}
        {isBinFull ? (
          <div className="flex justify-center mt-3 mb-1">
            <div className="rounded-full bg-amber-950/90 px-4 py-1.5 backdrop-blur border border-amber-500/50 text-[10px] sm:text-xs font-semibold text-amber-300 shadow-sm flex items-center gap-2 text-center w-fit mx-auto animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span>
                ⚠️ Khay chứa đang đầy ({fullBinIndex ? `Khay ${fullBinIndex}` : "Khay phân loại"} đã đạt định mức) • Băng tải tạm dừng bảo vệ phôi. Vui lòng dọn khay để tiếp tục vận hành!
              </span>
            </div>
          </div>
        ) : !isRunning ? (
          <div className="flex justify-center mt-3 mb-1">
            <div className="rounded-full bg-slate-900/90 px-4 py-1.5 backdrop-blur border border-amber-500/40 text-[10px] sm:text-xs font-semibold text-amber-300 shadow-sm flex items-center gap-2 text-center w-fit mx-auto">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span>Băng tải đang tạm dừng • Nhấn Khởi động để tiếp tục vận hành</span>
            </div>
          </div>
        ) : !isBeltMoving ? (
          <div className="flex justify-center mt-3 mb-1">
            <div className="rounded-full bg-slate-900/90 px-4 py-1.5 backdrop-blur border border-cyan-500/40 text-[10px] sm:text-xs font-semibold text-cyan-300 shadow-sm flex items-center gap-2 text-center w-fit mx-auto">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
              <span>
                {isSimulation
                  ? "Băng tải chờ phôi mẫu • Nhấn nút thả phôi phía trên để nạp sản phẩm"
                  : "Băng tải chờ phôi mẫu • Sẵn sàng nhận phôi từ Camera AI & Hệ thống thực tế"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-3 mb-1">
            <div className="rounded-full bg-slate-900/90 px-4 py-1.5 backdrop-blur border border-emerald-500/40 text-[10px] sm:text-xs font-semibold text-emerald-300 shadow-sm flex items-center gap-2 text-center w-fit mx-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                Băng tải đang chạy • Đang vận chuyển {items.length} phôi mẫu qua các trạm phân loại
              </span>
            </div>
          </div>
        )}

        {/* DÂY ĐAI BĂNG TẢI CHÍNH & VẬT PHẨM CHẠY 2D */}
        <div className="relative my-6 flex items-center">
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
          <div className={`conveyor-belt-track relative h-32 w-full border-y-4 transition-colors duration-300 overflow-visible shadow-inner ${
            isJammed ? "border-rose-500 ring-2 ring-rose-500/50" : "border-slate-700"
          }`}>
            {/* Lớp hoa văn chuyển động 12px micro-ribbed */}
            <div
              className={`absolute inset-0 conveyor-belt-track ${
                isBeltMoving ? "conveyor-belt-running" : ""
              }`}
              style={{
                animationDuration: `${Math.max(0.18, (110 - speed) / 110)}s`,
              }}
            />

            {/* KHU VỰC KẸT PHÔI ZONE A (36% - 54%) */}
            {isJammed && (
              <div className="absolute left-[36%] w-[18%] inset-y-0 z-20 pointer-events-none rounded-xl border-2 border-rose-500 bg-rose-950/40 backdrop-blur-[1px] shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse flex flex-col items-center justify-center">
                <div className="rounded bg-rose-950/95 border border-rose-400 px-1.5 py-0.5 text-[8px] font-black text-rose-200 tracking-wider flex items-center gap-1 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                  <span>KHU VỰC KẸT PHÔI (ZONE A)</span>
                </div>
              </div>
            )}

            {/* Chiều sâu 3D quang học: Vệt sáng phản quang kim loại chạy ngang (Specular Sheen) */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-6 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

            {/* Vạch kẻ trung tâm dẫn hướng phôi */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-cyan-400/30 z-10 pointer-events-none" />

            <ConveyorStations
              isBeltMoving={isBeltMoving}
              telemetry={telemetry}
              isJammed={isJammed}
              arm1Active={arm1Active}
              arm2Active={arm2Active}
            />


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
          {/* MÁNG KHAY 1 (PISTON 1 - 45%) */}
          <div 
            className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
              binCounts.bin1 >= cap1 
                ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]" 
                : bin1Theme.cardNormalBorder
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin1Theme.titleText}`}>
                  {binCounts.bin1 >= cap1 ? (
                    <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                  ) : (
                    <span className={`h-2 w-2 rounded-full shrink-0 ${bin1Theme.dotClass}`} />
                  )}
                  <span className="truncate">KHAY 1 (PISTON 1)</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {binCounts.bin1 >= cap1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmBinReplaced ? onConfirmBinReplaced(1) : onClearBin?.(1);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                      title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                    >
                      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Xác nhận đã thay khay mới</span>
                    </button>
                  ) : (
                    <>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin1Theme.badgeClass}`}>
                        Piston IO23
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmBinClear(1);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin1Theme.clearBtnClass}`}
                        title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap1} SP)`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Dọn khay</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
                <span className={`font-bold ${bin1Theme.brandText}`}>
                  {bin1Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong khay:
                </span>
                <div className={`text-3xl font-black font-mono shrink-0 ${
                  binCounts.bin1 >= cap1 
                    ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" 
                    : bin1Theme.countNormalText
                }`}>
                  {binCounts.bin1} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const cap1 = binCapacities.bin1 || 50;
                  const isFilled = idx < Math.ceil((binCounts.bin1 / cap1) * 10);
                  const isFull = binCounts.bin1 >= cap1;
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFull
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                          : isFilled
                          ? bin1Theme.ledActive
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Góc dốc 25° • Trạm 45%</span>
                {binCounts.bin1 >= (binCapacities.bin1 || 50) ? (
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                    100% ĐẦY ({binCounts.bin1}/{binCapacities.bin1 || 50} SP) - CẦN THAY
                  </span>
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin1}/{binCapacities.bin1 || 50} SP (Định mức)</span>
                )}
              </div>

              {/* Thanh trượt điều chỉnh sức chứa định mức của Máng 1 */}
              {(onSetBinCapacity || onSetBinCount) && (
                <div
                  className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className={`h-3 w-3 ${bin1Theme.sliderIcon}`} />
                      <span>Độ rộng / Sức chứa khay:</span>
                    </span>
                    <BinCapacityInput
                      value={binCapacities.bin1 || 50}
                      onChange={(newVal) => {
                        if (onSetBinCapacity) onSetBinCapacity(1, newVal);
                        else if (onSetBinCount) onSetBinCount(1, newVal);
                      }}
                      colorScheme={bin1Theme.colorScheme}
                    />
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={binCapacities.bin1 || 50}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (onSetBinCapacity) onSetBinCapacity(1, val);
                      else if (onSetBinCount) onSetBinCount(1, val);
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin1Theme.sliderAccent}`}
                  />
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(1, 10) : onSetBinCount?.(1, 10)}
                      className={`${bin1Theme.presetHover} cursor-pointer transition-colors`}
                    >
                      10 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(1, 30) : onSetBinCount?.(1, 30)}
                      className={`${bin1Theme.presetHover} cursor-pointer font-bold transition-colors`}
                    >
                      30 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(1, 50) : onSetBinCount?.(1, 50)}
                      className="hover:text-amber-500 font-bold cursor-pointer transition-colors"
                    >
                      50 SP (Chuẩn)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MÁNG KHAY 2 (PISTON 2 - 72%) */}
          <div 
            className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
              binCounts.bin2 >= cap2 
                ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]" 
                : bin2Theme.cardNormalBorder
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin2Theme.titleText}`}>
                  {binCounts.bin2 >= cap2 ? (
                    <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                  ) : (
                    <span className={`h-2 w-2 rounded-full shrink-0 ${bin2Theme.dotClass}`} />
                  )}
                  <span className="truncate">KHAY 2 (PISTON 2)</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {binCounts.bin2 >= cap2 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmBinReplaced ? onConfirmBinReplaced(2) : onClearBin?.(2);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                      title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                    >
                      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Xác nhận đã thay khay mới</span>
                    </button>
                  ) : (
                    <>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin2Theme.badgeClass}`}>
                        Piston IO24
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmBinClear(2);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin2Theme.clearBtnClass}`}
                        title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap2} SP)`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Dọn khay</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
                <span className={`font-bold ${bin2Theme.brandText}`}>
                  {bin2Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong khay:
                </span>
                <div className={`text-3xl font-black font-mono shrink-0 ${
                  binCounts.bin2 >= cap2 
                    ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" 
                    : bin2Theme.countNormalText
                }`}>
                  {binCounts.bin2} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const cap2 = binCapacities.bin2 || 50;
                  const isFilled = idx < Math.ceil((binCounts.bin2 / cap2) * 10);
                  const isFull = binCounts.bin2 >= cap2;
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFull
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                          : isFilled
                          ? bin2Theme.ledActive
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Góc dốc 25° • Trạm 72%</span>
                {binCounts.bin2 >= (binCapacities.bin2 || 50) ? (
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                    100% ĐẦY ({binCounts.bin2}/{binCapacities.bin2 || 50} SP) - CẦN THAY
                  </span>
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin2}/{binCapacities.bin2 || 50} SP (Định mức)</span>
                )}
              </div>

              {/* Thanh trượt điều chỉnh sức chứa định mức của Máng 2 */}
              {(onSetBinCapacity || onSetBinCount) && (
                <div
                  className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className={`h-3 w-3 ${bin2Theme.sliderIcon}`} />
                      <span>Độ rộng / Sức chứa khay:</span>
                    </span>
                    <BinCapacityInput
                      value={binCapacities.bin2 || 50}
                      onChange={(newVal) => {
                        if (onSetBinCapacity) onSetBinCapacity(2, newVal);
                        else if (onSetBinCount) onSetBinCount(2, newVal);
                      }}
                      colorScheme={bin2Theme.colorScheme}
                    />
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={binCapacities.bin2 || 50}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (onSetBinCapacity) onSetBinCapacity(2, val);
                      else if (onSetBinCount) onSetBinCount(2, val);
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin2Theme.sliderAccent}`}
                  />
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(2, 10) : onSetBinCount?.(2, 10)}
                      className={`${bin2Theme.presetHover} cursor-pointer transition-colors`}
                    >
                      10 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(2, 30) : onSetBinCount?.(2, 30)}
                      className={`${bin2Theme.presetHover} cursor-pointer font-bold transition-colors`}
                    >
                      30 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(2, 50) : onSetBinCount?.(2, 50)}
                      className="hover:text-amber-500 font-bold cursor-pointer transition-colors"
                    >
                      50 SP (Chuẩn)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MÁNG KHAY 3 (ĐI THẲNG - 96%) */}
          <div 
            className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
              binCounts.bin3 >= cap3 
                ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]" 
                : bin3Theme.cardNormalBorder
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin3Theme.titleText}`}>
                  {binCounts.bin3 >= cap3 ? (
                    <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                  ) : (
                    <span className={`h-2 w-2 rounded-full shrink-0 ${bin3Theme.dotClass}`} />
                  )}
                  <span className="truncate">KHAY 3 (MẶC ĐỊNH)</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {binCounts.bin3 >= cap3 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmBinReplaced ? onConfirmBinReplaced(3) : onClearBin?.(3);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                      title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                    >
                      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Xác nhận đã thay khay mới</span>
                    </button>
                  ) : (
                    <>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin3Theme.badgeClass}`}>
                        Đi Thẳng
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmBinClear(3);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin3Theme.clearBtnClass}`}
                        title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap3} SP)`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Dọn khay</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tên nhãn gạt chính */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn tiếp nhận:</span>
                <span className={`font-bold ${bin3Theme.brandText}`}>
                  {bin3Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Các nhãn còn lại"}
                </span>
              </div>

              {/* Số lượng tổng lớn nổi bật */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tổng SP trong khay:
                </span>
                <div className={`text-3xl font-black font-mono shrink-0 ${
                  binCounts.bin3 >= cap3 
                    ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" 
                    : bin3Theme.countNormalText
                }`}>
                  {binCounts.bin3} <span className="text-xs font-normal text-slate-500">SP</span>
                </div>
              </div>
            </div>

            {/* Thanh hiển thị dung lượng 10 vạch phân đoạn (10-Segment LED Meter) */}
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const cap3 = binCapacities.bin3 || 50;
                  const isFilled = idx < Math.ceil((binCounts.bin3 / cap3) * 10);
                  const isFull = binCounts.bin3 >= cap3;
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFull
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                          : isFilled
                          ? bin3Theme.ledActive
                          : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
                <span className="truncate">Thoát tự do 1000mm • 96%</span>
                {binCounts.bin3 >= (binCapacities.bin3 || 50) ? (
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                    100% ĐẦY ({binCounts.bin3}/{binCapacities.bin3 || 50} SP) - CẦN THAY
                  </span>
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{binCounts.bin3}/{binCapacities.bin3 || 50} SP (Định mức)</span>
                )}
              </div>

              {/* Thanh trượt điều chỉnh sức chứa định mức của Khay 3 */}
              {(onSetBinCapacity || onSetBinCount) && (
                <div
                  className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className={`h-3 w-3 ${bin3Theme.sliderIcon}`} />
                      <span>Độ rộng / Sức chứa khay:</span>
                    </span>
                    <BinCapacityInput
                      value={binCapacities.bin3 || 50}
                      onChange={(newVal) => {
                        if (onSetBinCapacity) onSetBinCapacity(3, newVal);
                        else if (onSetBinCount) onSetBinCount(3, newVal);
                      }}
                      colorScheme={bin3Theme.colorScheme}
                    />
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={binCapacities.bin3 || 50}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (onSetBinCapacity) onSetBinCapacity(3, val);
                      else if (onSetBinCount) onSetBinCount(3, val);
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin3Theme.sliderAccent}`}
                  />
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(3, 10) : onSetBinCount?.(3, 10)}
                      className={`${bin3Theme.presetHover} cursor-pointer transition-colors`}
                    >
                      10 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(3, 30) : onSetBinCount?.(3, 30)}
                      className={`${bin3Theme.presetHover} cursor-pointer font-bold transition-colors`}
                    >
                      30 SP
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetBinCapacity ? onSetBinCapacity(3, 50) : onSetBinCount?.(3, 50)}
                      className="hover:text-amber-500 font-bold cursor-pointer transition-colors"
                    >
                      50 SP (Chuẩn)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const selectedBinCount =
          confirmBinClear === 1
            ? binCounts.bin1
            : confirmBinClear === 2
            ? binCounts.bin2
            : confirmBinClear === 3
            ? binCounts.bin3
            : 0;
        const selectedBinCap =
          confirmBinClear === 1
            ? cap1
            : confirmBinClear === 2
            ? cap2
            : confirmBinClear === 3
            ? cap3
            : 50;
        const isSelectedBinFull = selectedBinCount >= selectedBinCap;

        return (
          <ConfirmDialog
            isOpen={confirmBinClear !== null}
            onCancel={() => setConfirmBinClear(null)}
            onConfirm={() => {
              if (confirmBinClear) {
                if (isSelectedBinFull && onConfirmBinReplaced) {
                  onConfirmBinReplaced(confirmBinClear);
                } else {
                  onClearBin?.(confirmBinClear);
                }
              }
              setConfirmBinClear(null);
            }}
            title={
              confirmBinClear && isSelectedBinFull
                ? `Xác nhận đã thay Khay ${confirmBinClear} mới`
                : `Dọn dẹp Khay ${confirmBinClear}`
            }
            message={
              confirmBinClear
                ? isSelectedBinFull
                  ? `Khay ${confirmBinClear} hiện đã đầy ${selectedBinCount}/${selectedBinCap} sản phẩm (100% định mức). Bạn xác nhận đã thay thế khay rỗng mới và muốn đặt lại số lượng về 0?`
                  : `Khay ${confirmBinClear} hiện đang có ${selectedBinCount} sản phẩm (định mức tối đa: ${selectedBinCap} SP). Bạn có chắc chắn muốn dọn sạch khay và đặt lại số đếm về 0 không?`
                : ""
            }
            confirmText={
              confirmBinClear && isSelectedBinFull
                ? "Xác nhận đã thay khay mới"
                : "Xác nhận dọn khay"
            }
            cancelText="Hủy bỏ"
            type="warning"
          />
        );
      })()}
    </div>
  );
};

