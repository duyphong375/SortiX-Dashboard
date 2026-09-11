"use client";

import React, { useState } from "react";
import { usePermission } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { MOCK_USER_LIST, MockUser, UserRole } from "@/lib/permissions";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  Wrench,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";

export default function UsersPage() {
  const canView = usePermission("users.view");
  const canManage = usePermission("users.manage");
  const router = useRouter();

  React.useEffect(() => {
    if (!canView) router.replace("/");
  }, [canView, router]);

  const [users, setUsers] = useState<MockUser[]>(MOCK_USER_LIST);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.status === "active").length;

  if (!canView) return null;

  return (
    <div className="space-y-6 page-transition-enter">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Quản Lý Người Dùng</h2>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {users.length} người dùng • {adminCount} quản trị viên • {activeCount} đang hoạt động
          </p>
        </div>
        {canManage && (
          <button className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all dark:bg-cyan-500 dark:hover:bg-cyan-400">
            <UserPlus className="h-4 w-4" />
            Thêm Người Dùng
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{users.length}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Tổng người dùng</p>
            </div>
          </div>
        </div>
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{adminCount}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Quản trị viên</p>
            </div>
          </div>
        </div>
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{activeCount}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Đang hoạt động</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relate-card flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-2.5 dark:border-white/[0.07] dark:bg-[#161822]">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
        />
      </div>

      {/* User Table */}
      <div className="relate-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-[#111319] dark:text-slate-400">
              <th className="px-5 py-3 text-left">Người Dùng</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Vai Trò</th>
              <th className="px-5 py-3 text-left">Trạng Thái</th>
              <th className="px-5 py-3 text-left">Đăng Nhập Cuối</th>
              {canManage && <th className="px-5 py-3 text-right">Hành Động</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] font-medium">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1E212D]/60"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${
                        user.role === "admin"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : "bg-gradient-to-br from-emerald-500 to-teal-600"
                      }`}
                    >
                      {user.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Tạo: {user.createdAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{user.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      user.role === "admin"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                        : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {user.role === "admin" ? <Shield className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                    {user.role === "admin" ? "Admin" : "Operator"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Không hoạt động
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{user.lastLogin}</td>
                {canManage && (
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-[#1E212D] dark:text-slate-400">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-[#1E212D] dark:text-slate-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
