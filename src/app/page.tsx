"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { CATALOG_BRANDS, ClassificationRecord } from "@/lib/types";
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
  Calendar,
  History,
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

// Calendar widget - BỘ LỌC THỐNG KÊ THEO NGÀY
interface CalendarWidgetProps {
  records: ClassificationRecord[];
}

const CalendarWidget = React.memo(function CalendarWidget({
  records,
}: CalendarWidgetProps) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  // Khởi tạo ngày đang chọn: mặc định là Hôm nay
  const todayKey = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Tổng hợp thống kê theo từng ngày từ danh sách records
  const dateStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        bin1: number;
        bin2: number;
        bin3: number;
        brands: Record<string, number>;
      }
    > = {};

    for (const r of records) {
      if (!r.timestamp) continue;
      const dKey = r.timestamp.slice(0, 10);
      if (!map[dKey]) {
        map[dKey] = {
          total: 0,
          bin1: 0,
          bin2: 0,
          bin3: 0,
          brands: {},
        };
      }
      const st = map[dKey];
      st.total++;
      if (r.actual_bin === 1) st.bin1++;
      else if (r.actual_bin === 2) st.bin2++;
      else st.bin3++;

      const bId = r.brand_id || "brand_c";
      st.brands[bId] = (st.brands[bId] || 0) + 1;
    }
    return map;
  }, [records]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(todayKey);
  };

  const firstDay = new Date(year, month, 1).getDay();
  // Điều chỉnh để Thứ Hai là ngày đầu tuần (0: CN -> 6, 1: T2 -> 0)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: {
    day: number;
    month: number;
    year: number;
    current: boolean;
    isToday: boolean;
    dateKey: string;
    stats?: {
      total: number;
      bin1: number;
      bin2: number;
      bin3: number;
      brands: Record<string, number>;
    };
  }[] = [];

  // Ô của tháng trước
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dKey = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      month: prevM,
      year: prevY,
      current: false,
      isToday: false,
      dateKey: dKey,
      stats: dateStatsMap[dKey],
    });
  }

  // Ô của tháng hiện tại
  for (let d = 1; d <= daysInMonth; d++) {
    const dKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dKey === todayKey;
    cells.push({
      day: d,
      month,
      year,
      current: true,
      isToday,
      dateKey: dKey,
      stats: dateStatsMap[dKey],
    });
  }

  // Ô của tháng kế tiếp (lấp đầy đủ 35 hoặc 42 ô)
  const totalCellsSoFar = cells.length;
  const targetTotalCells = totalCellsSoFar <= 35 ? 35 : 42;
  const nextMonthDaysToAdd = targetTotalCells - totalCellsSoFar;
  for (let d = 1; d <= nextMonthDaysToAdd; d++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dKey = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      month: nextM,
      year: nextY,
      current: false,
      isToday: false,
      dateKey: dKey,
      stats: dateStatsMap[dKey],
    });
  }

  // Thống kê ngày đang được chọn
  const selectedStats = dateStatsMap[selectedDateKey] || {
    total: 0,
    bin1: 0,
    bin2: 0,
    bin3: 0,
    brands: {},
  };

  const selectedDayParts = selectedDateKey.split("-");
  const selectedDisplay =
    selectedDayParts.length === 3
      ? `${selectedDayParts[2]}/${selectedDayParts[1]}/${selectedDayParts[0]}`
      : selectedDateKey;
  const isSelectedToday = selectedDateKey === todayKey;

  return (
    <div className="relate-card relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
      {/* HEADER: Tiêu đề & Chuyển tháng */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Bộ Lọc Thống Kê Ngày
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chọn ngày để xem thống kê & lịch sử
            </p>
          </div>
        </div>

        {/* Nút điều hướng tháng & Nút Hôm nay */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
            title="Quay lại ngày hôm nay"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[76px] text-center text-xs font-bold text-slate-800 dark:text-slate-200">
            {monthNames[month]}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* LƯỚI LỊCH THÁNG (CALENDAR GRID) */}
      <div className="mt-3">
        {/* Tên thứ trong tuần */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div className="text-rose-500">CN</div>
        </div>

        {/* Ô ngày */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const isSelected = cell.dateKey === selectedDateKey;
            const hasData = cell.stats && cell.stats.total > 0;
            const tooltipText = `Ngày ${String(cell.day).padStart(2, "0")}/${String(cell.month + 1).padStart(2, "0")}: ${
              hasData ? `${cell.stats?.total} SP` : "Chưa có dữ liệu"
            }`;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDateKey(cell.dateKey)}
                title={tooltipText}
                className={`relative flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all group cursor-pointer hover:scale-105 duration-150 ${
                  isSelected
                    ? "ring-2 ring-cyan-500 bg-cyan-500/15 font-black text-cyan-700 dark:text-cyan-300 shadow-xs"
                    : cell.isToday
                    ? "border-2 border-indigo-500 font-black text-indigo-600 dark:text-indigo-400 dark:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.35)]"
                    : cell.current
                    ? "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#1E212D]"
                    : "text-slate-300 hover:text-slate-400 dark:text-slate-700 dark:hover:text-slate-500"
                }`}
              >
                {cell.day}
                {hasData && (
                  <span
                    className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"
                    title={`${cell.stats?.total} sản phẩm`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BẢNG THỐNG KÊ NGÀY [DD/MM/YYYY] */}
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-[#12141c]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <BarChart2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Thống Kê Ngày: {selectedDisplay}</span>
            {isSelectedToday && (
              <span className="rounded-md bg-indigo-600 text-white dark:bg-cyan-500 dark:text-slate-950 px-1.5 py-0.2 text-[9px] font-black uppercase">
                Hôm nay
              </span>
            )}
          </div>
          <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {selectedStats.total} SP
          </span>
        </div>

        {selectedStats.total === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Chưa có sản phẩm nào được phân loại trong ngày này.
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {/* 3 Khay */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-1.5 dark:bg-rose-950/20">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Khay 1 (Coca)</div>
                <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">
                  {selectedStats.bin1} SP
                </div>
                <div className="text-[9px] text-slate-400">
                  {Math.round((selectedStats.bin1 / selectedStats.total) * 100)}%
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-1.5 dark:bg-blue-950/20">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Khay 2 (Pepsi)</div>
                <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                  {selectedStats.bin2} SP
                </div>
                <div className="text-[9px] text-slate-400">
                  {Math.round((selectedStats.bin2 / selectedStats.total) * 100)}%
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-1.5 dark:bg-amber-950/20">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Khay 3 (Khác)</div>
                <div className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                  {selectedStats.bin3} SP
                </div>
                <div className="text-[9px] text-slate-400">
                  {Math.round((selectedStats.bin3 / selectedStats.total) * 100)}%
                </div>
              </div>
            </div>

            {/* Tỷ lệ các nhãn lon/chai phân loại trong ngày */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tỷ lệ nhãn phân loại:
              </div>
              {Object.keys(CATALOG_BRANDS).map((bId) => {
                const count = selectedStats.brands[bId] || 0;
                if (count === 0 && selectedStats.total > 0) return null;
                const brand = CATALOG_BRANDS[bId];
                const pct = Math.round((count / selectedStats.total) * 100);

                return (
                  <div key={bId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: brand.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {brand.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: brand.color,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 min-w-[28px] text-right">
                        {count} SP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nút bấm nhanh: Xem Lịch Sử Ngày Này */}
        <Link
          href={`/history?date=${selectedDateKey}`}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 active:scale-95"
          title={`Xem bảng lịch sử chi tiết của ngày ${selectedDisplay}`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Xem Lịch Sử Ngày {selectedDisplay}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
});

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
    pingMs,
    isSimulation,
  } = useDashboard();

  const totalSorted = binCounts.bin1 + binCounts.bin2 + binCounts.bin3;
  const animatedTotal = useCountUp(totalSorted, 800);

  // Tính độ tin cậy AI trung bình thực tế từ danh sách records
  const avgConfidence =
    records.length > 0
      ? (
          (records.reduce((acc, r) => acc + (r.confidence || 0.95), 0) / records.length) *
          100
        ).toFixed(1) + "%"
      : "100%";

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
          value={
            isSimulation
              ? "Trực Tuyến (Mô Phỏng)"
              : mqttStatus === "connected"
              ? "Trực Tuyến (ESP32)"
              : "Ngoại Tuyến / Mất kết nối"
          }
          subtitle={`Uptime: ${formatUptime(telemetry.uptime)} • CPU: ${telemetry.cpu_temp}°C`}
          trend={{
            value: isSimulation
              ? `${telemetry.wifi_band}`
              : mqttStatus === "connected"
              ? `${telemetry.wifi_band}`
              : "Đang chờ kết nối MQTT...",
            positive: isSimulation ? true : mqttStatus === "connected",
          }}
          color={isSimulation ? "purple" : mqttStatus === "connected" ? "emerald" : "rose"}
        />

        {/* KPI 4: Hiệu Suất Nhận Diện AI - Độ chính xác thực tế & Ping MQTT */}
        <StatCard
          icon={Sparkles}
          title="Hiệu Suất Nhận Diện AI"
          value={avgConfidence}
          subtitle={`YOLOv8 Edge • Ping MQTT ${pingMs || 24}ms • 4 Nhãn Active`}
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

        {/* Cột 2 (1/3 chiều rộng): Bộ Lọc Thống Kê Theo Ngày */}
        <CalendarWidget records={records} />
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


