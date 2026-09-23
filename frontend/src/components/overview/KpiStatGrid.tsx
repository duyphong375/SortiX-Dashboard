"use client";

import React, { useState, useEffect } from "react";
import { Boxes, Cpu, Gauge, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { TelemetryData } from "@/lib/types";
import { formatUptime } from "@/lib/dataProcessor";

// Custom Hook count-up animation
export function useCountUp(target: number, duration = 800) {
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

export function StatCard({
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
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
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

interface KpiStatGridProps {
  totalSorted: number;
  binCounts: { bin1: number; bin2: number; bin3: number };
  telemetry: TelemetryData;
  isEspConnected: boolean;
  isSimulation: boolean;
  isRunning: boolean;
  conveyorSpeed: number;
  visualItemsCount: number;
  avgConfidence: string;
  pingMs: number;
  isDeviceOffline?: boolean;
}

export function KpiStatGrid({
  totalSorted,
  binCounts,
  telemetry,
  isEspConnected,
  isSimulation,
  isRunning,
  conveyorSpeed,
  visualItemsCount,
  avgConfidence,
  isDeviceOffline = false,
}: KpiStatGridProps) {
  const animatedTotal = useCountUp(totalSorted, 800);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Sản lượng ca */}
      {(() => {
        const totalInBins = (binCounts.bin1 || 0) + (binCounts.bin2 || 0) + (binCounts.bin3 || 0);
        const clearedCount = Math.max(0, totalSorted - totalInBins);
        const trayDetail = `Hiện trong khay: K1: ${binCounts.bin1} | K2: ${binCounts.bin2} | K3: ${binCounts.bin3}${
          clearedCount > 0 ? ` (Đã dọn: ${clearedCount} SP)` : ""
        }`;
        return (
          <StatCard
            icon={Boxes}
            title="Sản lượng ca"
            value={`${animatedTotal.toLocaleString()} SP`}
            subtitle={trayDetail}
            trend={{ value: `+${totalSorted} hôm nay`, positive: true }}
            color="cyan"
            highlight
          />
        );
      })()}

      {/* KPI 2: Vận hành */}
      <StatCard
        icon={Gauge}
        title="Vận hành"
        value={
          !isEspConnected && !isSimulation
            ? "Mất kết nối"
            : telemetry.estop_pressed
            ? "Dừng khẩn"
            : !isRunning
            ? "Tạm dừng"
            : visualItemsCount > 0
            ? "Đang chạy"
            : "Chờ phôi"
        }
        subtitle={`Tốc độ: ${
          !isEspConnected && !isSimulation
            ? 0
            : isRunning && !telemetry.estop_pressed
            ? conveyorSpeed
            : 0
        }% PWM • Encoder: ${!isEspConnected && !isSimulation ? 0 : telemetry.encoder_count}`}
        trend={{
          value:
            !isEspConnected && !isSimulation
              ? "Không có tín hiệu"
              : telemetry.estop_pressed
              ? "E-Stop bật"
              : isRunning
              ? "Băng tải sẵn sàng"
              : "Chế độ chờ",
          positive: (!isEspConnected && !isSimulation) ? false : isRunning && !telemetry.estop_pressed,
        }}
        color={
          !isEspConnected && !isSimulation
            ? "rose"
            : telemetry.estop_pressed
            ? "rose"
            : !isRunning
            ? "amber"
            : "emerald"
        }
      />

      {/* KPI 3: Thiết bị IoT */}
      <StatCard
        icon={Cpu}
        title="Thiết bị IoT"
        value={
          isDeviceOffline
            ? "Ngoại tuyến"
            : isSimulation
            ? "Mô phỏng"
            : isEspConnected
            ? "Đã kết nối"
            : "Ngoại tuyến"
        }
        subtitle={`Uptime: ${
          !isDeviceOffline && (isEspConnected || isSimulation) ? formatUptime(telemetry.uptime) : "00:00:00"
        } • CPU: ${!isDeviceOffline && (isEspConnected || isSimulation) ? telemetry.cpu_temp : "--"}°C`}
        trend={{
          value: isDeviceOffline
            ? "Thiết bị ngắt kết nối"
            : isSimulation
            ? `${telemetry.wifi_band}`
            : isEspConnected
            ? `${telemetry.wifi_band}`
            : "Đang chờ kết nối...",
          positive: !isDeviceOffline && (isSimulation ? true : isEspConnected),
        }}
        color={isDeviceOffline || (!isEspConnected && !isSimulation) ? "slate" : isSimulation ? "purple" : "emerald"}
      />

      {/* KPI 4: Độ tin cậy AI */}
      <StatCard
        icon={Sparkles}
        title="Độ tin cậy AI"
        value={avgConfidence}
        subtitle="YOLOv8 Edge • 4 nhãn hoạt động"
        trend={{
          value: !isEspConnected && !isSimulation ? "Chưa có tín hiệu" : "Đạt tiêu chuẩn",
          positive: isEspConnected || isSimulation,
        }}
        color={!isEspConnected && !isSimulation ? "slate" : "amber"}
      />
    </div>
  );
}
