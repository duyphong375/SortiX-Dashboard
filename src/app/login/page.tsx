"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Wrench,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { UserRole, MOCK_USERS } from "@/lib/permissions";
import { useToast } from "@/components/ui/Toast";

/**
 * Modern Vector SVG Logo: Circular IoT / EcoSort Automation
 * Features:
 * - Infinity Recycle Loop with sleek geometric facets
 * - Circuit node traces along the loops
 * - Central AI Camera Eye Lens in emerald & deep cyan
 * - Metallic gradients and reflections
 */
function CircularIoTLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Emerald to Cyan Loop Gradient */}
        <linearGradient id="circ-grad-loop1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="45%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Counter Loop Gradient */}
        <linearGradient id="circ-grad-loop2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="55%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Metallic Stroke Gradient */}
        <linearGradient id="circ-metallic" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
        </linearGradient>

        {/* AI Camera Lens Pupil Flare */}
        <radialGradient id="circ-lens-glare" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="1" />
          <stop offset="40%" stopColor="#0284C7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#064E3B" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Infinity Loops Ribbon (Left & Right) */}
      <path
        d="M 32 30 C 18 30 10 39 10 50 C 10 61 18 70 32 70 C 44 70 50 58 50 50 C 50 42 44 30 32 30 Z"
        fill="url(#circ-grad-loop1)"
      />
      <path
        d="M 68 30 C 56 30 50 42 50 50 C 50 58 56 70 68 70 C 82 70 90 61 90 50 C 90 39 82 30 68 30 Z"
        fill="url(#circ-grad-loop2)"
      />

      {/* Inner Cutouts for sharp ribbon depth */}
      <path
        d="M 32 38 C 22 38 18 43 18 50 C 18 57 22 62 32 62 C 40 62 44 54 47 50 C 44 46 40 38 32 38 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 68 38 C 60 38 56 46 53 50 C 56 54 60 62 68 62 C 78 62 82 57 82 50 C 82 43 78 38 68 38 Z"
        fill="#FFFFFF"
      />

      {/* Circuit Traces & Solder Nodes */}
      <path
        d="M 21 50 H 30"
        stroke="url(#circ-metallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="50" r="2.2" fill="#10B981" />

      <path
        d="M 70 50 H 79"
        stroke="url(#circ-metallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="80" cy="50" r="2.2" fill="#0EA5E9" />

      {/* Top & Bottom Circuit Branching */}
      <circle cx="32" cy="24" r="2.5" fill="#10B981" />
      <path d="M 32 24 V 30" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />

      <circle cx="68" cy="76" r="2.5" fill="#0284C7" />
      <path d="M 68 70 V 76" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />

      {/* Central AI Camera Eye Lens */}
      <circle cx="50" cy="50" r="13" fill="#0F172A" />
      <circle cx="50" cy="50" r="11" fill="url(#circ-metallic)" />
      <circle cx="50" cy="50" r="8.5" fill="url(#circ-lens-glare)" />
      {/* Specular Highlight Reflection */}
      <circle cx="48" cy="47.5" r="2.5" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("admin@pbl3.local");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleRoleLogin = (role: UserRole) => {
    setErrorMsg(null);
    login(role);
    toast.success(`Đăng nhập thành công với quyền ${role === "admin" ? "Quản trị viên (Admin)" : "Kỹ thuật viên (User)"}`);
    router.push("/");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 4 ký tự.");
      return;
    }

    const matchedUser = MOCK_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (matchedUser) {
      handleRoleLogin(matchedUser.role);
    } else {
      setErrorMsg("Tài khoản hoặc mật khẩu không chính xác. Thử 'admin@pbl3.local' hoặc 'operator@pbl3.local'.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
      {/* ========================================================
          CỘT TRÁI: KHUNG ĐĂNG NHẬP (MINIMAL SAAS LIGHT CANVAS)
          ======================================================== */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 lg:w-[48%] xl:w-[45%] 2xl:w-[42%] bg-white border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        {/* Header Branding */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-1 border border-emerald-500/20 shadow-xs">
              <CircularIoTLogo className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-slate-900 uppercase">
                SORTIX AI
              </span>
              <span className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-200">
                PBL3
              </span>
            </div>
          </div>

          {/* System Online Status Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-800">Online</span>
          </div>
        </div>

        {/* Main Form Center Box */}
        <div className="my-auto w-full max-w-sm mx-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Đăng nhập
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Đăng nhập để truy cập bảng điều khiển hệ thống.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="admin@pbl3.local"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("Vui lòng liên hệ Quản trị viên hệ thống để khôi phục quyền truy cập.", "Hỗ trợ tài khoản")}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Primary CTA Submit Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-3 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng nhập</span>
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-full border-t border-slate-100"></div>
              <span className="absolute bg-white px-3 text-xs text-slate-400">
                Hoặc đăng nhập nhanh demo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@pbl3.local");
                  setPassword("admin123");
                  handleRoleLogin("admin");
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all hover:bg-slate-200 active:scale-[0.99] cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-purple-600" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("operator@pbl3.local");
                  setPassword("operator123");
                  handleRoleLogin("user");
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all hover:bg-slate-200 active:scale-[0.99] cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                <span>Kỹ Thuật Viên</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Đồ án PBL3 • Hệ thống phân loại sản phẩm • 2026
          </p>
        </div>
      </div>

      {/* ========================================================
          CỘT PHẢI: SHOWROOM TRÌNH DIỄN HỆ THỐNG PBL3 (BENTO SPECS)
          ======================================================== */}
      <div className="hidden lg:flex lg:flex-1 p-6 lg:p-8 xl:p-10 flex-col justify-between bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-[#F0F9FF] relative overflow-hidden">
        {/* Soft Ambient Blur Rings */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />

        {/* Outer Curved Container */}
        <div className="relative w-full h-full rounded-[32px] border border-slate-200/80 bg-white/75 backdrop-blur-md p-8 xl:p-10 flex flex-col justify-between shadow-xs overflow-hidden">
          {/* Header & Product Information */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>PHIÊN BẢN HỆ THỐNG V3.2 • IOT &amp; AI VISION</span>
            </div>

            <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900 mt-3 leading-tight">
              Hệ Thống Phân Loại Thông Minh SortiX
            </h2>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Ứng dụng thị giác máy tính YOLOv8 kết hợp vi điều khiển ESP32-C5 điều khiển băng tải và cơ cấu gạt phân loại sản phẩm thời gian thực.
            </p>
          </div>

          {/* Visual 3D Hero Showcase (Điểm nhấn trung tâm duy nhất) */}
          <div className="my-auto flex-1 flex flex-col justify-center min-h-0 pt-6">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-md transition-all duration-300 hover:shadow-xl">
              <img
                src="/smart_sorter_hero.jpg"
                alt="Hệ Thống Phân Loại Sản Phẩm Tự Động 3D Hero"
                className="w-full h-auto max-h-[480px] xl:max-h-[540px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              {/* Subtle vignette / reflection overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />

              {/* Live AI Overlay Pill */}
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3.5 py-1 border border-white/20 text-[11px] font-semibold text-white shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Vision Scanning Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

