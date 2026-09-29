"use client";

import React, { useState, useEffect } from "react";
import { Boxes, Cpu, Gauge, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { TelemetryData } from "@/lib/types";
import { formatUptime } from "@/lib/dataProcessor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const iconThemes: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    cyan: {
      bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
      text: "text-cyan-600 dark:text-cyan-400",
      glow: "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]",
      border: "border-cyan-500/30",
    },
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]",
      border: "border-emerald-500/30",
    },
    purple: {
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
      text: "text-purple-600 dark:text-purple-400",
      glow: "shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]",
      border: "border-purple-500/30",
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      glow: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]",
      border: "border-amber-500/30",
    },
    rose: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      text: "text-rose-600 dark:text-rose-400",
      glow: "shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]",
      border: "border-rose-500/30",
    },
    slate: {
      bg: "bg-slate-500/10 dark:bg-slate-500/15",
      text: "text-slate-600 dark:text-slate-400",
      glow: "shadow-none",
      border: "border-slate-500/20",
    },
  };

  const theme = iconThemes[color] || iconThemes.cyan;

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${
        highlight
          ? "border-cyan-500/40 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-transparent shadow-sm dark:shadow-cyan-500/10"
          : "border-slate-200/90 dark:border-white/[0.08] dark:bg-[#131722]/90"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${theme.bg} ${theme.text} ${theme.border} ${theme.glow}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <Badge
              variant={trend.positive ? "success" : "destructive"}
              className="text-[11px] font-medium tracking-tight"
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400/90 leading-relaxed truncate" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>
      {highlight && (
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-cyan-500 opacity-80" />
      )}
    </Card>
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
  sampleCount?: number;
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
  sampleCount = 0,
}: KpiStatGridProps) {
  const animatedTotal = useCountUp(totalSorted, 800);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Sản lượng ca */}
      {(() => {
        const totalInBins = (binCounts.bin1 || 0) + (binCounts.bin2 || 0) + (binCounts.bin3 || 0);
        const clearedCount = Math.max(0, totalSorted - totalInBins);
        const trayDetail = `K1: ${binCounts.bin1} | K2: ${binCounts.bin2} | K3: ${binCounts.bin3}${
          clearedCount > 0 ? ` (Dọn: ${clearedCount} SP)` : ""
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
            : visualItemsCount > 0 || telemetry.conveyor_running
            ? "Đang chạy"
            : "Chờ phôi"
        }
        subtitle={`Tốc độ: ${
          !isEspConnected && !isSimulation
            ? 0
            : isRunning && !telemetry.estop_pressed && (visualItemsCount > 0 || telemetry.conveyor_running)
            ? conveyorSpeed
            : 0
        }% PWM • Encoder: ${!isEspConnected && !isSimulation ? 0 : telemetry.encoder_count}`}
        trend={{
          value:
            !isEspConnected && !isSimulation
              ? "Mất tín hiệu"
              : telemetry.estop_pressed
              ? "E-Stop bật"
              : isRunning
              ? "Băng tải sẵn sàng"
              : "Chế độ chờ",
          positive: !isEspConnected && !isSimulation ? false : isRunning && !telemetry.estop_pressed,
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
            ? "ESP32-C5"
            : "Ngoại tuyến"
        }
        subtitle={`Uptime: ${
          !isDeviceOffline && (isEspConnected || isSimulation) ? formatUptime(telemetry.uptime) : "00:00:00"
        } • CPU: ${!isDeviceOffline && (isEspConnected || isSimulation) ? telemetry.cpu_temp : "--"}°C`}
        trend={{
          value: isDeviceOffline
            ? "Ngắt kết nối"
            : isSimulation
            ? "Dữ liệu mô phỏng"
            : isEspConnected
            ? `${telemetry.wifi_band || "Wi-Fi 6"}`
            : "Đang dò mạng...",
          positive: !isDeviceOffline && (isSimulation ? true : isEspConnected),
        }}
        color={isDeviceOffline || (!isEspConnected && !isSimulation) ? "rose" : isSimulation ? "purple" : "emerald"}
      />

      {/* KPI 4: Độ tin cậy AI */}
      <StatCard
        icon={Sparkles}
        title="Độ tin cậy AI"
        value={avgConfidence}
        subtitle={sampleCount > 0 ? `Đo trên ${sampleCount} mẫu phân loại` : "YOLOv8 Edge • 4 nhóm y tế"}
        trend={{
          value: !isEspConnected && !isSimulation ? "Chờ tín hiệu" : sampleCount > 0 ? `Độ tin cậy cao (${sampleCount} mẫu)` : "Độ tin cậy cao",
          positive: isEspConnected || isSimulation,
        }}
        color={!isEspConnected && !isSimulation ? "slate" : "emerald"}
      />
    </div>
  );
}
