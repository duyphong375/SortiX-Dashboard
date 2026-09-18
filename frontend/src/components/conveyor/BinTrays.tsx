"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATALOG_BRANDS } from "@/lib/types";
import { Trash2, Boxes, PackageCheck } from "lucide-react";

export interface BinTraysProps {
  binCounts: { bin1: number; bin2: number; bin3: number };
  bin1Brands: string[];
  bin2Brands: string[];
  bin3Brands: string[];
  onClearBin?: (binIndex: 1 | 2 | 3) => void;
  isBinFull?: boolean;
  onConfirmBinReplaced?: (binIndex: 1 | 2 | 3) => void;
  binCapacities?: { bin1: number; bin2: number; bin3: number };
  onSetBinCapacity?: (binIndex: 1 | 2 | 3, capacity: number) => void;
  onSetBinCount?: (binIndex: 1 | 2 | 3, count: number) => void;
}

export function BinTrays({
  binCounts,
  bin1Brands,
  bin2Brands,
  bin3Brands,
  onClearBin,
  onConfirmBinReplaced,
  binCapacities = { bin1: 50, bin2: 50, bin3: 50 },
  onSetBinCapacity,
  onSetBinCount,
}: BinTraysProps) {
  const [confirmBinClear, setConfirmBinClear] = useState<1 | 2 | 3 | null>(null);

  const cap1 = binCapacities?.bin1 || 50;
  const cap2 = binCapacities?.bin2 || 50;
  const cap3 = binCapacities?.bin3 || 50;

  return (
    <>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* MÁNG KHAY 1 (PISTON 1 - 45%) */}
        <div
          onClick={() => {
            setConfirmBinClear(1);
          }}
          role="button"
          tabIndex={0}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 group hover:scale-[1.01] ${
            binCounts.bin1 >= cap1
              ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-rose-500/30 bg-white dark:bg-[#161822] dark:border-rose-500/20 hover:border-rose-500/60 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
                {binCounts.bin1 >= cap1 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] shrink-0" />
                )}
                <span className="truncate">MÁNG TRƯỢT 1 (PISTON 1)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {binCounts.bin1 >= cap1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(1) : onClearBin?.(1);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Xác nhận đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400">
                      Piston IO23
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(1);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all border border-rose-500/40 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 shadow-xs active:scale-95"
                      title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap1} SP)`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Dọn khay</span>
                    </button>
                  </>
                )}
              </div>
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
              <div className={`text-3xl font-black font-mono shrink-0 ${
                binCounts.bin1 >= cap1
                  ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"
                  : "text-rose-600 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              }`}>
                {binCounts.bin1} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin1 / cap1) * 10);
                const isFull = binCounts.bin1 >= cap1;
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                        : isFilled
                        ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 45%</span>
              {binCounts.bin1 >= cap1 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin1}/{cap1} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {binCounts.bin1}/{cap1} SP (Định mức)
                </span>
              )}
            </div>
            <div className="mt-1 text-center text-[9px] text-slate-400 dark:text-slate-500 italic">
              💡 Click khay hoặc bấm nút để dọn dẹp bất kỳ lúc nào
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 2 (PISTON 2 - 72%) */}
        <div
          onClick={() => {
            setConfirmBinClear(2);
          }}
          role="button"
          tabIndex={0}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 group hover:scale-[1.01] ${
            binCounts.bin2 >= cap2
              ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-blue-500/30 bg-white dark:bg-[#161822] dark:border-blue-500/20 hover:border-blue-500/60 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
                {binCounts.bin2 >= cap2 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6] shrink-0" />
                )}
                <span className="truncate">MÁNG TRƯỢT 2 (PISTON 2)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {binCounts.bin2 >= cap2 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(2) : onClearBin?.(2);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Xác nhận đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                      Piston IO24
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(2);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all border border-blue-500/40 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 shadow-xs active:scale-95"
                      title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap2} SP)`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Dọn khay</span>
                    </button>
                  </>
                )}
              </div>
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
              <div className={`text-3xl font-black font-mono shrink-0 ${
                binCounts.bin2 >= cap2
                  ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"
                  : "text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              }`}>
                {binCounts.bin2} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin2 / cap2) * 10);
                const isFull = binCounts.bin2 >= cap2;
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                        : isFilled
                        ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 72%</span>
              {binCounts.bin2 >= cap2 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin2}/{cap2} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {binCounts.bin2}/{cap2} SP (Định mức)
                </span>
              )}
            </div>
            <div className="mt-1 text-center text-[9px] text-slate-400 dark:text-slate-500 italic">
              💡 Click khay hoặc bấm nút để dọn dẹp bất kỳ lúc nào
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 3 (ĐI THẲNG - 96%) */}
        <div
          onClick={() => {
            setConfirmBinClear(3);
          }}
          role="button"
          tabIndex={0}
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 group hover:scale-[1.01] ${
            binCounts.bin3 >= cap3
              ? "border-amber-500 bg-amber-500/15 animate-pulse ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-amber-500/30 bg-white dark:bg-[#161822] dark:border-amber-500/20 hover:border-amber-500/60 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 truncate">
                {binCounts.bin3 >= cap3 ? (
                  <Boxes className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] shrink-0" />
                )}
                <span className="truncate">KHAY 3 (MẶC ĐỊNH)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {binCounts.bin3 >= cap3 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(3) : onClearBin?.(3);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Xác nhận đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400">
                      Đi Thẳng
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(3);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all border border-amber-500/40 bg-amber-500/10 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 shadow-xs active:scale-95"
                      title={`Dọn khay ngay lập tức (không cần đợi đủ ${cap3} SP)`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Dọn khay</span>
                    </button>
                  </>
                )}
              </div>
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
              <div className={`text-3xl font-black font-mono shrink-0 ${
                binCounts.bin3 >= cap3
                  ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"
                  : "text-amber-600 dark:text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              }`}>
                {binCounts.bin3} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin3 / cap3) * 10);
                const isFull = binCounts.bin3 >= cap3;
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)] animate-pulse"
                        : isFilled
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]"
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Thoát tự do 1000mm • 96%</span>
              {binCounts.bin3 >= cap3 ? (
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  100% ĐẦY ({binCounts.bin3}/{cap3} SP) - CẦN THAY
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {binCounts.bin3}/{cap3} SP (Định mức)
                </span>
              )}
            </div>
            <div className="mt-1 text-center text-[9px] text-slate-400 dark:text-slate-500 italic">
              💡 Click khay hoặc bấm nút để dọn dẹp bất kỳ lúc nào
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const selectedBinCount =
          confirmBinClear === 1
            ? binCounts.bin1
            : confirmBinClear === 2
            ? binCounts.bin2
            : confirmBinClear === 3
            ? binCounts.bin3
            : 0;
        const selectedBinCap =
          confirmBinClear === 1
            ? cap1
            : confirmBinClear === 2
            ? cap2
            : confirmBinClear === 3
            ? cap3
            : 50;
        const isSelectedBinFull = selectedBinCount >= selectedBinCap;

        return (
          <ConfirmDialog
            isOpen={confirmBinClear !== null}
            onCancel={() => setConfirmBinClear(null)}
            onConfirm={() => {
              if (confirmBinClear) {
                if (isSelectedBinFull && onConfirmBinReplaced) {
                  onConfirmBinReplaced(confirmBinClear);
                } else {
                  onClearBin?.(confirmBinClear);
                }
              }
              setConfirmBinClear(null);
            }}
            title={
              confirmBinClear && isSelectedBinFull
                ? `Xác nhận đã thay Khay ${confirmBinClear} mới`
                : `Dọn dẹp Khay ${confirmBinClear}`
            }
            message={
              confirmBinClear
                ? isSelectedBinFull
                  ? `Khay ${confirmBinClear} hiện đã đầy ${selectedBinCount}/${selectedBinCap} sản phẩm (100% định mức). Bạn xác nhận đã thay thế khay rỗng mới và muốn đặt lại số lượng về 0?`
                  : `Khay ${confirmBinClear} hiện đang có ${selectedBinCount} sản phẩm (định mức tối đa: ${selectedBinCap} SP). Bạn có chắc chắn muốn dọn sạch khay và đặt lại số đếm về 0 không?`
                : ""
            }
            confirmText={
              confirmBinClear && isSelectedBinFull
                ? "Xác nhận đã thay khay mới"
                : "Xác nhận dọn khay"
            }
            cancelText="Hủy bỏ"
            type="warning"
          />
        );
      })()}
    </>
  );
}
