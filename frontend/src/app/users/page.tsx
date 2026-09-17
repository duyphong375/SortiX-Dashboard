"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, usePermission } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { SafeUser, UserRole, UserStatus } from "@shared/types";
import { ApiUsersClient } from "@/services/apiUsersClient";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  X,
  RefreshCw,
  Mail,
  User as SingleUserIcon,
} from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const canView = usePermission("users.view");
  const canManage = usePermission("users.manage");
  const router = useRouter();

  // State danh sách và dữ liệu
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // State bộ lọc và tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  // State Modal Thêm tài khoản
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    role: "user" as UserRole,
    status: "active" as UserStatus,
  });
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // State Modal Sửa tài khoản
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "user" as UserRole,
    status: "active" as UserStatus,
    new_password: "",
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // State Modal Xóa tài khoản
  const [deletingUser, setDeletingUser] = useState<SafeUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // 403 Countdown redirect
  const [countdown, setCountdown] = useState(3);

  // Tải danh sách người dùng từ API
  const loadUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await ApiUsersClient.getAll();
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setActionError(res.message || "Không thể tải danh sách người dùng");
      }
    } catch {
      setActionError("Lỗi kết nối khi tải danh sách người dùng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      loadUsers();
    }
  }, [canView, loadUsers]);

  // Xử lý đếm ngược khi bị 403 Forbidden
  useEffect(() => {
    if (!canView) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.replace("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [canView, router]);

  // Lọc danh sách người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q);

      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Thống kê
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const lockedCount = users.filter((u) => u.status === "locked").length;

  // Kiểm tra tài khoản hiện tại có trùng với ID người dùng không
  const isCurrentSelf = (userItem: SafeUser): boolean => {
    if (!currentAuthUser) return false;
    return Boolean(
      (currentAuthUser.id && currentAuthUser.id === userItem.id) ||
      (currentAuthUser.username &&
        currentAuthUser.username.toLowerCase() === userItem.username.toLowerCase()) ||
      (currentAuthUser.email &&
        currentAuthUser.email.toLowerCase() === userItem.email.toLowerCase())
    );
  };

  // Xử lý Thêm tài khoản mới
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    if (!addForm.full_name.trim()) {
      setAddFormError("Họ và tên không được để trống");
      return;
    }
    if (!addForm.username.trim() || addForm.username.length < 3) {
      setAddFormError("Tên đăng nhập phải có ít nhất 3 ký tự");
      return;
    }
    if (!addForm.email.trim() || !addForm.email.includes("@")) {
      setAddFormError("Địa chỉ email không hợp lệ");
      return;
    }
    if (!addForm.password || addForm.password.length < 4) {
      setAddFormError("Mật khẩu khởi tạo phải có ít nhất 4 ký tự");
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const res = await ApiUsersClient.createUser(addForm);
      if (res.success && res.data) {
        setActionSuccess(`Đã tạo thành công tài khoản: ${res.data.username}`);
        setIsAddModalOpen(false);
        setAddForm({
          full_name: "",
          username: "",
          email: "",
          password: "",
          role: "user",
          status: "active",
        });
        await loadUsers();
      } else {
        setAddFormError(res.message || "Tạo tài khoản thất bại");
      }
    } catch {
      setAddFormError("Lỗi hệ thống khi tạo tài khoản");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Mở Modal Sửa
  const openEditModal = (userItem: SafeUser) => {
    setEditingUser(userItem);
    setEditForm({
      full_name: userItem.full_name,
      email: userItem.email,
      role: userItem.role,
      status: userItem.status,
      new_password: "",
    });
    setEditFormError(null);
  };

  // Xử lý Cập nhật tài khoản
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);

    if (!editForm.full_name.trim()) {
      setEditFormError("Họ và tên không được để trống");
      return;
    }
    if (!editForm.email.trim() || !editForm.email.includes("@")) {
      setEditFormError("Địa chỉ email không hợp lệ");
      return;
    }
    if (editForm.new_password && editForm.new_password.length < 4) {
      setEditFormError("Mật khẩu mới nếu đặt phải có ít nhất 4 ký tự");
      return;
    }

    try {
      setIsSubmittingEdit(true);
      const payload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        status: editForm.status,
        ...(editForm.new_password ? { new_password: editForm.new_password } : {}),
      };

      const res = await ApiUsersClient.updateUser(editingUser.id, payload);
      if (res.success) {
        setActionSuccess(`Đã cập nhật tài khoản: ${editingUser.username}`);
        setEditingUser(null);
        await loadUsers();
      } else {
        setEditFormError(res.message || "Không thể cập nhật tài khoản");
      }
    } catch {
      setEditFormError("Lỗi kết nối khi cập nhật tài khoản");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Xử lý Khóa / Kích hoạt nhanh tài khoản
  const handleToggleStatus = async (userItem: SafeUser) => {
    if (isCurrentSelf(userItem)) {
      setActionError("Không thể tự khóa tài khoản của chính mình");
      return;
    }

    const nextStatus: UserStatus = userItem.status === "active" ? "locked" : "active";
    try {
      const res = await ApiUsersClient.updateUser(userItem.id, { status: nextStatus });
      if (res.success) {
        setActionSuccess(
          `Đã ${nextStatus === "active" ? "kích hoạt" : "khóa"} tài khoản ${userItem.username}`
        );
        await loadUsers();
      } else {
        setActionError(res.message || "Thao tác thay đổi trạng thái thất bại");
      }
    } catch {
      setActionError("Lỗi khi thay đổi trạng thái tài khoản");
    }
  };

  // Xử lý Xóa tài khoản
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    if (isCurrentSelf(deletingUser)) {
      setActionError("Ràng buộc bảo mật: Không được phép tự xóa tài khoản của chính mình");
      setDeletingUser(null);
      return;
    }

    if (deletingUser.role === "admin" && adminCount <= 1) {
      setActionError(
        "Ràng buộc bảo mật: Không được phép xóa nếu số lượng tài khoản Admin còn lại <= 1"
      );
      setDeletingUser(null);
      return;
    }

    try {
      setIsSubmittingDelete(true);
      const res = await ApiUsersClient.deleteUser(deletingUser.id);
      if (res.success) {
        setActionSuccess(`Đã xóa vĩnh viễn tài khoản: ${deletingUser.username}`);
        setDeletingUser(null);
        await loadUsers();
      } else {
        setActionError(res.message || "Xóa tài khoản thất bại");
      }
    } catch {
      setActionError("Lỗi kết nối khi xóa tài khoản");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Màn hình 403 Forbidden cho tài khoản không phải admin
  if (!canView) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          403 Forbidden - Quyền truy cập bị từ chối
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Trang <b>Quản Lý Người Dùng</b> yêu cầu vai trò <b>Quản Trị Viên (Admin)</b>. Tài khoản Người Dùng (User) chỉ có quyền xem dữ liệu giám sát và quản lý hồ sơ cá nhân.
        </p>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Tự động quay về trang chủ trong {countdown}s...
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về Trang Chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition-enter">
      {/* Toast thông báo */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="p-1 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="p-1 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header & Hành động */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Quản Lý Người Dùng
            </h2>
            <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold text-cyan-700 dark:text-cyan-400">
              Admin Only
            </span>
          </div>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Quản trị danh sách tài khoản, phân quyền vai trò và bảo vệ quyền truy cập hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-300 dark:hover:bg-[#1E212D]"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setAddFormError(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all dark:bg-cyan-500 dark:hover:bg-cyan-400"
            >
              <UserPlus className="h-4 w-4" />
              Thêm Tài Khoản Mới
            </button>
          )}
        </div>
      </div>

      {/* Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalCount}
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Tổng tài khoản</p>
            </div>
          </div>
        </div>

        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {adminCount}
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Quản trị viên (Admin)</p>
            </div>
          </div>
        </div>

        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeCount}
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lockedCount}
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Bị khóa (Locked)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relate-card rounded-2xl border border-slate-200/80 bg-white/95 p-3 dark:border-white/[0.07] dark:bg-[#161822]">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100/80 dark:bg-[#111319] px-3 py-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
              className="rounded-xl border border-slate-200/80 bg-white dark:bg-[#111319] dark:border-white/[0.07] text-slate-900 dark:text-white px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="user">Người dùng (User)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | UserStatus)}
              className="rounded-xl border border-slate-200/80 bg-white dark:bg-[#111319] dark:border-white/[0.07] text-slate-900 dark:text-white px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="relate-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-[#111319] dark:text-slate-400">
                <th className="px-5 py-3.5 text-left">Tài Khoản</th>
                <th className="px-5 py-3.5 text-left">Họ Và Tên</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Vai Trò</th>
                <th className="px-5 py-3.5 text-left">Trạng Thái</th>
                <th className="px-5 py-3.5 text-left">Ngày Tạo</th>
                {canManage && <th className="px-5 py-3.5 text-right">Thao Tác</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UsersIcon className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      Không tìm thấy tài khoản nào phù hợp
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const isSelf = isCurrentSelf(userItem);
                  const isLastAdmin = userItem.role === "admin" && adminCount <= 1;

                  return (
                    <tr
                      key={userItem.id}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1E212D]/60 ${
                        isSelf ? "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05]" : ""
                      }`}
                    >
                      {/* Tên đăng nhập */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${
                              userItem.role === "admin"
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                                : "bg-gradient-to-br from-emerald-500 to-teal-600"
                            }`}
                          >
                            {userItem.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {userItem.username}
                              </span>
                              {isSelf && (
                                <span className="rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] px-1.5 py-0.2 font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {userItem.id.substring(0, 12)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Họ tên */}
                      <td className="px-5 py-3.5 text-slate-900 dark:text-slate-200 font-semibold">
                        {userItem.full_name}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {userItem.email}
                      </td>

                      {/* Vai trò */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            userItem.role === "admin"
                              ? "border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-xs"
                              : "border-teal-500/30 bg-teal-500/15 text-teal-700 dark:text-teal-300"
                          }`}
                        >
                          {userItem.role === "admin" ? (
                            <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <SingleUserIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          )}
                          {userItem.role === "admin" ? "Quản Trị Viên" : "Người Dùng"}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-3.5">
                        {userItem.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Bị khóa
                          </span>
                        )}
                      </td>

                      {/* Ngày tạo */}
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(userItem.created_at).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Thao tác */}
                      {canManage && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Khóa / Mở khóa nhanh */}
                            <button
                              onClick={() => handleToggleStatus(userItem)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "Không thể tự khóa tài khoản"
                                  : userItem.status === "active"
                                  ? "Khóa tài khoản này"
                                  : "Mở khóa tài khoản"
                              }
                              className={`rounded-lg p-1.5 transition-colors ${
                                isSelf
                                  ? "opacity-30 cursor-not-allowed text-slate-400"
                                  : userItem.status === "active"
                                  ? "text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
                                  : "text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              {userItem.status === "active" ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Nút Sửa */}
                            <button
                              onClick={() => openEditModal(userItem)}
                              title="Chỉnh sửa tài khoản / Đổi mật khẩu"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-[#1E212D] dark:text-slate-400 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Nút Xóa (Kèm ràng buộc bảo mật) */}
                            <button
                              onClick={() => setDeletingUser(userItem)}
                              disabled={isSelf || isLastAdmin}
                              title={
                                isSelf
                                  ? "Ràng buộc: Không được tự xóa tài khoản của chính mình"
                                  : isLastAdmin
                                  ? "Ràng buộc: Không thể xóa tài khoản Quản trị viên duy nhất còn lại"
                                  : "Xóa tài khoản này"
                              }
                              className={`rounded-lg p-1.5 transition-colors ${
                                isSelf || isLastAdmin
                                  ? "opacity-30 cursor-not-allowed text-slate-400"
                                  : "text-slate-400 hover:text-rose-600 hover:bg-rose-500/10"
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: THÊM TÀI KHOẢN MỚI ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#161822]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thêm Tài Khoản Mới
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Khởi tạo tài khoản với quyền hạn tùy chỉnh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Họ và tên hiển thị *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="user123"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Mật khẩu khởi tạo *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 4 ký tự"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vai trò hệ thống
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                  >
                    <option value="user">Người dùng (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as UserStatus })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="locked">Bị khóa (Locked)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-[#1E212D]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingAdd && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỈNH SỬA TÀI KHOẢN ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#161822]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Chỉnh Sửa Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tài khoản: <b>{editingUser.username}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vai trò
                  </label>
                  <select
                    value={editForm.role}
                    disabled={isCurrentSelf(editingUser)}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-semibold disabled:opacity-50"
                  >
                    <option value="user">Người dùng (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editForm.status}
                    disabled={isCurrentSelf(editingUser)}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-[#111319] dark:border-white/[0.08] px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-semibold disabled:opacity-50"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="locked">Bị khóa (Locked)</option>
                  </select>
                </div>
              </div>

              {/* Reset Mật khẩu */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#111319] p-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <KeyRound className="h-3.5 w-3.5 text-cyan-500" />
                  <span>Reset Mật khẩu mới</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Để trống nếu bạn không có nhu cầu đổi mật khẩu cho người dùng này
                </p>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                  value={editForm.new_password}
                  onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white dark:bg-[#161822] dark:border-white/[0.08] px-3 py-1.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-[#1E212D]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingEdit && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN XÓA NGUY HIỂM ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-white p-6 shadow-2xl dark:border-rose-500/20 dark:bg-[#161822]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 border border-rose-500/30 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác Nhận Xóa Tài Khoản
                </h3>
                <p className="text-xs text-rose-500 font-semibold mt-0.5">
                  Cảnh báo: Thao tác này không thể hoàn tác!
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p>
                Bạn đang chuẩn bị xóa vĩnh viễn tài khoản người dùng:
              </p>
              <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-[#111319] p-2.5 font-mono text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {deletingUser.username}
                  </p>
                  <p className="text-[11px] text-slate-400">{deletingUser.email}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    deletingUser.role === "admin"
                      ? "bg-purple-500/20 text-purple-600"
                      : "bg-teal-500/20 text-teal-600"
                  }`}
                >
                  {deletingUser.role.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Nếu chỉ muốn tạm dừng quyền truy cập của người dùng này mà không làm mất lịch sử, bạn có thể chọn <b>Khóa tài khoản</b> thay vì xóa vĩnh viễn.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-[#1E212D]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmittingDelete && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Xác Nhận Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
