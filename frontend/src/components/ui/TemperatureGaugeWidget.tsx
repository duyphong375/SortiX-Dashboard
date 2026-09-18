"use client";

import React from "react";
import {
  Thermometer,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Sliders,
  Radio,
  RefreshCw,
} from "lucide-react";

export interface TemperatureGaugeWidgetProps {
  currentTemp: number; // e.g. 78.5
  thresholdTemp?: number; // e.g. 75.0
  deviceName?: string; // e.g. "Main_Drive_Motor / Edge_AI_Box"
  unit?: string; // "°C"
  isOnline?: boolean;
  className?: string;
  compact?: boolean;
  isSimulation?: boolean;
  onSimulateTempChange?: (temp: number) => void;
  onCoolDown?: () => void;
}

export const TemperatureGaugeWidget: React.FC<TemperatureGaugeWidgetProps> = ({
  currentTemp,
  thresholdTemp = 75.0,
  deviceName = "Động cơ chính / CPU Edge AI",
  unit = "°C",
  isOnline = true,
  className = "",
  compact = false,
  isSimulation = false,
  onSimulateTempChange,
  onCoolDown,
}) => {
  // Giới hạn giá trị hiển thị từ 0 đến 100
  const clampedTemp = Math.max(0, Math.min(100, currentTemp));
  const isOverheat = currentTemp > thresholdTemp;
  const isWarningZone = currentTemp >= 60 && currentTemp <= thresholdTemp;

  // Tính góc quay của kim (từ -90° tại 0°C đến +90° tại 100°C)
  const needleAngle = (clampedTemp / 100) * 180 - 90;

  // Màu sắc chủ đạo theo trạng thái
  const statusColor = isOverheat
    ? "#ef4444" // Đỏ nguy hiểm
    : isWarningZone
    ? "#f59e0b" // Vàng/Cam cận ngưỡng
    : "#10b981"; // Xanh an toàn

  const statusBg = isOverheat
    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
    : isWarningZone
    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";

  const statusText = isOverheat
    ? "QUÁ NHIỆT"
    : isWarningZone
    ? "CẬN NGƯỠNG"
    : "AN TOÀN";

  // Bán kính cung tròn SVG
  const cx = 100;
  const cy = 92;
  const r = 70;

  // Tọa độ kim đồng hồ
  const needleLength = 54;
  const rad = (needleAngle * Math.PI) / 180;
  const needleX = cx + needleLength * Math.sin(rad);
  const needleY = cy - needleLength * Math.cos(rad);

  if (compact) {
    return (
      <div className={`relative flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
        isOverheat
          ? "border-rose-500 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-950/20 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]"
          : isWarningZone
          ? "border-amber-500/50 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-950/15"
          : "border-slate-100 bg-slate-50/70 dark:border-white/[0.05] dark:bg-white/[0.02]"
      } ${className}`}>
        {/* Compact SVG Gauge mini */}
        <div className="relative w-16 h-10 shrink-0">
          <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
            {/* Vùng xanh (0-60%) */}
            <path
              d="M 15 55 A 40 40 0 0 1 50 15"
              fill="none"
              stroke="#10b981"
              strokeWidth="7"
              strokeLinecap="round"
              className="opacity-75"
            />
            {/* Vùng cam (60-75%) */}
            <path
              d="M 50 15 A 40 40 0 0 1 78 27"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="7"
              className="opacity-80"
            />
            {/* Vùng đỏ (75-100%) */}
            <path
              d="M 78 27 A 40 40 0 0 1 85 55"
              fill="none"
              stroke="#ef4444"
              strokeWidth="7"
              strokeLinecap="round"
              className="opacity-90"
            />
            {/* Kim mini */}
            <line
              x1="50"
              y1="55"
              x2={50 + 32 * Math.sin(rad)}
              y2={55 - 32 * Math.cos(rad)}
              stroke={statusColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <circle cx="50" cy="55" r="4" fill={statusColor} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Nhiệt độ Động cơ/CPU</span>
            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${statusBg}`}>
                {statusText}
              </span>
              <span
                className={`text-[8.5px] font-mono px-1 py-0.2 rounded border ${
                  isSimulation
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                }`}
              >
                {isSimulation ? "Sim" : "Real"}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`font-mono text-base font-extrabold ${
              isOverheat ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-900 dark:text-white"
            }`}>
              {isOnline ? `${currentTemp.toFixed(1)}${unit}` : `--${unit}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Ngưỡng: {thresholdTemp}{unit})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
        isOverheat
          ? "border-rose-500 bg-rose-50/80 shadow-[0_0_24px_rgba(239,68,68,0.25)] dark:border-rose-500/50 dark:bg-rose-950/20 animate-bounce-subtle"
          : isWarningZone
          ? "border-amber-500/60 bg-amber-50/40 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/15"
          : "border-slate-200/80 bg-white/95 shadow-sm dark:border-white/[0.07] dark:bg-[#161822]"
      } ${className}`}
    >
      {/* Header Widget */}
      <div className="flex w-full items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 ${
              isOverheat
                ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                : isWarningZone
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
            }`}
          >
            {isOverheat ? (
              <Flame className="h-4 w-4" />
            ) : (
              <Thermometer className="h-4 w-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Đồng Hồ Nhiệt Độ (Gauge Dial)
              {isOverheat && (
                <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-rose-500" />
              )}
            </h4>
            <p className="text-[10px] text-slate-400 truncate max-w-[170px]" title={deviceName}>
              {deviceName}
            </p>
          </div>
        </div>

        {/* Badge trạng thái */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBg}`}
        >
          {isOverheat ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <ShieldCheck className="h-3 w-3" />
          )}
          {statusText}
        </span>
      </div>

      {/* SVG Semicircular Gauge */}
      <div className="relative mt-2 w-full max-w-[210px] flex items-center justify-center">
        <svg
          viewBox="0 0 200 115"
          className="w-full h-auto overflow-visible select-none drop-shadow-xs"
        >
          <defs>
            {/* Gradient cho cung an toàn (Xanh) */}
            <linearGradient id="gaugeSafeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Gradient cho cung cảnh báo (Vàng/Cam) */}
            <linearGradient id="gaugeWarnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>

            {/* Gradient cho cung quá nhiệt (Đỏ) */}
            <linearGradient id="gaugeDangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Filter phát sáng khi quá nhiệt */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Vòng cung xám nền phía sau */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            className="text-slate-100 dark:text-white/[0.08]"
            strokeLinecap="round"
          />

          {/* 1. Phân vùng XANH: 0°C -> 60°C (Góc: 0° đến 108°) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 78.3 25.4`}
            fill="none"
            stroke="url(#gaugeSafeGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* 2. Phân vùng VÀNG/CAM: 60°C -> 75°C (Góc: 108° đến 135°) */}
          <path
            d={`M 78.3 25.4 A ${r} ${r} 0 0 1 150.5 42.5`}
            fill="none"
            stroke="url(#gaugeWarnGrad)"
            strokeWidth="11"
            className="transition-all duration-300"
          />

          {/* 3. Phân vùng ĐỎ NGUY HIỂM: 75°C -> 100°C (Góc: 135° đến 180°) */}
          <path
            d={`M 150.5 42.5 A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#gaugeDangerGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            filter={isOverheat ? "url(#gaugeGlow)" : undefined}
            className={`transition-all duration-300 ${isOverheat ? "stroke-[13] opacity-100" : "opacity-85"}`}
          />

          {/* Điểm chia ngưỡng 75°C (Threshold Pin) */}
          <circle
            cx="150.5"
            cy="42.5"
            r="3.5"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="2"
            className="shadow-sm"
          />
          <text
            x="156"
            y="35"
            fill="#ef4444"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            75°C
          </text>

          {/* Vạch min (0°C) và max (100°C) */}
          <text
            x="24"
            y="105"
            fill="#94a3b8"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            0°C
          </text>
          <text
            x="165"
            y="105"
            fill="#94a3b8"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            100°C
          </text>

          {/* Kim đồng hồ (Needle) */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={statusColor}
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            filter={isOverheat ? "url(#gaugeGlow)" : undefined}
          />

          {/* Trục tâm kim (Pivot point) */}
          <circle
            cx={cx}
            cy={cy}
            r="8"
            fill="#1e293b"
            stroke={statusColor}
            strokeWidth="3"
            className="dark:fill-slate-900 transition-colors duration-300"
          />
          <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
        </svg>

        {/* Số nhiệt độ tức thời đặt ngay dưới tâm kim */}
        <div className="absolute bottom-0 flex flex-col items-center text-center">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono text-2xl font-black tracking-tight transition-all duration-300 ${
                isOverheat
                  ? "text-rose-600 dark:text-rose-400 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                  : isWarningZone
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {isOnline ? currentTemp.toFixed(1) : "--.-"}
            </span>
            <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
              {unit}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Ngưỡng an toàn: <strong className="text-rose-500 font-mono">{thresholdTemp}{unit}</strong>
          </span>
        </div>
      </div>

      {/* Cảnh báo nhấp nháy chữ đỏ khi vượt ngưỡng */}
      {isOverheat && (
        <div className="mt-3 w-full rounded-xl border border-rose-500/40 bg-rose-500/15 p-2 text-center text-xs font-bold text-rose-700 dark:text-rose-300 animate-pulse">
          🔥 CẢNH BÁO: Động cơ vượt ngưỡng {thresholdTemp}{unit}! Cần giảm tải hoặc bật quạt tản nhiệt.
        </div>
      )}

      {/* 1. CHẾ ĐỘ MÔ PHỎNG: THANH CHỈNH NHIỆT ĐỘ ẢO KÈM CÁC MỨC NHANH */}
      {isSimulation ? (
        <div className="mt-3.5 w-full rounded-xl border border-amber-500/30 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-950/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Thanh chỉnh nhiệt độ ảo
              </span>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Mô Phỏng
              </span>
            </div>
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                isOverheat
                  ? "bg-rose-500/20 text-rose-600 border-rose-500/40 animate-pulse"
                  : isWarningZone
                  ? "bg-amber-500/20 text-amber-600 border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-600 border-emerald-500/40"
              }`}
            >
              {clampedTemp.toFixed(1)}{unit}
            </span>
          </div>

          {/* Thanh trượt Range slider */}
          <div className="mt-2.5 space-y-1.5">
            <input
              type="range"
              min="30.0"
              max="95.0"
              step="0.5"
              value={clampedTemp}
              onChange={(e) => onSimulateTempChange?.(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-amber-500"
              aria-label="Điều chỉnh nhiệt độ mô phỏng"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span>30°C (Mát)</span>
              <span className="font-bold text-amber-500">Ngưỡng: {thresholdTemp}°C</span>
              <span className="text-rose-500">95°C (Quá nhiệt)</span>
            </div>
          </div>

          {/* Các nút bấm thiết lập nhanh */}
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSimulateTempChange?.(42.5)}
              className="rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111319] py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
            >
              ❄️ 42.5°C An toàn
            </button>
            <button
              type="button"
              onClick={() => onSimulateTempChange?.(72.0)}
              className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
            >
              ⚠️ 72.0°C Cận ngưỡng
            </button>
            <button
              type="button"
              onClick={() => onSimulateTempChange?.(78.5)}
              className="rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
            >
              🔥 78.5°C Quá nhiệt
            </button>
          </div>

          {/* Nút giải nhiệt nhanh khi vượt ngưỡng */}
          {isOverheat && onCoolDown && (
            <button
              type="button"
              onClick={onCoolDown}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-1.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Hạ nhiệt độ về 42.5°C (An toàn)
            </button>
          )}
        </div>
      ) : (
        /* 2. CHẾ ĐỘ THỰC TẾ: KHÔNG CÓ THANH TRƯỢT - CHỈ ĐO ĐẠC THỰC TẾ TỪ CẢM BIẾN PHẦN CỨNG */
        <div className="mt-3.5 w-full rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 dark:border-emerald-500/15 dark:bg-emerald-950/15 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Đo thực tế từ cảm biến
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Thực Tế
            </span>
          </div>

          <div className="mt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Trạng thái cảm biến:</span>
              <span className={`font-semibold flex items-center gap-1.5 ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                {isOnline ? "Trực tuyến (Live Telemetry)" : "Mất tín hiệu cảm biến"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Nguồn dữ liệu:</span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                ESP32 DS18B20 / Telemetry
              </span>
            </div>
          </div>

          <p className="mt-2 border-t border-emerald-500/10 dark:border-emerald-500/15 pt-1.5 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            🔒 Chế độ đo thực tế: Nhiệt độ được đo đạc liên tục từ cảm biến phần cứng qua MQTT. Không thể can thiệp bằng thanh trượt ảo.
          </p>
        </div>
      )}
    </div>
  );
};
