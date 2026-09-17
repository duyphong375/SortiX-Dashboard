"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, BarChart2, History, ArrowRight } from "lucide-react";
import { ClassificationRecord, CATALOG_BRANDS } from "@/lib/types";

const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

function getDateKeyInBusinessTimeZone(timestamp: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export interface CalendarWidgetProps {
  records: ClassificationRecord[];
  bin1Brands: string[];
  bin2Brands: string[];
}

export const CalendarWidget = React.memo(function CalendarWidget({
  records,
  bin1Brands,
  bin2Brands,
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const todayKey = useMemo(() => {
    return getDateKeyInBusinessTimeZone(new Date());
  }, []);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

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
      const dKey = getDateKeyInBusinessTimeZone(r.timestamp);
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

      {/* LƯỚI LỊCH THÁNG */}
      <div className="mt-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div className="text-rose-500">CN</div>
        </div>

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

      {/* BẢNG THỐNG KÊ NGÀY */}
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
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-1.5 dark:bg-rose-950/20">
                <div className="text-slate-500 dark:text-slate-400 font-medium">
                  Khay 1 ({bin1Brands.length > 0 ? bin1Brands.map((b) => CATALOG_BRANDS[b]?.name || b).join(", ") : "Trống"})
                </div>
                <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5">
                  {selectedStats.bin1} SP
                </div>
                <div className="text-[9px] text-slate-400">
                  {Math.round((selectedStats.bin1 / selectedStats.total) * 100)}%
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-1.5 dark:bg-blue-950/20">
                <div className="text-slate-500 dark:text-slate-400 font-medium">
                  Khay 2 ({bin2Brands.length > 0 ? bin2Brands.map((b) => CATALOG_BRANDS[b]?.name || b).join(", ") : "Trống"})
                </div>
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
