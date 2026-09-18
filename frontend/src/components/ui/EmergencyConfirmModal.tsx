"use client";

import React, { useEffect } from "react";
import { OctagonAlert, AlertTriangle, X, Volume2, ShieldAlert } from "lucide-react";

interface EmergencyConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const EmergencyConfirmModal: React.FC<EmergencyConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Xác nhận dừng khẩn cấp (E-Stop)",
  message = "Bạn đang thực hiện thao tác ngắt dừng khẩn cấp toàn bộ hệ thống băng chuyền và cơ cấu phân loại.",
}) => {
  // Lắng nghe phím ESC để hủy và phím Enter để xác nhận
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="estop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border-2 border-rose-500/90 bg-[#160b10] p-6 text-white shadow-2xl transition-all duration-300 animate-in zoom-in-95"
        style={{
          boxShadow: "0 0 50px rgba(225, 29, 72, 0.45), 0 20px 40px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Nút đóng góc phải */}
        <button
          onClick={onCancel}
          type="button"
          aria-label="Hủy bỏ và tắt còi"
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header với Icon nhấp nháy đỏ và Còi báo động */}
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/50">
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500" />
            </span>
            <OctagonAlert className="h-8 w-8 animate-pulse text-white" />
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300 border border-rose-500/40">
                <ShieldAlert className="h-3 w-3 text-rose-400" /> CRITICAL ACTION
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-300 border border-yellow-500/40 animate-pulse">
                <Volume2 className="h-3 w-3 text-yellow-400" /> CÒI BÁO ĐỘNG ĐANG KÊU
              </span>
            </div>

            <h2 id="estop-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white uppercase leading-snug">
              {title}
            </h2>
          </div>
        </div>

        {/* Nội dung cảnh báo */}
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-100 leading-relaxed">
              <strong className="text-yellow-300 font-bold block mb-0.5">
                Còi báo động đang phát liên tục trên Web!
              </strong>
              <span>
                Khi bạn bấm nút <strong>&quot;Đồng ý xác nhận&quot;</strong>, còi báo động sẽ lập tức tắt và hệ thống sẽ <strong>BẬT CHẾ ĐỘ E-STOP</strong> (ngắt toàn bộ nguồn động cơ và khóa cứng băng tải).
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {message}
          </p>

          <div className="rounded-xl border border-white/[0.08] bg-[#0e070a] p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Trạng thái còi hiện tại:</span>
              <span className="font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                Đang kêu liên tục
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hành động sau xác nhận:</span>
              <span className="font-bold text-emerald-400">Tắt còi & Bật E-Stop</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
          >
            Hủy (Tắt còi)
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/40 hover:shadow-rose-600/60 active:scale-95 transition-all animate-pulse"
          >
            <OctagonAlert className="h-4 w-4" />
            <span>Xác nhận dừng khẩn E-Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
