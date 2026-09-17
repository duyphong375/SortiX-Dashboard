"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATALOG_BRANDS } from "@/lib/types";

const MAX_BIN_CAPACITY = 50;

export interface BinTraysProps {
  binCounts: { bin1: number; bin2: number; bin3: number };
  bin1Brands: string[];
  bin2Brands: string[];
  bin3Brands: string[];
  onClearBin?: (binIndex: 1 | 2 | 3) => void;
}

export function BinTrays({
  binCounts,
  bin1Brands,
  bin2Brands,
  bin3Brands,
  onClearBin,
}: BinTraysProps) {
  const [confirmBinClear, setConfirmBinClear] = useState<1 | 2 | 3 | null>(null);

  return (
    <>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* MÁNG KHAY 1 (GẠT 1 - 45%) */}
        <div
          onClick={() => {
            if (binCounts.bin1 >= MAX_BIN_CAPACITY) {
              setConfirmBinClear(1);
            }
          }}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-colors flex flex-col justify-between gap-3 ${
            binCounts.bin1 >= MAX_BIN_CAPACITY
              ? "border-rose-500 bg-rose-500/10 cursor-pointer animate-pulse ring-2 ring-rose-500/50"
              : "border-rose-500/30 bg-white dark:bg-[#161822] dark:border-rose-500/20 hover:border-rose-500/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] shrink-0" />
                <span className="truncate">MÁNG TRƯỢT 1 (GẠT 1)</span>
              </span>
              <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 shrink-0">
                Servo IO23
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {bin1Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tổng SP trong máng:
              </span>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0">
                {binCounts.bin1} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin1 / MAX_BIN_CAPACITY) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFilled
                        ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 45%</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {binCounts.bin1}/{MAX_BIN_CAPACITY} SP (Định mức)
              </span>
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 2 (GẠT 2 - 72%) */}
        <div
          onClick={() => {
            if (binCounts.bin2 >= MAX_BIN_CAPACITY) {
              setConfirmBinClear(2);
            }
          }}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-colors flex flex-col justify-between gap-3 ${
            binCounts.bin2 >= MAX_BIN_CAPACITY
              ? "border-blue-500 bg-blue-500/10 cursor-pointer animate-pulse ring-2 ring-blue-500/50"
              : "border-blue-500/30 bg-white dark:bg-[#161822] dark:border-blue-500/20 hover:border-blue-500/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6] shrink-0" />
                <span className="truncate">MÁNG TRƯỢT 2 (GẠT 2)</span>
              </span>
              <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 shrink-0">
                Servo IO24
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn gạt chính:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {bin2Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tổng SP trong máng:
              </span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0">
                {binCounts.bin2} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin2 / MAX_BIN_CAPACITY) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFilled
                        ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 72%</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {binCounts.bin2}/{MAX_BIN_CAPACITY} SP (Định mức)
              </span>
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 3 (ĐI THẲNG - 96%) */}
        <div
          onClick={() => {
            if (binCounts.bin3 >= MAX_BIN_CAPACITY) {
              setConfirmBinClear(3);
            }
          }}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-colors flex flex-col justify-between gap-3 ${
            binCounts.bin3 >= MAX_BIN_CAPACITY
              ? "border-amber-500 bg-amber-500/10 cursor-pointer animate-pulse ring-2 ring-amber-500/50"
              : "border-amber-500/30 bg-white dark:bg-[#161822] dark:border-amber-500/20 hover:border-amber-500/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] shrink-0" />
                <span className="truncate">KHAY 3 (MẶC ĐỊNH)</span>
              </span>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 shrink-0">
                Đi Thẳng
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Nhãn tiếp nhận:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {bin3Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Các nhãn còn lại"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tổng SP trong máng:
              </span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0">
                {binCounts.bin3} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin3 / MAX_BIN_CAPACITY) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFilled
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Thoát tự do 1000mm • 96%</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {binCounts.bin3}/{MAX_BIN_CAPACITY} SP (Định mức)
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmBinClear !== null}
        onCancel={() => setConfirmBinClear(null)}
        onConfirm={() => {
          if (confirmBinClear) {
            onClearBin?.(confirmBinClear);
          }
          setConfirmBinClear(null);
        }}
        title="Dọn dẹp khay chứa"
        message={`Khay ${confirmBinClear} đã đầy định mức. Bạn có chắc chắn muốn dọn dẹp và reset số đếm của khay này về 0 không?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </>
  );
}
