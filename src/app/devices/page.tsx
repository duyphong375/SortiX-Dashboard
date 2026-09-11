"use client";

import React, { useState } from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { usePermission } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { formatUptime } from "@/lib/dataProcessor";
import {
  Cpu,
  Wifi,
  Radio,
  Thermometer,
  Activity,
  Signal,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  Sliders,
} from "lucide-react";

function DiagCard({
  icon: Icon,
  label,
  value,
  status,
  color,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  status: "ok" | "warning" | "error";
  color: string;
}) {
  const statusColor = status === "ok" ? "text-emerald-600 dark:text-emerald-400" : status === "warning" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const StatusIcon = status === "ok" ? CheckCircle2 : status === "warning" ? Zap : XCircle;

  return (
    <div className="relate-card flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 transition-all dark:border-white/[0.07] dark:bg-[#161822]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
      </div>
      <StatusIcon className={`h-5 w-5 shrink-0 ${statusColor}`} />
    </div>
  );
}

export default function DevicesPage() {
  const { telemetry, mqttStatus, pingMs, handleResetActuatorStates } = useDashboard();
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const canView = usePermission("devices.view");
  const router = useRouter();

  React.useEffect(() => {
    if (!canView) router.replace("/");
  }, [canView, router]);

  const handleReset = () => {
    handleResetActuatorStates();
    setResetFeedback("Đã đưa cảm biến S1, S2, S3 & van gạt Servo 1, 2 về trạng thái nhàn rỗi (idle)!");
    setTimeout(() => setResetFeedback(null), 3500);
  };

  if (!canView) return null;

  return (
    <div className="space-y-6 page-transition-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MQTT & Thiết Bị IoT</h2>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Giám sát trạng thái kết nối và chẩn đoán phần cứng ESP32-C5</p>
        </div>

        <div className="flex items-center gap-2">
          {resetFeedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
              {resetFeedback}
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-all shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Cảm Biến & Van Gạt (Idle)</span>
          </button>
        </div>
      </div>

      {/* MQTT Status */}
      <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-5 dark:border-white/[0.07] dark:bg-[#161822]">
        <h3 className="mb-4 text-sm font-bold tracking-tight text-slate-900 dark:text-white">Kết Nối MQTT WebSocket</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DiagCard
            icon={Radio}
            label="Trạng thái MQTT"
            value={mqttStatus === "connected" ? "Đã kết nối" : mqttStatus === "error" ? "Lỗi" : "Ngắt kết nối"}
            status={mqttStatus === "connected" ? "ok" : "error"}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          />
          <DiagCard
            icon={Signal}
            label="Độ trễ (Ping)"
            value={`${pingMs}ms`}
            status={pingMs < 50 ? "ok" : pingMs < 100 ? "warning" : "error"}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          />
          <DiagCard
            icon={HardDrive}
            label="Broker URL"
            value={process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt"}
            status="ok"
            color="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
          />
        </div>
      </div>

      {/* ESP32 Telemetry */}
      <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-5 dark:border-white/[0.07] dark:bg-[#161822]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Chẩn Đoán ESP32-C5</h3>
          <span className="text-[11px] font-mono text-slate-400">Node: {telemetry.device_id}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DiagCard
            icon={Cpu}
            label="Vi xử lý"
            value={`RISC-V 240MHz • ${telemetry.cpu_temp}°C`}
            status={telemetry.cpu_temp >= 70 ? "warning" : "ok"}
            color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
          />
          <DiagCard
            icon={Wifi}
            label="Wi-Fi"
            value={`${telemetry.wifi_band} • ${telemetry.wifi_rssi} dBm`}
            status={telemetry.wifi_rssi > -65 ? "ok" : "warning"}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          />
          <DiagCard
            icon={Clock}
            label="Thời gian hoạt động"
            value={formatUptime(telemetry.uptime)}
            status="ok"
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          />
          <DiagCard
            icon={Activity}
            label="Cảm biến S1 (Camera)"
            value={telemetry.s1_entry ? "PHÁT HIỆN VẬT" : "Thông thoáng"}
            status={telemetry.s1_entry ? "warning" : "ok"}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          />
          <DiagCard
            icon={Activity}
            label="Cảm biến S2 (Khay 1)"
            value={telemetry.s2_sorter1 ? "PHÁT HIỆN VẬT" : "Thông thoáng"}
            status={telemetry.s2_sorter1 ? "warning" : "ok"}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          />
          <DiagCard
            icon={Activity}
            label="Cảm biến S3 (Khay 2)"
            value={telemetry.s3_sorter2 ? "PHÁT HIỆN VẬT" : "Thông thoáng"}
            status={telemetry.s3_sorter2 ? "warning" : "ok"}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          />
          <DiagCard
            icon={Sliders}
            label="Van Gạt 1 (IO23)"
            value={telemetry.arm1_active ? "GẠT SANG KHAY 1" : "Nhàn rỗi (Idle - 0°)"}
            status={telemetry.arm1_active ? "warning" : "ok"}
            color="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          />
          <DiagCard
            icon={Sliders}
            label="Van Gạt 2 (IO24)"
            value={telemetry.arm2_active ? "GẠT SANG KHAY 2" : "Nhàn rỗi (Idle - 0°)"}
            status={telemetry.arm2_active ? "warning" : "ok"}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          />
        </div>
      </div>

      {/* Encoder & Config */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-5 dark:border-white/[0.07] dark:bg-[#161822]">
          <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900 dark:text-white">Encoder Quay</h3>
          <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{telemetry.encoder_count.toLocaleString()}</p>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Xung đếm PCNT (IO2/IO3)</p>
        </div>
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-5 dark:border-white/[0.07] dark:bg-[#161822]">
          <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900 dark:text-white">Phiên Bản Cấu Hình</h3>
          <p className="text-3xl font-mono font-bold text-cyan-600 dark:text-cyan-400">v{telemetry.active_config_version}</p>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Đang áp dụng trên ESP32-C5</p>
        </div>
      </div>
    </div>
  );
}
