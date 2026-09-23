"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATALOG_BRANDS } from "@/lib/types";
import { getBinColorTheme } from "@/lib/binTheme";
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
}: BinTraysProps) {
  const [confirmBinClear, setConfirmBinClear] = useState<1 | 2 | 3 | null>(null);

  const bin1Theme = getBinColorTheme(bin1Brands[0], "amber");
  const bin2Theme = getBinColorTheme(bin2Brands[0], "blue");
  const bin3Theme = getBinColorTheme(bin3Brands[0], "cyan");

  const cap1 = binCapacities?.bin1 || 50;
  const cap2 = binCapacities?.bin2 || 50;
  const cap3 = binCapacities?.bin3 || 50;

  const isFull1 = binCounts.bin1 >= cap1;
  const isWarn1 = !isFull1 && (binCounts.bin1 / cap1) >= 0.8;
  const rate1 = Math.min(100, Math.round((binCounts.bin1 / cap1) * 100));

  const isFull2 = binCounts.bin2 >= cap2;
  const isWarn2 = !isFull2 && (binCounts.bin2 / cap2) >= 0.8;
  const rate2 = Math.min(100, Math.round((binCounts.bin2 / cap2) * 100));

  const isFull3 = binCounts.bin3 >= cap3;
  const isWarn3 = !isFull3 && (binCounts.bin3 / cap3) >= 0.8;
  const rate3 = Math.min(100, Math.round((binCounts.bin3 / cap3) * 100));

  return (
    <>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* MÁNG KHAY 1 (PISTON 1 - 45%) */}
        <div
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
            isFull1
              ? "border-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.4)]"
              : isWarn1
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : bin1Theme.cardNormalBorder
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin1Theme.titleText}`}>
                {isFull1 ? (
                  <Boxes className="h-4 w-4 text-rose-500 animate-bounce shrink-0" />
                ) : isWarn1 ? (
                  <Boxes className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <span className={`h-2 w-2 rounded-full shrink-0 ${bin1Theme.dotClass}`} />
                )}
                <span className="truncate">Thùng vật sắc nhọn (Khay 1)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {isFull1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(1) : onClearBin?.(1);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-rose-400 bg-rose-500 hover:bg-rose-400 text-white shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin1Theme.badgeClass}`}>
                      Servo IO23
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(1);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin1Theme.clearBtnClass}`}
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
              <span className={`font-bold ${bin1Theme.brandText}`}>
                {bin1Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Số lượng hiện tại:
              </span>
              <div className={`text-3xl font-black font-mono shrink-0 ${
                isFull1
                  ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
                  : isWarn1
                  ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : bin1Theme.countNormalText
              }`}>
                {binCounts.bin1} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin1 / cap1) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull1
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse"
                        : isWarn1 && isFilled
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                        : isFilled
                        ? bin1Theme.ledActive
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 45%</span>
              {isFull1 ? (
                <span className="font-mono font-black text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  🔴 Đầy khay ({binCounts.bin1}/{cap1}) - Cần thay
                </span>
              ) : isWarn1 ? (
                <span className="font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 rounded text-[10px]">
                  🟡 Gần đầy ({binCounts.bin1}/{cap1} SP - {rate1}%)
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  🟢 {binCounts.bin1}/{cap1} SP ({rate1}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 2 (PISTON 2 - 72%) */}
        <div
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
            isFull2
              ? "border-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.4)]"
              : isWarn2
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : bin2Theme.cardNormalBorder
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin2Theme.titleText}`}>
                {isFull2 ? (
                  <Boxes className="h-4 w-4 text-rose-500 animate-bounce shrink-0" />
                ) : isWarn2 ? (
                  <Boxes className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <span className={`h-2 w-2 rounded-full shrink-0 ${bin2Theme.dotClass}`} />
                )}
                <span className="truncate">Khay hấp tiệt trùng Autoclave (Khay 2)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {isFull2 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(2) : onClearBin?.(2);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-rose-400 bg-rose-500 hover:bg-rose-400 text-white shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin2Theme.badgeClass}`}>
                      Servo IO24
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(2);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin2Theme.clearBtnClass}`}
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
              <span className={`font-bold ${bin2Theme.brandText}`}>
                {bin2Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Chưa cấu hình"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Số lượng hiện tại:
              </span>
              <div className={`text-3xl font-black font-mono shrink-0 ${
                isFull2
                  ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
                  : isWarn2
                  ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : bin2Theme.countNormalText
              }`}>
                {binCounts.bin2} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin2 / cap2) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull2
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse"
                        : isWarn2 && isFilled
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                        : isFilled
                        ? bin2Theme.ledActive
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Góc dốc 25° • Trạm 72%</span>
              {isFull2 ? (
                <span className="font-mono font-black text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  🔴 Đầy khay ({binCounts.bin2}/{cap2}) - Cần thay
                </span>
              ) : isWarn2 ? (
                <span className="font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 rounded text-[10px]">
                  🟡 Gần đầy ({binCounts.bin2}/{cap2} SP - {rate2}%)
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  🟢 {binCounts.bin2}/{cap2} SP ({rate2}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MÁNG KHAY 3 (ĐI THẲNG - 96%) */}
        <div
          className={`relate-card relative overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between gap-3 group ${
            isFull3
              ? "border-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.4)]"
              : isWarn3
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : bin3Theme.cardNormalBorder
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 truncate ${bin3Theme.titleText}`}>
                {isFull3 ? (
                  <Boxes className="h-4 w-4 text-rose-500 animate-bounce shrink-0" />
                ) : isWarn3 ? (
                  <Boxes className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <span className={`h-2 w-2 rounded-full shrink-0 ${bin3Theme.dotClass}`} />
                )}
                <span className="truncate">Khay vật tư & Ống nghiệm (Khay 3)</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {isFull3 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmBinReplaced ? onConfirmBinReplaced(3) : onClearBin?.(3);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border border-rose-400 bg-rose-500 hover:bg-rose-400 text-white shadow-md active:scale-95 animate-pulse"
                    title="Xác nhận đã thay thế khay rỗng mới và reset số đếm về 0"
                  >
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Đã thay khay mới</span>
                  </button>
                ) : (
                  <>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${bin3Theme.badgeClass}`}>
                      Trượt trọng lực
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBinClear(3);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all shadow-xs active:scale-95 ${bin3Theme.clearBtnClass}`}
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
              <span className={`font-bold ${bin3Theme.brandText}`}>
                {bin3Brands.map((bId) => CATALOG_BRANDS[bId]?.name || bId).join(", ") || "Các nhãn còn lại"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Số lượng hiện tại:
              </span>
              <div className={`text-3xl font-black font-mono shrink-0 ${
                isFull3
                  ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
                  : isWarn3
                  ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : bin3Theme.countNormalText
              }`}>
                {binCounts.bin3} <span className="text-xs font-normal text-slate-500">SP</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < Math.ceil((binCounts.bin3 / cap3) * 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                      isFull3
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse"
                        : isWarn3 && isFilled
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                        : isFilled
                        ? bin3Theme.ledActive
                        : "bg-slate-200 dark:bg-slate-800/90 border border-slate-300/40 dark:border-white/5"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-2">
              <span className="truncate">Thoát tự do 1000mm • 96%</span>
              {isFull3 ? (
                <span className="font-mono font-black text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                  🔴 Đầy khay ({binCounts.bin3}/{cap3}) - Cần thay
                </span>
              ) : isWarn3 ? (
                <span className="font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.5 rounded text-[10px]">
                  🟡 Gần đầy ({binCounts.bin3}/{cap3} SP - {rate3}%)
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  🟢 {binCounts.bin3}/{cap3} SP ({rate3}%)
                </span>
              )}
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
                ? "Đã thay khay mới"
                : "Dọn khay"
            }
            cancelText="Hủy bỏ"
            type="warning"
          />
        );
      })()}
    </>
  );
}
