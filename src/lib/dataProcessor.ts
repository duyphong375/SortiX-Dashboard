// Bộ chuẩn hóa dữ liệu thô và phát hiện cảnh báo từ IoT / nhận diện ảnh
import { TelemetryData, VisionDetection, SorterConfig, AlertEvent, CATALOG_BRANDS } from "./types";

export function cleanTelemetryPayload(raw: any, prev: TelemetryData): TelemetryData {
  if (!raw || typeof raw !== "object") return prev;

  return {
    device_id: String(raw.device_id || prev.device_id || "sorter_01"),
    online: typeof raw.online === "boolean" ? raw.online : true,
    uptime: Number(raw.uptime ?? prev.uptime ?? 0),
    cpu_temp: Number(raw.cpu_temp ?? prev.cpu_temp ?? 42.5),
    wifi_rssi: Number(raw.wifi_rssi ?? prev.wifi_rssi ?? -58),
    wifi_band: raw.wifi_band === "5.0 GHz (Wi-Fi 6)" ? "5.0 GHz (Wi-Fi 6)" : "2.4 GHz",
    conveyor_running: typeof raw.conveyor_running === "boolean" ? raw.conveyor_running : prev.conveyor_running,
    conveyor_speed: Number(raw.conveyor_speed ?? prev.conveyor_speed ?? 60),
    s1_entry: Boolean(raw.s1_entry),
    s2_sorter1: Boolean(raw.s2_sorter1),
    s3_sorter2: Boolean(raw.s3_sorter2),
    arm1_active: Boolean(raw.arm1_active),
    arm2_active: Boolean(raw.arm2_active),
    estop_pressed: Boolean(raw.estop_pressed),
    encoder_count: Number(raw.encoder_count ?? prev.encoder_count ?? 0),
    active_config_version: Number(raw.active_config_version ?? prev.active_config_version ?? 1),
    last_heartbeat: new Date().toISOString(),
  };
}

export function cleanVisionPayload(raw: any): VisionDetection | null {
  if (!raw || typeof raw !== "object") return null;

  const brandId = String(raw.brand_id || "");
  if (!brandId) return null;

  return {
    product_id: String(raw.product_id || `pkg_${Math.floor(1000 + Math.random() * 9000)}`),
    brand_id: brandId,
    confidence: Number(raw.confidence ?? 0.95),
    catalog_version: raw.catalog_version || "catalog_01",
    timestamp: raw.timestamp || new Date().toISOString(),
  };
}

export function determineTargetBin(brandId: string, config: SorterConfig): number {
  if (!config || !Array.isArray(config.bins)) return 3;

  for (const binRule of config.bins) {
    if (binRule.brand_ids && binRule.brand_ids.includes(brandId)) {
      return binRule.bin_id;
    }
  }

  // Khay mặc định (Khay 3)
  return config.default_bin || 3;
}

export function detectAnomalies(telemetry: TelemetryData): AlertEvent[] {
  const alerts: AlertEvent[] = [];

  // 1. Cảnh báo Nút Dừng Khẩn Cấp (E-stop)
  if (telemetry.estop_pressed) {
    alerts.push({
      event_id: `estop_${Date.now()}`,
      event_type: "emergency_stop",
      severity: "critical",
      device_id: telemetry.device_id,
      description: "CẢNH BÁO NGUY HIỂM: Nút Dừng Khẩn Cấp (E-Stop IO10) đã bị nhấn! Băng tải đã dừng ngắt.",
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Cảnh báo Nhiệt độ vi xử lý ESP32-C5 quá cao
  if (telemetry.cpu_temp >= 75) {
    alerts.push({
      event_id: `temp_${Date.now()}`,
      event_type: "temperature_warning",
      severity: "warning",
      device_id: telemetry.device_id,
      description: `Nhiệt độ ESP32-C5 đạt ${telemetry.cpu_temp.toFixed(1)}°C (vượt ngưỡng an toàn 75°C trong tủ điện).`,
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function getBrandName(brandId: string): string {
  return CATALOG_BRANDS[brandId]?.name || brandId;
}
