"use client";

import React, { useState } from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { usePermission } from "@/contexts/AuthContext";
import { AlertEvent, AlertSeverity } from "@/lib/types";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
  Filter,
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    icon: React.FC<{ className?: string }>;
    color: string;
    bg: string;
    label: string;
  }
> = {
  critical: {
    icon: Zap,
    color: "text-rose-600 dark:text-rose-400",
    bg: "border-rose-200/80 bg-rose-50/70 dark:border-rose-500/20 dark:bg-[#161822]",
    label: "Nghiêm trọng",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "border-amber-200/80 bg-amber-50/70 dark:border-amber-500/20 dark:bg-[#161822]",
    label: "Cảnh báo",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bg: "border-blue-200/80 bg-blue-50/70 dark:border-blue-500/20 dark:bg-[#161822]",
    label: "Thông tin",
  },
};

export default function AlertsPage() {
  const { alerts, handleClearAlerts } = useDashboard();
  const canDelete = usePermission("alerts.delete");
  const canConfigure = usePermission("alerts.configure");

  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const filteredAlerts = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const severityCounts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="space-y-4 page-transition-enter">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Cảnh Báo & Sự Cố</h2>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {alerts.length} sự kiện • {severityCounts.critical} sự cố nghiêm trọng
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-white/[0.06] dark:bg-[#111319]">
            {(["all", "critical", "warning", "info"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filter === sev
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 dark:border-white/20 dark:bg-[#1E212D] dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {sev === "all"
                  ? `Tất Cả (${alerts.length})`
                  : sev === "critical"
                  ? `Nghiêm Trọng (${severityCounts.critical})`
                  : sev === "warning"
                  ? `Cảnh Báo (${severityCounts.warning})`
                  : `Thông Tin (${severityCounts.info})`}
              </button>
            ))}
          </div>
          {canDelete && (
            <button
              onClick={handleClearAlerts}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {!canDelete && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Bạn chỉ có quyền xem cảnh báo — Xóa và cấu hình cần quyền Admin</span>
        </div>
      )}

      {/* Alert List */}
      <div className="space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="relate-card flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 py-16 dark:border-white/[0.07] dark:bg-[#161822]">
            <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
            <p className="font-bold text-slate-800 dark:text-white">Không có cảnh báo nào</p>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Hệ thống đang hoạt động an toàn & ổn định</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const IconComp = cfg.icon;
            return (
              <div
                key={alert.event_id}
                className={`relate-card flex items-start gap-4 rounded-2xl border p-4 transition-all shadow-xs ${cfg.bg}`}
              >
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:bg-white/[0.08] dark:text-slate-300 dark:border dark:border-white/[0.05]">
                      {alert.event_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {alert.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.timestamp).toLocaleString("vi-VN")}
                    </span>
                    <span>Thiết bị: <strong className="font-mono text-slate-700 dark:text-slate-300">{alert.device_id}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
