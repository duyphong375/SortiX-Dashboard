// Bộ chuẩn hóa dữ liệu thô và phát hiện cảnh báo từ IoT / nhận diện ảnh
import { TelemetryData, VisionDetection, SorterConfig, AlertEvent, CATALOG_BRANDS } from "./types";
import { TelemetrySchema, VisionDetectionSchema } from "./schemas";

export function cleanTelemetryPayload(raw: any, prev: TelemetryData): TelemetryData {
  if (!raw || typeof raw !== "object") return prev;
  
  const parsed = TelemetrySchema.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      device_id: parsed.data.device_id || prev.device_id,
      uptime: parsed.data.uptime ?? prev.uptime,
      cpu_temp: parsed.data.cpu_temp ?? prev.cpu_temp,
      wifi_rssi: parsed.data.wifi_rssi ?? prev.wifi_rssi,
      conveyor_running: raw.conveyor_running !== undefined ? raw.conveyor_running : prev.conveyor_running,
      conveyor_speed: parsed.data.conveyor_speed ?? prev.conveyor_speed,
      encoder_count: parsed.data.encoder_count ?? prev.encoder_count,
      active_config_version: parsed.data.active_config_version ?? prev.active_config_version,
      last_heartbeat: new Date().toISOString(),
    } as TelemetryData;
  }
  
  return prev;
}

export function normalizeBrandId(rawBrand: string): string {
  const lower = String(rawBrand || "").toLowerCase().trim();
  if (lower.includes("coca") || lower === "brand_c") return "brand_c";
  if (lower.includes("pepsi") || lower === "brand_a") return "brand_a";
  if (lower.includes("red") || lower.includes("bull") || lower === "brand_b") return "brand_b";
  if (lower.includes("aqua") || lower === "brand_d") return "brand_d";
  return lower;
}

export function cleanVisionPayload(raw: any): VisionDetection | null {
  if (!raw || typeof raw !== "object") return null;

  const rawBrand = String(raw.brand_id || raw.brand || raw.itemType || raw.item_type || raw.class_name || "");
  if (!rawBrand) return null;
  const brandId = normalizeBrandId(rawBrand);

  const payload = {
    product_id: String(raw.product_id || raw.id || `pkg_${Math.floor(1000 + Math.random() * 9000)}`),
    brand_id: brandId,
    confidence: Number(raw.confidence ?? 0.95),
    catalog_version: raw.catalog_version || "catalog_01",
    timestamp: raw.timestamp || new Date().toISOString(),
  };

  const parsed = VisionDetectionSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data as VisionDetection;
  }
  return null;
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
