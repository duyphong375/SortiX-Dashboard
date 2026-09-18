"use client";

import React from "react";
import { AlertTriangle, Wrench, ShieldAlert } from "lucide-react";
import { JamDetectedPayload } from "@shared/types";

interface JamIncidentBannerProps {
  isJammed: boolean;
  incident?: JamDetectedPayload | null;
  onOpenClearDialog?: () => void;
}

export const JamIncidentBanner: React.FC<JamIncidentBannerProps> = ({
  isJammed,
  incident,
  onOpenClearDialog,
}) => {
  if (!isJammed) return null;

  const section = incident?.section || "Conveyor_Belt_Zone_A";
  const sensorId = incident?.sensor_id || "OPTICAL_JAM_02";
  const duration = incident?.duration_seconds ?? 5;
  const timeStr = incident?.timestamp
    ? new Date(incident.timestamp).toLocaleTimeString("vi-VN")
    : new Date().toLocaleTimeString("vi-VN");

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full overflow-hidden border-b-2 border-amber-400/90 bg-gradient-to-r from-red-800 via-rose-700 to-amber-800 text-white shadow-2xl transition-all duration-300 animate-pulse"
      style={{
        boxShadow: "0 4px 25px rgba(244, 63, 94, 0.6)",
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
            <AlertTriangle className="h-6 w-6 text-white drop-shadow-md" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-yellow-300 border border-yellow-300/40">
                <ShieldAlert className="h-3.5 w-3.5" /> JAM DETECTED
              </span>
              <span className="text-xs font-mono opacity-90">
                {timeStr} • {incident?.mode === "simulation" ? "🧪 Chế độ Giả lập" : "🔴 Phần cứng thực tế"} • Cản liên tục {duration}s
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-sm uppercase">
              [CẢNH BÁO KẸT PHÔI] PHÁT HIỆN TẮC NGHẼN SẢN PHẨM TẠI KHU VỰC BĂNG CHUYỀN A ({sensorId})!
            </h3>
            <p className="text-xs text-rose-100 font-medium">
              Vị trí: <span className="font-bold underline">{section}</span>. Băng chuyền đã tự động dừng khẩn để bảo vệ thiết bị.
            </p>
          </div>
        </div>

        {/* Nút hành động gỡ kẹt */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenClearDialog}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 active:scale-95 transition-all shadow-md hover:shadow-lg uppercase tracking-wider cursor-pointer"
          >
            <Wrench className="h-4 w-4 text-rose-600" />
            <span>Gỡ Kẹt Phôi & Tiếp Tục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
