"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Thermometer,
  Wifi,
  Radio,
  Pause,
  Play,
  AlertOctagon,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { TelemetryData, CATALOG_BRANDS } from "@/lib/types";

const MAX_BIN_CAPACITY = 50;

export interface LiveHealthAndBinWidgetProps {
  telemetry: TelemetryData;
  mqttStatus: "connected" | "disconnected" | "error";
  isEspConnected: boolean;
  isSimulation: boolean;
  isRunning: boolean;
  binCounts: { bin1: number; bin2: number; bin3: number };
  bin1Brands: string[];
  bin2Brands: string[];
  handleToggleRun: () => void;
  handleEmergencyStop: () => void;
}

export function LiveHealthAndBinWidget({
  telemetry,
  mqttStatus,
  isEspConnected,
  isSimulation,
  isRunning,
  binCounts,
  bin1Brands,
  bin2Brands,
  handleToggleRun,
  handleEmergencyStop,
}: LiveHealthAndBinWidgetProps) {
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
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Tình Trạng Vận Hành & Khay Chứa Tức Thời
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  Live Sorter Health
                </span>
              </h3>
              <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi dung lượng 3 khay chứa định mức & trạng thái vi xử lý ESP32-C5 thời gian thực
              </p>
            </div>
          </div>

          {/* Trạng thái hoạt động tức thời */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                !isEspConnected && !isSimulation
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
                    (isEspConnected || isSimulation) && isRunning && !telemetry.estop_pressed
                      ? "animate-ping bg-emerald-400"
                      : ""
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    !isEspConnected && !isSimulation
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
                {!isEspConnected && !isSimulation
                  ? "Chưa Kết Nối"
                  : telemetry.estop_pressed
                  ? "E-Stop Kích Hoạt"
                  : isRunning
                  ? "Đang Vận Hành"
                  : "Tạm Dừng"}
              </span>
            </span>
          </div>
        </div>

        {/* CỤM TRẠNG THÁI VI XỬ LÝ ESP32-C5 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-500" />
              Cụm Vi Xử Lý ESP32-C5 & Truyền Thông IoT
            </span>
            <span className="text-[10px] font-mono text-slate-400">Node: {telemetry.device_id}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Nhiệt độ */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Nhiệt độ CPU</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {isEspConnected || isSimulation ? `${telemetry.cpu_temp}°C` : "--°C"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isEspConnected || isSimulation
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "text-slate-500 bg-slate-500/10"
                }`}
              >
                {isEspConnected || isSimulation ? "Bình thường" : "N/A"}
              </span>
            </div>

            {/* 2. Sóng Wi-Fi 6 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Sóng Wi-Fi 6</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate max-w-[110px]" title={telemetry.wifi_band}>
                    {isEspConnected || isSimulation ? `${telemetry.wifi_rssi} dBm` : "-- dBm"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                  isEspConnected || isSimulation
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                    : "text-slate-500 bg-slate-500/10"
                }`}
              >
                {isEspConnected || isSimulation ? "5.0 GHz" : "N/A"}
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
                    {isSimulation ? "Mô Phỏng" : mqttStatus === "connected" ? "Đã Kết Nối" : "Ngoại Tuyến"}
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
            <span>Dung Lượng 3 Khay Chứa (Định mức {MAX_BIN_CAPACITY} SP / Khay)</span>
            <span>Tỉ lệ đầy khay</span>
          </div>

          {/* Khay 1 (Gạt 1) */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 dark:border-rose-500/20 dark:bg-rose-950/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span>
                  Khay 1 (
                  {bin1Brands.length > 0
                    ? bin1Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ")
                    : "Trống"}{" "}
                  / Gạt 1)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {binCounts.bin1}/{MAX_BIN_CAPACITY} SP (
                {Math.min(100, Math.round((binCounts.bin1 / MAX_BIN_CAPACITY) * 100))}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500 shadow-[0_0_8px_#f43f5e]"
                style={{ width: `${Math.min(100, (binCounts.bin1 / MAX_BIN_CAPACITY) * 100)}%` }}
              />
            </div>
          </div>

          {/* Khay 2 (Gạt 2) */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 dark:border-blue-500/20 dark:bg-blue-950/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                <span>
                  Khay 2 (
                  {bin2Brands.length > 0
                    ? bin2Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ")
                    : "Trống"}{" "}
                  / Gạt 2)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {binCounts.bin2}/{MAX_BIN_CAPACITY} SP (
                {Math.min(100, Math.round((binCounts.bin2 / MAX_BIN_CAPACITY) * 100))}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_#3b82f6]"
                style={{ width: `${Math.min(100, (binCounts.bin2 / MAX_BIN_CAPACITY) * 100)}%` }}
              />
            </div>
          </div>

          {/* Khay 3 (Mặc định) */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 dark:border-amber-500/20 dark:bg-amber-950/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                <span>Khay 3 (Mặc định)</span>
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {binCounts.bin3}/{MAX_BIN_CAPACITY} SP (
                {Math.min(100, Math.round((binCounts.bin3 / MAX_BIN_CAPACITY) * 100))}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500 shadow-[0_0_8px_#f59e0b]"
                style={{ width: `${Math.min(100, (binCounts.bin3 / MAX_BIN_CAPACITY) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cụm nút thao tác & Nút liên kết nhanh sang /analytics */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
              isRunning
                ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
            }`}
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isRunning ? "Tạm Dừng Line" : "Khởi Động Line"}</span>
          </button>

          <button
            onClick={handleEmergencyStop}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 transition-all hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25 shadow-xs"
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>E-Stop Khẩn Cấp</span>
          </button>
        </div>

        <Link
          href="/analytics"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95"
        >
          <BarChart2 className="h-4 w-4" />
          <span>Xem Biểu Đồ Phân Tích Chi Tiết</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
