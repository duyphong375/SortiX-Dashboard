"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Wifi,
  Radio,
  Pause,
  Play,
  AlertOctagon,
  BarChart2,
  ArrowRight,
  Boxes,
  SlidersHorizontal,
} from "lucide-react";
import { TelemetryData, CATALOG_BRANDS } from "@/lib/types";
import { TemperatureGaugeWidget } from "@/components/ui/TemperatureGaugeWidget";
import { BinCapacityInput } from "@/components/ui/BinCapacityInput";
import { getBinColorTheme } from "@/lib/binTheme";

export interface LiveHealthAndBinWidgetProps {
  telemetry: TelemetryData;
  mqttStatus: "connected" | "disconnected" | "error";
  isEspConnected: boolean;
  isSimulation: boolean;
  isRunning: boolean;
  binCounts: { bin1: number; bin2: number; bin3: number };
  binCapacities?: { bin1: number; bin2: number; bin3: number };
  bin1Brands: string[];
  bin2Brands: string[];
  bin3Brands?: string[];
  handleToggleRun: () => void;
  handleEmergencyStop: () => void;
  isDeviceOffline?: boolean;
  onSetBinCount?: (binIndex: 1 | 2 | 3, count: number) => void;
  onSetBinCapacity?: (binIndex: 1 | 2 | 3, capacity: number) => void;
}

