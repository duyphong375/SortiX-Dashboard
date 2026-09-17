"use client";

import React from "react";
import Link from "next/link";
import { Package, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { ClassificationRecord, CATALOG_BRANDS } from "@/lib/types";

export interface RecentActivityListProps {
  records: ClassificationRecord[];
}

export function RecentActivityList({ records }: RecentActivityListProps) {
  const recentRecords = records.slice(0, 5);

  return (
    <div className="relate-card rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#161822]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Nhật Ký Phân Loại Mới Nhất
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              5 SP Gần Nhất
            </span>
          </h3>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Sản phẩm vừa được hệ thống camera AI nhận diện và trạm servo gạt thành công
          </p>
        </div>

        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
        >
          <span>Xem toàn bộ lịch sử ({records.length} SP)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Bảng 5 sản phẩm tóm tắt */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111319] text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <th className="px-5 py-3 text-left">STT</th>
              <th className="px-5 py-3 text-left">Sản Phẩm & Mã Định Danh</th>
              <th className="px-5 py-3 text-left">Khay Đích</th>
              <th className="px-5 py-3 text-left">Trạng Thái</th>
              <th className="px-5 py-3 text-left">Độ Tin Cậy</th>
              <th className="px-5 py-3 text-right">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {recentRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  <Package className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
                  Chưa có sản phẩm nào được phân loại trong ca làm việc này.
                </td>
              </tr>
            ) : (
              recentRecords.map((rec, idx) => {
                const brand = CATALOG_BRANDS[rec.brand_id];
                const displayId = rec.product_id?.startsWith("#")
                  ? rec.product_id
                  : `#${rec.product_id}`;

                return (
                  <tr
                    key={rec.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1E212D]/60"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white shadow-xs shrink-0"
                          style={{ background: brand?.color || "#64748b" }}
                        >
                          {brand?.code?.slice(0, 2) || "??"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{rec.brand_name}</p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold font-mono text-[10px]">
                            {displayId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.05]">
                        Khay {rec.actual_bin}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {rec.status === "success" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Chuyển hướng (K3)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {(rec.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-slate-500">
                      {new Date(rec.timestamp).toLocaleTimeString("vi-VN")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
