"use client";

import React, { useState, useMemo } from "react";
import { ClassificationRecord, CATALOG_BRANDS } from "@/lib/types";
import { exportClassificationToCSV } from "@/lib/exportCsv";
import {
  Search,
  Download,
  Trash2,
  Filter,
  CheckCircle2,
  CornerDownRight,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface HistoryTableProps {
  records: ClassificationRecord[];
  onClear: () => void;
}

const ITEMS_PER_PAGE = 10;

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, onClear }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBin, setSelectedBin] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Lọc dữ liệu
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const idx = records.indexOf(r);
      const displayId = idx !== -1 ? `#${records.length - idx}` : r.product_id;
      const matchSearch =
        r.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.brand_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBin =
        selectedBin === "all" || r.actual_bin.toString() === selectedBin;

      return matchSearch && matchBin;
    });
  }, [records, searchTerm, selectedBin]);

  // Phân trang (10 dòng / trang)
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const handleExport = () => {
    exportClassificationToCSV(filteredRecords);
  };

  const handleConfirmClear = () => {
    onClear();
    setShowConfirmModal(false);
  };

  return (
    <div className="relate-card relative flex flex-col h-full rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822] transition-all duration-300 overflow-hidden">
      {/* Modal xác nhận xóa lịch sử */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-white p-5 shadow-xl dark:border-rose-500/20 dark:bg-[#1a1d28]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Xác Nhận Xóa Lịch Sử</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ <strong>{records.length} bản ghi</strong> lịch sử phân loại khỏi bộ nhớ cục bộ? Bộ đếm mã sản phẩm (Mã SP) sẽ được reset về 0.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmClear}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiêu đề và thao tác */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Nhật Ký Lịch Sử Phân Loại
            </h3>
            <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
              Lưu trữ {records.length} lượt nhận diện & gạt phôi gần nhất (LocalStorage)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50/80 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-all hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Xuất Excel (CSV)
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xóa Lịch Sử
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã phôi hoặc tên nhãn..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/90 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedBin}
            onChange={(e) => {
              setSelectedBin(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-cyan-500 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-200"
          >
            <option value="all">Tất cả các khay</option>
            <option value="1">Khay 1 (Gạt 1)</option>
            <option value="2">Khay 2 (Gạt 2)</option>
            <option value="3">Khay 3 (Mặc định)</option>
          </select>
        </div>
      </div>

      {/* Khung bảng có cuộn riêng biệt bên trong (inner scroll) */}
      <div className="mt-3 flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-[#111319] dark:text-slate-400 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-4 py-3">ID / STT</th>
              <th className="px-4 py-3">Thương Hiệu (AI)</th>
              <th className="px-4 py-3">Độ Tin Cậy</th>
              <th className="px-4 py-3">Khay Đích</th>
              <th className="px-4 py-3">Khay Thực Tế</th>
              <th className="px-4 py-3">Trạng Thái</th>
              <th className="px-4 py-3 text-right">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] font-medium">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">
                  Chưa có sản phẩm nào được phân loại trong ca làm việc.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item) => {
                const brand = CATALOG_BRANDS[item.brand_id] || {
                  name: item.brand_name || item.brand_id,
                  badgeBg: "bg-slate-100 dark:bg-white/[0.08]",
                  textColor: "text-slate-800 dark:text-slate-300",
                  borderColor: "border-slate-300 dark:border-white/[0.05]",
                };

                const recIndex = records.indexOf(item);
                const displayId =
                  recIndex !== -1
                    ? `#${records.length - recIndex}`
                    : item.product_id?.startsWith("#")
                    ? item.product_id
                    : `#${item.product_id}`;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1E212D]/60">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold font-mono text-xs shadow-xs">
                        {displayId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${brand.badgeBg} ${brand.textColor} ${brand.borderColor}`}
                      >
                        {item.brand_name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-[#111319]">
                          <div
                            className="h-full bg-cyan-600 dark:bg-cyan-400"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      Khay {item.target_bin}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.05]">
                        Khay {item.actual_bin}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.status === "success" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Chuẩn Xác
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <CornerDownRight className="h-3.5 w-3.5" /> Mặc Định (K3)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString("vi-VN")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang */}
      {totalPages > 1 && (
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-xs text-slate-500 dark:border-white/[0.06] dark:text-slate-400 shrink-0">
          <div>
            Trang <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> / {totalPages} (
            {filteredRecords.length} sản phẩm)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-300 dark:hover:bg-[#1E212D] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-300 dark:hover:bg-[#1E212D] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
