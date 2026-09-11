"use client";

import React, { useState } from "react";
import { SorterConfig, TelemetryData, AlertEvent, CATALOG_BRANDS } from "@/lib/types";
import { sendTelegramAlert, sendEmailAlert } from "@/lib/alertService";
import {
  SlidersHorizontal,
  ArrowLeftRight,
  Save,
  Send,
  Cpu,
  Wifi,
  Radio,
  BellRing,
  Mail,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Code,
  RotateCcw,
} from "lucide-react";

interface ConfigAndDiagnosticsProps {
  config: SorterConfig;
  telemetry: TelemetryData;
  alerts: AlertEvent[];
  pingMs: number;
  onSaveConfig: (newConfig: SorterConfig) => Promise<{ success: boolean; message: string }>;
  applyStatusText?: string;
  onClearAlerts: () => void;
  onResetDefaultConfig?: () => void;
}

export const ConfigAndDiagnostics: React.FC<ConfigAndDiagnosticsProps> = ({
  config,
  telemetry,
  alerts,
  pingMs,
  onSaveConfig,
  applyStatusText,
  onClearAlerts,
  onResetDefaultConfig,
}) => {
  const [bin1Brand, setBin1Brand] = useState<string>(
    config.bins[0]?.brand_ids?.[0] || "brand_c"
  );
  const [bin2Brand, setBin2Brand] = useState<string>(
    config.bins[1]?.brand_ids?.[0] || "brand_a"
  );
  const [isApplying, setIsApplying] = useState(false);
  const [statusMsg, setStatusMsg] = useState(applyStatusText || "");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertResult, setAlertResult] = useState<{ success: boolean; message: string } | null>(null);

  const nextVersion = config.config_version + 1;

  const handleSwap = () => {
    const temp = bin1Brand;
    setBin1Brand(bin2Brand);
    setBin2Brand(temp);
  };

  const handleSave = async () => {
    setIsApplying(true);
    setStatusMsg("");
    const updatedConfig: SorterConfig = {
      schema_version: 1,
      config_version: nextVersion,
      device_id: config.device_id || "sorter_01",
      catalog_version: "catalog_01",
      bins: [
        { bin_id: 1, brand_ids: bin1Brand !== "none" ? [bin1Brand] : [] },
        { bin_id: 2, brand_ids: bin2Brand !== "none" ? [bin2Brand] : [] },
      ],
      default_bin: 3,
      apply_mode: "when_line_empty",
      timestamp: new Date().toISOString(),
    };

    const res = await onSaveConfig(updatedConfig);
    setIsApplying(false);
    setStatusMsg(res.message);
  };

  const handleResetDefault = () => {
    if (confirm("Bạn có chắc muốn đưa phiên bản cấu hình về v1 ban đầu?")) {
      setBin1Brand("brand_c");
      setBin2Brand("brand_a");
      setStatusMsg("Đã khôi phục cấu hình v1 mặc định thành công!");
      onResetDefaultConfig?.();
    }
  };

  const handleTestTelegram = async () => {
    setIsSendingAlert(true);
    setAlertResult(null);
    const testAlert: AlertEvent = {
      event_id: `test_tg_${Date.now()}`,
      event_type: "emergency_stop",
      severity: "critical",
      device_id: "sorter_01",
      description: "Thử nghiệm kết nối Bot Telegram từ Task Cài đặt & Chẩn đoán IoT PBL3.",
      timestamp: new Date().toISOString(),
    };
    const res = await sendTelegramAlert(testAlert, true);
    setAlertResult(res);
    setIsSendingAlert(false);
  };

  const handleTestEmail = async () => {
    setIsSendingAlert(true);
    setAlertResult(null);
    const testAlert: AlertEvent = {
      event_id: `test_email_${Date.now()}`,
      event_type: "temperature_warning",
      severity: "warning",
      device_id: "sorter_01",
      description: "Thử nghiệm gửi email báo cáo sự cố qua SMTP từ Task Cài đặt & Chẩn đoán.",
      timestamp: new Date().toISOString(),
    };
    const res = await sendEmailAlert(testAlert, true);
    setAlertResult(res);
    setIsSendingAlert(false);
  };

  const ioPinList = [
    { pin: "IO0", function: "Cảm biến quang S1", role: "Đầu vào Camera YOLO AI", state: telemetry.s1_entry },
    { pin: "IO1", function: "Cảm biến quang S2", role: "Vị trí kích gạt Khay 1", state: telemetry.s2_sorter1 },
    { pin: "IO6", function: "Cảm biến quang S3", role: "Vị trí kích gạt Khay 2", state: telemetry.s3_sorter2 },
    { pin: "IO4", function: "MCPWM Motor Driver", role: "Điều tốc băng tải PWM", state: telemetry.conveyor_running },
    { pin: "IO10", function: "Nút E-STOP", role: "Dừng ngắt cứng khẩn cấp", state: telemetry.estop_pressed, isError: telemetry.estop_pressed },
    { pin: "IO23", function: "PWM Servo 1", role: "Cơ cấu gạt phân loại Khay 1", state: telemetry.arm1_active },
    { pin: "IO24", function: "PWM Servo 2", role: "Cơ cấu gạt phân loại Khay 2", state: telemetry.arm2_active },
  ];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* LƯỚI 3 CỘT VỪA KHÍT MÀN HÌNH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* CỘT 1: CẤU HÌNH PHÂN LUỒNG KHAY */}
        <div className="relate-card flex flex-col rounded-2xl p-5 shadow-sm overflow-hidden border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Cấu Hình Phân Luồng Khay
              </h4>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.05] font-mono">
              v{config.config_version}
            </span>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1 space-y-4">
            {/* Khay 1 */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-[#111319] dark:border-white/[0.06] p-3.5">
              <label className="text-xs font-bold text-cyan-700 dark:text-cyan-400 flex items-center justify-between">
                <span>📥 KHAY 1 (Gạt Servo IO23):</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">45% vị trí</span>
              </label>
              <select
                value={bin1Brand}
                onChange={(e) => setBin1Brand(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-200 outline-none focus:border-cyan-500 shadow-xs"
              >
                {Object.keys(CATALOG_BRANDS).map((k) => (
                  <option key={k} value={k}>
                    {CATALOG_BRANDS[k].name} ({CATALOG_BRANDS[k].code})
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Hoán Đổi Nhanh */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/90 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-300 hover:scale-105 transition-all shadow-xs"
              >
                <ArrowLeftRight className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                Hoán đổi Khay 1 ⇄ Khay 2
              </button>
            </div>

            {/* Khay 2 */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-[#111319] dark:border-white/[0.06] p-3.5">
              <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">
                <span>📥 KHAY 2 (Gạt Servo IO24):</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">72% vị trí</span>
              </label>
              <select
                value={bin2Brand}
                onChange={(e) => setBin2Brand(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-white/[0.07] dark:bg-[#161822] dark:text-slate-200 outline-none focus:border-blue-500 shadow-xs"
              >
                {Object.keys(CATALOG_BRANDS).map((k) => (
                  <option key={k} value={k}>
                    {CATALOG_BRANDS[k].name} ({CATALOG_BRANDS[k].code})
                  </option>
                ))}
              </select>
            </div>

            {/* Khay 3 Mặc định */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-[#111319] dark:border-white/[0.06] p-3.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center justify-between">
                <span>📥 KHAY 3 (Mặc định cuối băng):</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">96% vị trí</span>
              </label>
              <p className="mt-1.5 text-xs font-normal text-slate-600 dark:text-slate-400">
                Tất cả các loại vật mẫu còn lại không thuộc Khay 1 và Khay 2 sẽ trượt thẳng vào Khay 3.
              </p>
            </div>

            {/* Thông báo trạng thái */}
            {statusMsg && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {statusMsg}
              </div>
            )}

            {/* Cụm nút lưu và khôi phục v1 */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSave}
                disabled={isApplying}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-600 hover:bg-cyan-700 text-white dark:border-cyan-500/40 dark:bg-cyan-500/20 py-2.5 text-xs font-bold uppercase tracking-wider dark:text-cyan-300 dark:hover:bg-cyan-500/30 transition-all disabled:opacity-40 shadow-sm"
              >
                <Save className="h-4 w-4" />
                {isApplying ? "Đang áp dụng..." : `Lưu & Xuất Bản v${nextVersion} (MQTT)`}
              </button>

              {onResetDefaultConfig && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="flex w-full items-center justify-center gap-1.5 border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Khôi Phục v1 Mặc Định</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CỘT 2: CHẨN ĐOÁN PHẦN CỨNG ESP32-C5 & CHÂN IO */}
        <div className="relate-card flex flex-col rounded-2xl p-5 shadow-sm overflow-hidden border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                <Cpu className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Chẩn Đoán Phần Cứng ESP32-C5
              </h4>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.05] font-mono">
              RISC-V 240MHz
            </span>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1 space-y-3">
            {/* Thẻ trạng thái kết nối */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/[0.06] dark:bg-[#111319]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">Băng tần Wi-Fi</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{telemetry.wifi_band}</span>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/[0.06] dark:bg-[#111319]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">Độ trễ Ping</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{pingMs} ms</span>
              </div>
            </div>

            {/* Bảng chân GPIO thời gian thực */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 flex-1 flex flex-col dark:border-white/[0.06] dark:bg-[#111319]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-2">
                Trạng Thái Ngoại Vi GPIO:
              </span>
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {ioPinList.map((io) => (
                  <div
                    key={io.pin}
                    className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/80 dark:border-white/[0.06] dark:bg-[#161822] px-2.5 py-1.5 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 w-10">{io.pin}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{io.function}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline font-normal">
                        {io.role}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          io.state
                            ? io.isError
                              ? "bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-ping"
                              : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Uptime và thông tin ID */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 dark:border-white/[0.06] dark:bg-[#111319] p-2 text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
              Device ID: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{telemetry.device_id}</span> • Uptime: {telemetry.uptime}s • Temp: {telemetry.cpu_temp}°C
            </div>
          </div>
        </div>

        {/* CỘT 3: TRUNG TÂM CẢNH BÁO & KIỂM TRA THÔNG BÁO */}
        <div className="relate-card flex flex-col rounded-2xl p-5 shadow-sm overflow-hidden border border-slate-200/80 bg-white/95 dark:border-white/[0.07] dark:bg-[#161822]">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <BellRing className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Trung Tâm Cảnh Báo & Alert
              </h4>
            </div>
            {alerts.length > 0 && (
              <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                {alerts.length} sự cố
              </span>
            )}
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1 space-y-3">
            {/* Nút kiểm tra gửi thông báo */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-300 block">
                Kiểm tra kênh thông báo tự động:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTestTelegram}
                  disabled={isSendingAlert}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E212D] transition-all disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5 text-blue-500" />
                  Bot Telegram
                </button>

                <button
                  onClick={handleTestEmail}
                  disabled={isSendingAlert}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 dark:border-white/[0.07] dark:bg-[#111319] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E212D] transition-all disabled:opacity-40"
                >
                  <Mail className="h-3.5 w-3.5 text-purple-500" />
                  Email SMTP
                </button>
              </div>
            </div>

            {/* Kết quả test */}
            {alertResult && (
              <div
                className={`rounded-md border p-2.5 text-xs font-semibold ${
                  alertResult.success
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {alertResult.message}
              </div>
            )}

            {/* Danh sách các cảnh báo gần đây */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-white/[0.06] dark:bg-[#111319] p-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  Nhật Ký Cảnh Báo ({alerts.length}):
                </span>
                {alerts.length > 0 && (
                  <button
                    onClick={onClearAlerts}
                    className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-xs text-center py-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                    Hệ thống hoạt động bình thường, không có cảnh báo nào.
                  </div>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div
                      key={a.event_id}
                      className="rounded-lg border border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10 p-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                        <span className="font-bold uppercase">{a.event_type}</span>
                        <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-900 dark:text-slate-200 font-medium">
                        {a.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
