"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { usePermission } from "@/contexts/AuthContext";
import { HistoryTable } from "@/components/HistoryTable";
import { ShieldAlert } from "lucide-react";

function HistoryPageContent() {
  const { records, handleClearHistory } = useDashboard();
  const canDelete = usePermission("history.delete");
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date") || undefined;

  const wrappedClear = () => {
    if (!canDelete) return;
    handleClearHistory();
  };

  return (
    <div className="min-h-[calc(100vh-7.5rem)] w-full flex flex-col pb-4 animate-in fade-in duration-300">
      {!canDelete && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Bạn chỉ có quyền xem và xuất CSV — Xóa lịch sử cần quyền Admin</span>
        </div>
      )}
      <HistoryTable
        records={records}
        onClear={wrappedClear}
        initialDateFilter={dateParam}
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[300px] flex items-center justify-center text-xs font-medium text-slate-400">
          Đang tải nhật ký lịch sử phân loại...
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}
