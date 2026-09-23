"use client";

import React from "react";
import { Box, Sparkles, BarChart2 } from "lucide-react";
import { TelemetryData } from "@/lib/types";

export interface QuickFeedBarProps {
  isSimulation: boolean;
  isRunning: boolean;
  telemetry: TelemetryData;
  onSpawnPackage: (brandKey?: string) => void;
  onGenerateDemoData?: () => void;
  bin1Brands?: string[];
  bin2Brands?: string[];
  bin3Brands?: string[];
}

export function QuickFeedBar({
  isSimulation,
  isRunning,
  telemetry,
  onSpawnPackage,
  onGenerateDemoData,
  bin1Brands,
  bin2Brands,
}: QuickFeedBarProps) {
  if (!isSimulation) return null;

  const isDisabled = !isRunning || telemetry.estop_pressed;

  const getBrandTargetBinName = (brandKey: string) => {
    if (bin1Brands?.includes(brandKey)) return "Khay 1";
    if (bin2Brands?.includes(brandKey)) return "Khay 2";
    return "Khay 3";
  };

  const hasBinConfig = (bin1Brands && bin1Brands.length > 0) || (bin2Brands && bin2Brands.length > 0);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 transition-all duration-300 dark:border-white/[0.06] dark:bg-[#111319]">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
        <Box className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>Nạp mẫu vật (Mô phỏng):</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bơm kim tiêm */}
        <button
          onClick={() => onSpawnPackage("med_syringe")}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
          title="Nạp Bơm kim tiêm / Dao mổ"
        >
          <span>Bơm kim tiêm / Dao mổ{hasBinConfig ? ` (${getBrandTargetBinName("med_syringe")})` : ""}</span>
        </button>

        {/* Kẹp phẫu thuật (Pean) */}
        <button
          onClick={() => onSpawnPackage("med_forceps")}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
          title="Nạp Kẹp phẫu thuật Pean"
        >
          <span>Kẹp Pean{hasBinConfig ? ` (${getBrandTargetBinName("med_forceps")})` : ""}</span>
        </button>

        {/* Kéo phẫu thuật */}
        <button
          onClick={() => onSpawnPackage("med_scissors")}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
          title="Nạp Kéo mổ phẫu thuật"
        >
          <span>Kéo phẫu thuật{hasBinConfig ? ` (${getBrandTargetBinName("med_scissors")})` : ""}</span>
        </button>

        {/* Lọ thuốc / Ống nghiệm */}
        <button
          onClick={() => onSpawnPackage("med_vial")}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
          title="Nạp Lọ thuốc / Ống nghiệm"
        >
          <span>Lọ thuốc / Ống nghiệm{hasBinConfig ? ` (${getBrandTargetBinName("med_vial")})` : ""}</span>
        </button>

        {/* Random Phôi */}
        <button
          onClick={() => onSpawnPackage()}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-400 dark:hover:bg-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
          title="Thả ngẫu nhiên một phôi"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          <span>Phôi ngẫu nhiên</span>
        </button>

        {/* Generate Demo Data */}
        {onGenerateDemoData && (
          <button
            onClick={onGenerateDemoData}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25 shadow-xs active:scale-95"
            title="Tạo dữ liệu lịch sử demo ngẫu nhiên"
          >
            <BarChart2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tạo dữ liệu demo</span>
          </button>
        )}
      </div>
    </div>
  );
}