export function LiveHealthAndBinWidget({
  telemetry,
  mqttStatus,
  isEspConnected,
  isSimulation,
  isRunning,
  binCounts,
  binCapacities = { bin1: 50, bin2: 50, bin3: 50 },
  bin1Brands,
  bin2Brands,
  bin3Brands = [],
  handleToggleRun,
  handleEmergencyStop,
  isDeviceOffline = false,
  onSetBinCount,
  onSetBinCapacity,
}: LiveHealthAndBinWidgetProps) {
  const cap1 = binCapacities.bin1 || 50;
  const cap2 = binCapacities.bin2 || 50;
  const cap3 = binCapacities.bin3 || 50;

  const bin1Theme = getBinColorTheme(bin1Brands[0], "rose");
  const bin2Theme = getBinColorTheme(bin2Brands[0], "blue");
  const bin3Theme = getBinColorTheme(bin3Brands[0], "amber");
  return (
    <div className="relate-card flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
      <div>
        {/* Header Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-xs shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Vận hành & khay chứa
              </h3>
              <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Dung lượng khay và trạng thái vi xử lý thời gian thực.
              </p>
            </div>
          </div>

          {/* Trạng thái hoạt động tức thời */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isDeviceOffline || (!isEspConnected && !isSimulation)
                  ? "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400"
                  : telemetry.estop_pressed
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : isRunning
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    !isDeviceOffline && (isEspConnected || isSimulation) && isRunning && !telemetry.estop_pressed
                      ? "animate-ping bg-emerald-400"
                      : ""
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isDeviceOffline || (!isEspConnected && !isSimulation)
                      ? "bg-slate-500"
                      : telemetry.estop_pressed
                      ? "bg-rose-500"
                      : isRunning
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
              </span>
              <span>
                {isDeviceOffline || (!isEspConnected && !isSimulation)
                  ? "Ngoại tuyến"
                  : telemetry.estop_pressed
                  ? "E-Stop kích hoạt"
                  : isRunning
                  ? "Đang chạy"
                  : "Tạm dừng"}
              </span>
            </span>
          </div>
        </div>

        {/* CỤM TRẠNG THÁI VI XỬ LÝ ESP32-C5 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-500" />
              Vi xử lý ESP32-C5
            </span>
            <span className="text-[10px] font-mono text-slate-400">Node: {telemetry.device_id}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Nhiệt độ Đồng hồ Gauge */}
            <TemperatureGaugeWidget
              compact={true}
              currentTemp={telemetry.cpu_temp}
              thresholdTemp={75.0}
              deviceName="Động cơ / CPU"
              isOnline={!isDeviceOffline && (isEspConnected || isSimulation)}
              isSimulation={isSimulation}
            />

            {/* 2. Sóng Wi-Fi 6 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Wi-Fi 6</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate max-w-[110px]" title={telemetry.wifi_band}>
                    {!isDeviceOffline && (isEspConnected || isSimulation) ? `${telemetry.wifi_rssi} dBm` : "-- dBm"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                  !isDeviceOffline && (isEspConnected || isSimulation)
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                    : "text-slate-500 bg-slate-500/10"
                }`}
              >
                {!isDeviceOffline && (isEspConnected || isSimulation) ? "5.0 GHz" : "Ngoại tuyến"}
              </span>
            </div>

            {/* 3. Trạng thái Broker MQTT */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                    mqttStatus === "connected"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}
                >
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Broker MQTT</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {isSimulation ? "Mô phỏng" : mqttStatus === "connected" ? "Đã kết nối" : "Ngoại tuyến"}
                  </p>
                </div>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  isSimulation
                    ? "bg-purple-500 shadow-[0_0_6px_#a855f7]"
                    : mqttStatus === "connected"
                    ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                    : "bg-rose-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* THANH TIẾN ĐỘ DUNG LƯỢNG 3 KHAY CHỨA TỨC THỜI */}
        <div className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Dung lượng khay chứa</span>
            <span>Tỉ lệ đầy</span>
          </div>

          {/* Khay 1 (Gạt 1) */}
          <div className={`rounded-xl border p-3 transition-all ${
            binCounts.bin1 >= cap1
              ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-950/20 animate-pulse"
              : bin1Theme.widgetCardBorder
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className={`flex items-center gap-2 font-bold ${bin1Theme.widgetTitleText}`}>
                {binCounts.bin1 >= cap1 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${bin1Theme.widgetDotClass}`} />
                )}
                <span>
                  Khay 1 (
                  {bin1Brands.length > 0
                    ? bin1Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ")
                    : "Trống"}{" "}
                  / Gạt 1)
                </span>
              </div>
              {binCounts.bin1 >= cap1 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin1}/{cap1} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {binCounts.bin1}/{cap1} SP (
                  {Math.min(100, Math.round((binCounts.bin1 / cap1) * 100))}%)
                </span>
              )}
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  binCounts.bin1 >= cap1
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse"
                    : bin1Theme.widgetProgressBar
                }`}
                style={{ width: `${Math.min(100, (binCounts.bin1 / cap1) * 100)}%` }}
              />
            </div>

            {/* Thanh trượt điều chỉnh sức chứa định mức Khay 1 */}
            {(onSetBinCapacity || onSetBinCount) && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                    <SlidersHorizontal className={`h-3 w-3 ${bin1Theme.sliderIcon}`} />
                    Sức chứa Khay 1:
                  </span>
                  <BinCapacityInput
                    value={cap1}
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
                  value={cap1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (onSetBinCapacity) onSetBinCapacity(1, val);
                    else if (onSetBinCount) onSetBinCount(1, val);
                  }}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin1Theme.sliderAccent}`}
                />
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
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

          {/* Khay 2 (Gạt 2) */}
          <div className={`rounded-xl border p-3 transition-all ${
            binCounts.bin2 >= cap2
              ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-950/20 animate-pulse"
              : bin2Theme.widgetCardBorder
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className={`flex items-center gap-2 font-bold ${bin2Theme.widgetTitleText}`}>
                {binCounts.bin2 >= cap2 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${bin2Theme.widgetDotClass}`} />
                )}
                <span>
                  Khay 2 (
                  {bin2Brands.length > 0
                    ? bin2Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ")
                    : "Trống"}{" "}
                  / Gạt 2)
                </span>
              </div>
              {binCounts.bin2 >= cap2 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin2}/{cap2} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {binCounts.bin2}/{cap2} SP (
                  {Math.min(100, Math.round((binCounts.bin2 / cap2) * 100))}%)
                </span>
              )}
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  binCounts.bin2 >= cap2
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse"
                    : bin2Theme.widgetProgressBar
                }`}
                style={{ width: `${Math.min(100, (binCounts.bin2 / cap2) * 100)}%` }}
              />
            </div>

            {/* Thanh trượt điều chỉnh sức chứa định mức Khay 2 */}
            {(onSetBinCapacity || onSetBinCount) && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                    <SlidersHorizontal className={`h-3 w-3 ${bin2Theme.sliderIcon}`} />
                    Sức chứa Khay 2:
                  </span>
                  <BinCapacityInput
                    value={cap2}
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
                  value={cap2}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (onSetBinCapacity) onSetBinCapacity(2, val);
                    else if (onSetBinCount) onSetBinCount(2, val);
                  }}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin2Theme.sliderAccent}`}
                />
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
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

          {/* Khay 3 (Mặc định) */}
          <div className={`rounded-xl border p-3 transition-all ${
            binCounts.bin3 >= cap3
              ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-950/20 animate-pulse"
              : bin3Theme.widgetCardBorder
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className={`flex items-center gap-2 font-bold ${bin3Theme.widgetTitleText}`}>
                {binCounts.bin3 >= cap3 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${bin3Theme.widgetDotClass}`} />
                )}
                <span>Khay 3 (Mặc định)</span>
              </div>
              {binCounts.bin3 >= cap3 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin3}/{cap3} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {binCounts.bin3}/{cap3} SP (
                  {Math.min(100, Math.round((binCounts.bin3 / cap3) * 100))}%)
                </span>
              )}
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  binCounts.bin3 >= cap3
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse"
                    : bin3Theme.widgetProgressBar
                }`}
                style={{ width: `${Math.min(100, (binCounts.bin3 / cap3) * 100)}%` }}
              />
            </div>

            {/* Thanh trượt điều chỉnh sức chứa định mức Khay 3 */}
            {(onSetBinCapacity || onSetBinCount) && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                    <SlidersHorizontal className={`h-3 w-3 ${bin3Theme.sliderIcon}`} />
                    Sức chứa Khay 3:
                  </span>
                  <BinCapacityInput
                    value={cap3}
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
                  value={cap3}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (onSetBinCapacity) onSetBinCapacity(3, val);
                    else if (onSetBinCount) onSetBinCount(3, val);
                  }}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${bin3Theme.sliderAccent}`}
                />
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
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

      {/* Cụm nút thao tác & Nút liên kết nhanh sang /analytics */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            disabled={telemetry.estop_pressed}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
              isRunning
                ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
            }`}
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isRunning ? "Tạm dừng" : "Khởi động"}</span>
          </button>

          <button
            onClick={handleEmergencyStop}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
              telemetry.estop_pressed
                ? "border-rose-600 bg-rose-600 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                : "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>{telemetry.estop_pressed ? "E-Stop đang bật" : "Dừng khẩn E-Stop"}</span>
          </button>
        </div>

        <Link
          href="/analytics"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95"
        >
          <BarChart2 className="h-4 w-4" />
          <span>Xem thống kê chi tiết</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
