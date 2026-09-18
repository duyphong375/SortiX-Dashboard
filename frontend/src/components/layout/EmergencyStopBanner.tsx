"use client";

import React from "react";
import { OctagonAlert, ShieldAlert, KeyRound, AlertTriangle } from "lucide-react";
import { EmergencyStopPayload } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";

interface EmergencyStopBannerProps {
  isLocked: boolean;
  incident?: EmergencyStopPayload | null;
  onOpenUnlockDialog?: () => void;
}

export const EmergencyStopBanner: React.FC<EmergencyStopBannerProps> = ({
  isLocked,
  incident,
  onOpenUnlockDialog,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!isLocked) return null;

  const stationId = incident?.station_id || "STATION_01";
  const stationNum = stationId.replace(/[^0-9]/g, "") || "01";
  const triggeredBy = incident?.triggered_by || "Physical E-Stop Button #1";
  const timeStr = incident?.timestamp
    ? new Date(incident.timestamp).toLocaleTimeString("vi-VN")
    : new Date().toLocaleTimeString("vi-VN");

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full overflow-hidden border-b-2 border-rose-400/90 bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white shadow-2xl transition-all duration-300 animate-pulse"
      style={{
        boxShadow: "0 4px 25px rgba(225, 29, 72, 0.6)",
      }}
    >
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Nội dung cảnh báo chính */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs border border-white/40 shadow-inner">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
            </span>
            <OctagonAlert className="h-6 w-6 text-white drop-shadow-md" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-yellow-300 border border-yellow-300/40">
                <ShieldAlert className="h-3.5 w-3.5" /> Hệ thống đã khóa
              </span>
              <span className="text-xs font-mono opacity-90">
                {timeStr} • {incident?.mode === "simulation" ? "Mô phỏng" : "Thực tế"}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-sm uppercase">
              [Dừng khẩn] Nút dừng khẩn cấp đã được kích hoạt tại trạm {stationNum}. Băng tải đã ngắt toàn bộ.
            </h3>
            <p className="text-xs text-rose-100 font-medium">
              Nguồn kích hoạt: <span className="font-bold underline">{triggeredBy}</span> ({stationId}). Động cơ và cơ cấu chấp hành đã ngắt.
            </p>
          </div>
        </div>

        {/* Nút hành động mở khóa */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              onClick={onOpenUnlockDialog}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 active:scale-95 transition-all shadow-md hover:shadow-lg uppercase tracking-wider"
            >
              <KeyRound className="h-4 w-4 text-rose-600" />
              <span>Mở khóa hệ thống (Admin)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-black/40 px-3 py-2 text-xs text-rose-200 border border-white/20">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-300" />
              <span>Cần quyền quản trị viên để mở khóa</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
