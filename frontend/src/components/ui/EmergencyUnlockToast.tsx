"use client";

import React, { useState } from "react";
import { OctagonAlert, ShieldCheck, Lock, AlertTriangle, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyStopPayload } from "@shared/types";

interface EmergencyUnlockToastProps {
  isOpen: boolean;
  incident?: EmergencyStopPayload | null;
  onUnlock: (note?: string) => Promise<boolean>;
}

export const EmergencyUnlockToast: React.FC<EmergencyUnlockToastProps> = ({
  isOpen,
  incident,
  onUnlock,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [safetyNote, setSafetyNote] = useState("");

  if (!isOpen) return null;

  const station = incident?.station_id || "STATION_01";
  const triggeredBy = incident?.triggered_by || "Physical E-Stop Button #1";

  const handleConfirmUnlock = async () => {
    setIsUnlocking(true);
    const success = await onUnlock(safetyNote || "Đã xác nhận kiểm tra an toàn hiện trường.");
    setIsUnlocking(false);
    if (success) {
      setShowConfirmModal(false);
      setSafetyNote("");
    }
  };

  return (
    <>
      {/* Persistent Red Alert Toast in Bottom-Right */}
      <div
        role="alert"
        className="fixed bottom-6 right-6 z-50 max-w-md w-full rounded-2xl border-2 border-rose-500 bg-[#160b10]/95 p-4 text-white shadow-2xl backdrop-blur-md transition-all duration-300 animate-bounce-subtle"
        style={{
          boxShadow: "0 10px 40px rgba(225, 29, 72, 0.45), 0 0 20px rgba(225, 29, 72, 0.3)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg animate-pulse">
            <OctagonAlert className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                🚨 SỰ CỐ DỪNG KHẨN CẤP
              </span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                CRITICAL
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-200 leading-snug">
              Trạm <strong className="text-yellow-300 font-bold">{station}</strong> đã ngắt dừng khẩn cấp do <span className="underline">{triggeredBy}</span>. Toàn bộ băng tải và nút bấm vận hành đã tự động khóa.
            </p>

            <div className="mt-3">
              {isAdmin ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isUnlocking}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Tôi đã kiểm tra an toàn / Mở khóa hệ thống</span>
                </button>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-300">
                    <Lock className="h-3.5 w-3.5 text-rose-400" />
                    <span>Nút mở khóa bị vô hiệu</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Chỉ tài khoản Quản trị viên (Admin) mới có quyền xác nhận mở khóa an toàn sau sự cố.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận kiểm tra an toàn dành riêng cho Admin */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/50 bg-[#161822] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Mở Khóa An Toàn (Admin)</h3>
                <p className="text-xs text-slate-400">Kiểm tra hiện trường trước khi cấp quyền chạy lại</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Yêu cầu tuân thủ an toàn:</strong> Bạn cam kết đã kiểm tra vật lý hiện trường băng chuyền, vật kẹt (nếu có) đã được giải tỏa và tất cả nhân sự đang ở khoảng cách an toàn.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Ghi chú kiểm tra hiện trường (tùy chọn):
                </label>
                <input
                  type="text"
                  value={safetyNote}
                  onChange={(e) => setSafetyNote(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra không còn vật kẹt, nút E-Stop cơ học đã nhả..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#111319] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isUnlocking}
                className="rounded-xl border border-white/[0.08] bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                disabled={isUnlocking}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isUnlocking ? "Đang mở khóa..." : "Xác Nhận Mở Khóa Ngay"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
