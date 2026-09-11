"use client";

import React from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { usePermission } from "@/contexts/AuthContext";
import { HistoryTable } from "@/components/HistoryTable";
import { ShieldAlert } from "lucide-react";

export default function HistoryPage() {
  const { records, handleClearHistory } = useDashboard();
  const canDelete = usePermission("history.delete");

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
      <HistoryTable records={records} onClear={wrappedClear} />
    </div>
  );
}
