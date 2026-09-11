"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { CATALOG_BRANDS } from "@/lib/types";
import { formatUptime, determineTargetBin } from "@/lib/dataProcessor";
import {
  Boxes,
  Cpu,
  Package,
  Activity,
  Gauge,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Radio,
  Thermometer,
  Wifi,
  BarChart2,
  Zap,
} from "lucide-react";

// Count-up animation hook
function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Stat Card component
function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color,
  highlight,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: { value: string; positive: boolean };
  color: string;
  highlight?: boolean;
}) {
  const iconBg: Record<string, string> = {
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  };

  return (
    <div
      className={`relate-card group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        highlight
          ? "border-cyan-500/30 bg-gradient-to-br from-cyan-50/60 to-white shadow-sm dark:border-cyan-500/30 dark:from-[#181A24] dark:to-[#161822]"
          : "border-slate-200/90 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#161822]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[color] || iconBg.cyan}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
            }`}
          >
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{value}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-xs font-normal text-slate-600 dark:text-slate-400 leading-relaxed truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// Calendar widget
function CalendarWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; isToday: boolean; hasEvent?: string }[] = [];

  // Fill previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false, isToday: false });
  }

  // Fill current month
  const eventDays: Record<number, string> = { 4: "appointment", 6: "maintenance", 13: "incident", 25: "maintenance", 30: "incident" };
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, isToday: d === today, hasEvent: eventDays[d] });
  }

  // Fill remaining
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, isToday: false });
  }

  return (
    <div className="relate-card flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Lịch Vận Hành & Ca Trực</h3>
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Ca sản xuất hiện hành</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1E212D] dark:hover:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {monthNames[month]} {year}
            </span>
            <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1E212D] dark:hover:text-slate-200">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
            <div key={d} className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => (
            <div
              key={i}
              className={`relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                cell.isToday
                  ? "bg-indigo-600 font-bold text-white shadow-sm dark:bg-indigo-500 dark:text-white"
                  : cell.current
                  ? "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#1E212D]"
                  : "text-slate-300 dark:text-slate-700"
              }`}
            >
              {cell.day}
              {cell.hasEvent && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    cell.hasEvent === "incident"
                      ? "bg-rose-500"
                      : cell.hasEvent === "maintenance"
                      ? "bg-indigo-400"
                      : "bg-emerald-400"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Stacked Avatars & Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            <div
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#161822]"
              title="Kỹ thuật viên 1: Lê Văn A"
            >
              LA
            </div>
            <div
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#161822]"
              title="Kỹ thuật viên 2: Trần B"
            >
              TB
            </div>
            <div
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#161822]"
              title="Trưởng ca: Nguyễn C"
            >
              NC
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">3 KTV trực</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Ca trực</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Bảo trì</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Sự cố</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    telemetry,
    mqttStatus,
    records,
    binCounts,
    brandCounts,
    visualItems,
    isRunning,
    conveyorSpeed,
    sorterConfig,
    handleToggleRun,
    handleEmergencyStop,
  } = useDashboard();

  const totalSorted = binCounts.bin1 + binCounts.bin2 + binCounts.bin3;
  const animatedTotal = useCountUp(totalSorted, 800);

  // Lấy danh sách 5 bản ghi mới nhất cho trang tổng quan
  const recentRecords = records.slice(0, 5);

  // Nhãn phân loại theo từng máng
  const bin1Brands = sorterConfig?.bins?.[0]?.brand_ids || [];
  const bin2Brands = sorterConfig?.bins?.[1]?.brand_ids || [];
  const bin3Brands = Object.keys(CATALOG_BRANDS).filter(
    (bId) => !bin1Brands.includes(bId) && !bin2Brands.includes(bId)
  );

  return (
    <div className="space-y-6 page-transition-enter pb-6">
      {/* HÀNG 1: 4 THẺ KPI TINH GỌN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Sản Lượng Ca Hiện Tại */}
        <StatCard
          icon={Boxes}
          title="Sản Lượng Ca Hiện Tại"
          value={`${animatedTotal.toLocaleString()} SP`}
          subtitle={`Khay 1: ${binCounts.bin1} | Khay 2: ${binCounts.bin2} | Khay 3: ${binCounts.bin3}`}
          trend={{ value: `+${records.length} trong ca`, positive: true }}
          color="cyan"
          highlight
        />

        {/* KPI 2: Trạng Thái Vận Hành */}
        <StatCard
          icon={Gauge}
          title="Trạng Thái Vận Hành"
          value={
            telemetry.estop_pressed
              ? "DỪNG KHẨN"
              : !isRunning
              ? "TẠM DỪNG"
              : visualItems.length > 0
              ? "ĐANG CHẠY"
              : "CHỜ PHÔI"
          }
          subtitle={`Tốc độ: ${isRunning && !telemetry.estop_pressed ? conveyorSpeed : 0}% PWM • Encoder: ${telemetry.encoder_count}`}
          trend={{
            value: telemetry.estop_pressed ? "E-Stop Bật" : isRunning ? "Băng Tải Sẵn Sàng" : "Chế Độ Chờ",
            positive: isRunning && !telemetry.estop_pressed,
          }}
          color={telemetry.estop_pressed ? "rose" : !isRunning ? "amber" : "emerald"}
        />

        {/* KPI 3: Trạng Thái IoT ESP32-C5 */}
        <StatCard
          icon={Cpu}
          title="Trạng Thái IoT ESP32-C5"
          value={telemetry.online ? "Trực Tuyến" : "Ngoại Tuyến"}
          subtitle={`Uptime: ${formatUptime(telemetry.uptime)} • CPU: ${telemetry.cpu_temp}°C`}
          trend={{ value: `${telemetry.wifi_band}`, positive: telemetry.online }}
          color="purple"
        />

        {/* KPI 4: Hiệu Suất Nhận Diện AI */}
        <StatCard
          icon={Sparkles}
          title="Hiệu Suất Nhận Diện AI"
          value="99.4%"
          subtitle="YOLOv8 Edge • Độ trễ ~24ms • 4 Nhãn Active"
          trend={{ value: "Tin cậy cao", positive: true }}
          color="amber"
        />
      </div>

      {/* HÀNG 2: GIÁM SÁT NHANH & LỊCH VẬN HÀNH */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Cột 1 (2/3 chiều rộng): Widget Tình Trạng Vận Hành & Khay Chứa Tức Thời (Live Sorter Health) */}
        <div className="xl:col-span-2 relate-card flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
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
                  <span>{telemetry.estop_pressed ? "E-Stop Kích Hoạt" : isRunning ? "Đang Vận Hành" : "Tạm Dừng"}</span>
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
                        {telemetry.cpu_temp}°C
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Bình thường
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
                        {telemetry.wifi_rssi} dBm
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono">
                    5.0 GHz
                  </span>
                </div>

                {/* 3. Trạng thái Broker MQTT */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                      mqttStatus === "connected"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}>
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Broker MQTT</span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {mqttStatus === "connected" ? "Đã Kết Nối" : "Ngoại Tuyến"}
                      </p>
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${mqttStatus === "connected" ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-rose-500"}`} />
                </div>
              </div>
            </div>

            {/* THANH TIẾN ĐỘ DUNG LƯỢNG 3 KHAY CHỨA TỨC THỜI */}
            <div className="mt-5 space-y-3.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>Dung Lượng 3 Khay Chứa (Định mức 50 SP / Khay)</span>
                <span>Tỉ lệ đầy khay</span>
              </div>

              {/* Khay 1 (Coca / Gạt 1) */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 dark:border-rose-500/20 dark:bg-rose-950/15">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                    <span>Khay 1 (Coca / Gạt 1)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {binCounts.bin1}/50 SP ({Math.min(100, Math.round((binCounts.bin1 / 50) * 100))}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-500 shadow-[0_0_8px_#f43f5e]"
                    style={{ width: `${Math.min(100, (binCounts.bin1 / 50) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Khay 2 (Pepsi / Gạt 2) */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 dark:border-blue-500/20 dark:bg-blue-950/15">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span>Khay 2 (Pepsi / Gạt 2)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {binCounts.bin2}/50 SP ({Math.min(100, Math.round((binCounts.bin2 / 50) * 100))}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_#3b82f6]"
                    style={{ width: `${Math.min(100, (binCounts.bin2 / 50) * 100)}%` }}
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
                    {binCounts.bin3}/50 SP ({Math.min(100, Math.round((binCounts.bin3 / 50) * 100))}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500 shadow-[0_0_8px_#f59e0b]"
                    style={{ width: `${Math.min(100, (binCounts.bin3 / 50) * 100)}%` }}
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

            {/* Nút liên kết nhanh dẫn sang /analytics */}
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

        {/* Cột 2 (1/3 chiều rộng): Lịch Ca Trực & Phân Công KTV */}
        <CalendarWidget />
      </div>

      {/* HÀNG 3: NHẬT KÝ HOẠT ĐỘNG MỚI NHẤT (5 BẢN GHI TÓM TẮT) */}
      <div className="relate-card rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] px-5 py-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Nhật Ký Phân Loại Mới Nhất
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                5 SP Gần Nhất
              </span>
            </h3>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Sản phẩm vừa được hệ thống camera AI nhận diện và trạm servo gạt thành công
            </p>
          </div>

          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
          >
            <span>Xem toàn bộ lịch sử ({records.length} SP)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Bảng 5 sản phẩm tóm tắt */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111319] text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3 text-left">STT</th>
                <th className="px-5 py-3 text-left">Sản Phẩm & Mã Định Danh</th>
                <th className="px-5 py-3 text-left">Khay Đích</th>
                <th className="px-5 py-3 text-left">Trạng Thái</th>
                <th className="px-5 py-3 text-left">Độ Tin Cậy</th>
                <th className="px-5 py-3 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Package className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
                    Chưa có sản phẩm nào được phân loại trong ca làm việc này.
                  </td>
                </tr>
              ) : (
                recentRecords.map((rec, idx) => {
                  const brand = CATALOG_BRANDS[rec.brand_id];
                  const recIndex = records.indexOf(rec);
                  const displayId =
                    recIndex !== -1
                      ? `#${records.length - recIndex}`
                      : rec.product_id?.startsWith("#")
                      ? rec.product_id
                      : `#${rec.product_id}`;

                  return (
                    <tr
                      key={rec.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1E212D]/60"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white shadow-xs shrink-0"
                            style={{ background: brand?.color || "#64748b" }}
                          >
                            {brand?.code?.slice(0, 2) || "??"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{rec.brand_name}</p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold font-mono text-[10px]">
                              {displayId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.05]">
                          Khay {rec.actual_bin}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {rec.status === "success" ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Chuyển hướng (K3)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {(rec.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-slate-500">
                        {new Date(rec.timestamp).toLocaleTimeString("vi-VN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


