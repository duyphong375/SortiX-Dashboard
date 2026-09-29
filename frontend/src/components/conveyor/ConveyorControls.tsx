"use client";

import React from "react";
import { Play, Pause, AlertOctagon, Gauge, Sliders, Zap } from "lucide-react";
import { TelemetryData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-3">
      {/* Cụm nút Bắt đầu / Tạm dừng / Dừng khẩn cấp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onToggleRun}
            disabled={telemetry.estop_pressed}
            variant={isRunning ? "outline" : "emerald"}
            size="default"
            className="gap-2 font-bold shadow-sm"
          >
            {isRunning ? <Pause className="h-4 w-4 text-amber-500" /> : <Play className="h-4 w-4" />}
            <span>{isRunning ? "Tạm dừng" : "Khởi động Băng tải"}</span>
          </Button>

          <Button
            onClick={onEmergencyStop}
            variant="estop"
            size="default"
            className="gap-2 font-black uppercase tracking-wider"
          >
            <AlertOctagon className="h-4 w-4 animate-pulse" />
            <span>{telemetry.estop_pressed ? "E-Stop ĐANG BẬT" : "DỪNG KHẨN E-STOP"}</span>
          </Button>
        </div>

        {/* Trạng thái băng tải */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              telemetry.estop_pressed
                ? "destructive"
                : isRunning
                ? "success"
                : "warning"
            }
            className="px-3 py-1 text-xs font-bold"
          >
            <span className="relative flex h-2 w-2 mr-1">
              {isRunning && !telemetry.estop_pressed && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  telemetry.estop_pressed
                    ? "bg-rose-500"
                    : isRunning
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
            </span>
            <span>
              {telemetry.estop_pressed
                ? "E-Stop Kích hoạt"
                : isRunning
                ? "Băng tải đang chạy"
                : "Tạm dừng"}
            </span>
          </Badge>
        </div>
      </div>

      {/* Thanh điều tốc Băng Tải (PWM) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 dark:border-white/[0.08] dark:bg-[#131722]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Điều tốc động cơ Băng tải
              </span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                {speed}% PWM
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Vận tốc dài: <strong className="text-slate-700 dark:text-slate-300">{linearSpeedCms} cm/s</strong> • Con lăn: <strong className="text-slate-700 dark:text-slate-300">{rollerRpm} RPM</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:w-72">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={speed}
            disabled={telemetry.estop_pressed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-cyan-500 disabled:opacity-40"
          />

          <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
            <button
              type="button"
              disabled={telemetry.estop_pressed}
              onClick={() => onSpeedChange(30)}
              className="px-2 py-1 rounded bg-slate-200/70 dark:bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors disabled:opacity-40"
            >
              30%
            </button>
            <button
              type="button"
              disabled={telemetry.estop_pressed}
              onClick={() => onSpeedChange(65)}
              className="px-2 py-1 rounded bg-slate-200/70 dark:bg-white/5 font-bold hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors disabled:opacity-40"
            >
              65%
            </button>
            <button
              type="button"
              disabled={telemetry.estop_pressed}
              onClick={() => onSpeedChange(100)}
              className="px-2 py-1 rounded bg-slate-200/70 dark:bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors disabled:opacity-40"
            >
              MAX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
