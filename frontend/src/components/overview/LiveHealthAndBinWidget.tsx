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
  SlidersHorizontal,
  Info,
  Lock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { TelemetryData, CATALOG_BRANDS } from "@/lib/types";
import { TemperatureGaugeWidget } from "@/components/ui/TemperatureGaugeWidget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth, usePermission } from "@/contexts/AuthContext";

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
}: LiveHealthAndBinWidgetProps) {
  const { user } = useAuth();
  const canControlConveyor = usePermission("conveyor.control");
  const canEditConfig = usePermission("config.edit");

  const cap1 = binCapacities.bin1 || 50;
  const cap2 = binCapacities.bin2 || 50;
  const cap3 = binCapacities.bin3 || 50;

  const isFull1 = binCounts.bin1 >= cap1;
  const isWarn1 = !isFull1 && binCounts.bin1 / cap1 >= 0.8;
  const rate1 = Math.min(100, Math.round((binCounts.bin1 / cap1) * 100));

  const isFull2 = binCounts.bin2 >= cap2;
  const isWarn2 = !isFull2 && binCounts.bin2 / cap2 >= 0.8;
  const rate2 = Math.min(100, Math.round((binCounts.bin2 / cap2) * 100));

  const isFull3 = binCounts.bin3 >= cap3;
  const isWarn3 = !isFull3 && binCounts.bin3 / cap3 >= 0.8;
  const rate3 = Math.min(100, Math.round((binCounts.bin3 / cap3) * 100));

  // Trạng thái vận hành tức thời
  const statusInfo = isDeviceOffline || (!isEspConnected && !isSimulation)
    ? { label: "Ngoại tuyến", variant: "destructive" as const, dotColor: "bg-slate-500", ping: false }
    : telemetry.estop_pressed
    ? { label: "E-Stop kích hoạt", variant: "destructive" as const, dotColor: "bg-rose-500", ping: true }
    : !isRunning
    ? { label: "Tạm dừng", variant: "warning" as const, dotColor: "bg-amber-500", ping: false }
    : telemetry.conveyor_running
    ? { label: "Đang vận hành", variant: "success" as const, dotColor: "bg-emerald-400", ping: true }
    : { label: "Chờ phôi", variant: "default" as const, dotColor: "bg-cyan-400", ping: false };

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="flex flex-col justify-between overflow-hidden border-slate-200/90 dark:border-white/[0.08] dark:bg-[#131722]/95 p-4 sm:p-5 shadow-md">
        <div>
          {/* Header Widget */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 shadow-xs shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Giám sát Băng tải & 3 Máng phân loại</span>
                  <span className="hidden sm:inline-block font-mono text-xs text-slate-400 dark:text-slate-500 font-normal">
                    Node: {telemetry.device_id || "sorter_01"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hệ thống tay gạt servo và cảm biến quang điện thời gian thực.
                </p>
              </div>
            </div>

            {/* Badge Trạng thái hoạt động tức thời */}
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} className="px-3 py-1 text-xs font-bold tracking-wide">
                <span className="relative flex h-2 w-2 mr-1.5">
                  {statusInfo.ping && (
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${statusInfo.dotColor}`}
                    />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${statusInfo.dotColor}`} />
                </span>
                <span>{statusInfo.label}</span>
              </Badge>
            </div>
          </div>

          {/* CỤM TRẠNG THÁI VI XỬ LÝ (ESP32 PHẦN CỨNG HOẶC MÔ PHỎNG) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                {isSimulation
                  ? "Môi trường giả lập IoT (Simulation Mode)"
                  : "Vi điều khiển ESP32-C5 (Wi-Fi 6 Dual-Band)"}
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${
                  isSimulation
                    ? "text-purple-600 dark:text-purple-300 bg-purple-500/10 border-purple-500/25"
                    : isEspConnected
                    ? "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25"
                    : "text-slate-500 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {isSimulation ? "Dữ liệu mô phỏng" : isEspConnected ? "I/O Ready" : "Ngoại tuyến"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Nhiệt độ Đồng hồ Gauge */}
              <TemperatureGaugeWidget
                compact={true}
                currentTemp={telemetry.cpu_temp}
                thresholdTemp={75.0}
                deviceName="Nhiệt độ nội vi ESP32-C5"
                isOnline={!isDeviceOffline && (isEspConnected || isSimulation)}
                isSimulation={isSimulation}
              />

              {/* 2. Wi-Fi Card: Phân biệt rõ giữa Thực tế và Mô phỏng */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.02] flex items-center justify-between transition-all hover:border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isSimulation ? "Mạng ảo" : "Wi-Fi 6"}
                    </span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {isSimulation
                        ? "Mô phỏng"
                        : !isDeviceOffline && isEspConnected
                        ? `${telemetry.wifi_rssi} dBm`
                        : "-- dBm"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                    isSimulation
                      ? "text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20"
                      : !isDeviceOffline && isEspConnected
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                      : "text-slate-500 bg-slate-500/10"
                  }`}
                >
                  {isSimulation ? "Ảo" : isEspConnected ? "5.0 GHz" : "Ngoại tuyến"}
                </span>
              </div>

              {/* 3. Trạng thái Broker MQTT */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.02] flex items-center justify-between transition-all hover:border-emerald-500/30">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                      isSimulation
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : mqttStatus === "connected"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Broker MQTT</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {isSimulation ? "Broker Mô phỏng" : mqttStatus === "connected" ? "Đã kết nối" : "Ngoại tuyến"}
                    </p>
                  </div>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSimulation
                      ? "bg-purple-500 shadow-[0_0_8px_#a855f7]"
                      : mqttStatus === "connected"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      : "bg-rose-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* DUNG LƯỢNG 3 MÁNG CHỨA Y TẾ (ĐÃ RÚT GỌN: KHÔNG SLIDER, KHÔNG PRESETS) */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Khay phân loại dụng cụ y tế</span>
                {canEditConfig && (
                  <Link
                    href="/config"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline normal-case"
                    title="Chỉnh sức chứa tối đa tại Cấu hình"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Cấu hình sức chứa</span>
                  </Link>
                )}
              </div>
              <span>Dung lượng & Trạng thái</span>
            </div>

            {/* MÁNG 1: LỌ THUỐC / ỐNG NGHIỆM */}
            <div
              className={`rounded-xl border p-3.5 transition-all duration-200 ${
                isFull1
                  ? "border-rose-500/80 bg-rose-500/10 dark:border-rose-500/60 dark:bg-rose-950/30 ring-1 ring-rose-500/40 shadow-xs"
                  : isWarn1
                  ? "border-amber-500/80 bg-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
                  : "border-slate-200/80 bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#161a26]/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-mono font-bold shrink-0">
                    K1
                  </span>
                  <span className="text-sm font-semibold truncate">
                    Máng 1: {bin1Brands.length > 0 ? bin1Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ") : "Lọ thuốc / Ống nghiệm"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-cyan-400 transition-colors shrink-0">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-mono text-xs">
                        Gạt Servo 1 (IO23) • Góc: 45° • Cảm biến quang S2
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isFull1 ? (
                    <Badge variant="destructive" className="font-mono font-bold text-xs animate-pulse">
                      🔴 ĐẦY KHAY ({binCounts.bin1}/{cap1} SP)
                    </Badge>
                  ) : isWarn1 ? (
                    <Badge variant="warning" className="font-mono font-bold text-xs">
                      🟡 SẮP ĐẦY ({binCounts.bin1}/{cap1} SP)
                    </Badge>
                  ) : (
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {binCounts.bin1}/{cap1} SP ({rate1}%)
                    </span>
                  )}
                  {canEditConfig && (
                    <Link
                      href="/config"
                      className="text-slate-400 hover:text-cyan-500 transition-colors p-1"
                      title="Sửa sức chứa trong Cấu hình"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <Progress
                value={rate1}
                className="h-2.5 bg-slate-200/80 dark:bg-white/[0.08]"
                indicatorClassName={
                  isFull1
                    ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
                    : isWarn1
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                    : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                }
              />
            </div>

            {/* MÁNG 2: BƠM KIM TIÊM / DAO MỔ */}
            <div
              className={`rounded-xl border p-3.5 transition-all duration-200 ${
                isFull2
                  ? "border-rose-500/80 bg-rose-500/10 dark:border-rose-500/60 dark:bg-rose-950/30 ring-1 ring-rose-500/40 shadow-xs"
                  : isWarn2
                  ? "border-amber-500/80 bg-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
                  : "border-slate-200/80 bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#161a26]/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 text-xs font-mono font-bold shrink-0">
                    K2
                  </span>
                  <span className="text-sm font-semibold truncate">
                    Máng 2: {bin2Brands.length > 0 ? bin2Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ") : "Bơm kim tiêm / Dao mổ"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-cyan-400 transition-colors shrink-0">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-mono text-xs">
                        Gạt Servo 2 (IO24) • Cảm biến phản xạ S3
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isFull2 ? (
                    <Badge variant="destructive" className="font-mono font-bold text-xs animate-pulse">
                      🔴 ĐẦY KHAY ({binCounts.bin2}/{cap2} SP)
                    </Badge>
                  ) : isWarn2 ? (
                    <Badge variant="warning" className="font-mono font-bold text-xs">
                      🟡 SẮP ĐẦY ({binCounts.bin2}/{cap2} SP)
                    </Badge>
                  ) : (
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {binCounts.bin2}/{cap2} SP ({rate2}%)
                    </span>
                  )}
                  {canEditConfig && (
                    <Link
                      href="/config"
                      className="text-slate-400 hover:text-cyan-500 transition-colors p-1"
                      title="Sửa sức chứa trong Cấu hình"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <Progress
                value={rate2}
                className="h-2.5 bg-slate-200/80 dark:bg-white/[0.08]"
                indicatorClassName={
                  isFull2
                    ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
                    : isWarn2
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                    : "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                }
              />
            </div>

            {/* MÁNG 3: DỤNG CỤ THỦY TINH / KHÁC */}
            <div
              className={`rounded-xl border p-3.5 transition-all duration-200 ${
                isFull3
                  ? "border-rose-500/80 bg-rose-500/10 dark:border-rose-500/60 dark:bg-rose-950/30 ring-1 ring-rose-500/40 shadow-xs"
                  : isWarn3
                  ? "border-amber-500/80 bg-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
                  : "border-slate-200/80 bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#161a26]/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold shrink-0">
                    K3
                  </span>
                  <span className="text-sm font-semibold truncate">
                    Máng 3: {bin3Brands.length > 0 ? bin3Brands.map((b: string) => CATALOG_BRANDS[b]?.name || b).join(", ") : "Lọ thuốc / Ống nghiệm (Thủy tinh)"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-cyan-400 transition-colors shrink-0">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-mono text-xs">
                        Máng cuối băng tải • Cảm biến quang S1
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isFull3 ? (
                    <Badge variant="destructive" className="font-mono font-bold text-xs animate-pulse">
                      🔴 ĐẦY KHAY ({binCounts.bin3}/{cap3} SP)
                    </Badge>
                  ) : isWarn3 ? (
                    <Badge variant="warning" className="font-mono font-bold text-xs">
                      🟡 SẮP ĐẦY ({binCounts.bin3}/{cap3} SP)
                    </Badge>
                  ) : (
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {binCounts.bin3}/{cap3} SP ({rate3}%)
                    </span>
                  )}
                  {canEditConfig && (
                    <Link
                      href="/config"
                      className="text-slate-400 hover:text-cyan-500 transition-colors p-1"
                      title="Sửa sức chứa trong Cấu hình"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <Progress
                value={rate3}
                className="h-2.5 bg-slate-200/80 dark:bg-white/[0.08]"
                indicatorClassName={
                  isFull3
                    ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
                    : isWarn3
                    ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                    : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                }
              />
            </div>
          </div>
        </div>

        {/* CỤM ĐIỀU KHIỂN VẬN HÀNH & AN TOÀN (TÁCH BIỆT RÕ RÀNG E-STOP VÀ TẠM DỪNG, PHÂN QUYỀN ADMIN/USER) */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Nút Khởi động / Tạm dừng (Chỉ Admin mới có quyền thao tác; User thấy nhãn trạng thái) */}
            {canControlConveyor ? (
              <Button
                onClick={handleToggleRun}
                disabled={telemetry.estop_pressed}
                variant={isRunning ? "outline" : "emerald"}
                size="default"
                className="gap-2 font-bold text-xs h-10 px-4"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 text-amber-500" />
                    <span>Tạm dừng băng tải</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Khởi động băng tải</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>Băng tải: {isRunning ? "Đang chạy" : "Tạm dừng"} (Chế độ giám sát)</span>
              </div>
            )}

            {/* Phân cách trực quan rõ ràng */}
            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-white/[0.08]" />

            {/* 2. Nút Dừng Khẩn Cấp E-STOP (Tách riêng biệt, trạng thái Khóa / Mở khóa rõ ràng) */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleEmergencyStop}
                variant="estop"
                size="default"
                className={`gap-2 font-bold tracking-wider text-xs h-10 px-4 transition-all shadow-md ${
                  telemetry.estop_pressed
                    ? "bg-rose-700 hover:bg-rose-800 text-white ring-4 ring-rose-500/40 animate-pulse"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                }`}
              >
                {telemetry.estop_pressed ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>E-STOP: ĐÃ KHÓA AN TOÀN</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="h-4 w-4" />
                    <span>DỪNG KHẨN E-STOP</span>
                  </>
                )}
              </Button>

              {/* Nhãn trạng thái E-Stop */}
              <span
                className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border hidden md:inline-block ${
                  telemetry.estop_pressed
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                {telemetry.estop_pressed ? "Mạch ngắt" : "Sẵn sàng"}
              </span>
            </div>
          </div>

          {/* Nút Xem Thống Kê Chi Tiết */}
          <Link href="/analytics" className="shrink-0">
            <Button
              variant="default"
              size="default"
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs h-10 px-3.5 shadow-md shadow-cyan-500/20"
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Xem thống kê</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </TooltipProvider>
  );
}
