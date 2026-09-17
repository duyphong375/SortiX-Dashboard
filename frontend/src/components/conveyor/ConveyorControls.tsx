"use client";

import React from "react";
import { Play, Pause, OctagonAlert, Sliders } from "lucide-react";
import { TelemetryData } from "@/lib/types";

export interface ConveyorControlsProps {
  telemetry: TelemetryData;
  isRunning: boolean;
  speed: number;
  isBeltMoving: boolean;
  linearSpeedCms: string;
  rollerRpm: number;
  onToggleRun: () => void;
  onEmergencyStop: () => void;
  onSpeedChange: (newSpeed: number) => void;
}

export function ConveyorControls({
  telemetry,
  isRunning,
  speed,
  isBeltMoving,
  linearSpeedCms,
  rollerRpm,
  onToggleRun,
  onEmergencyStop,
  onSpeedChange,
}: ConveyorControlsProps) {
  return (
    <div className="space-y-2.5">
      {/* Cụm nút Bắt đầu / Tạm dừng / Dừng khẩn cấp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleRun}
            disabled={telemetry.estop_pressed}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRunning
                ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
            }`}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isRunning ? "Tạm Dừng Băng Tải" : "Khởi Động Băng Tải"}</span>
          </button>

          <button
            onClick={onEmergencyStop}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
              telemetry.estop_pressed
                ? "border-rose-600 bg-rose-600 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse"
                : "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25"
            }`}
          >
            <OctagonAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{telemetry.estop_pressed ? "E-STOP ĐANG BẬT" : "DỪNG KHẨN CẤP"}</span>
          </button>
        </div>

        {/* Trạng thái băng tải */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              telemetry.estop_pressed
                ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : isRunning
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRunning && !telemetry.estop_pressed ? "animate-ping bg-emerald-400" : ""
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  telemetry.estop_pressed
                    ? "bg-rose-500"
                    : isRunning
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </span>
            <span>
              {telemetry.estop_pressed
                ? "E-Stop Bật"
                : isRunning
                ? "Băng Tải Đang Chạy"
                : "Tạm Dừng"}
            </span>
          </span>
        </div>
      </div>

      {/* Thanh điều tốc Băng Tải (PWM) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-white/[0.06] dark:bg-[#111319]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Sliders className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-300">Tốc độ Băng tải:</span>
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
          <span className="shrink-0 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 font-mono text-xs font-black text-teal-700 dark:text-cyan-300">
            {speed}%
          </span>
        </div>
      </div>
    </div>
  );
}
