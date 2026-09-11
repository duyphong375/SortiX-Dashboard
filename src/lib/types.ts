// Kiểu dữ liệu và giao diện trung tâm cho bảng điều khiển bộ phân loại IoT
// Tương thích với PROJECT_PLAN.md và đặc tả phần cứng ESP32-C5

export type ThemeMode = "dark" | "light";
export type DashboardTab = "conveyor" | "analytics" | "history" | "config";

export interface VisualItem {
  id: string;
  brandKey: string;
  progress: number; // 0% - 100%
  targetBin: number;
  yOffset?: number; // Độ lệch Y khi gạt vào máng (0px -> 60px)
  opacity?: number;
  deflected?: boolean;
  sorted?: boolean;
  s1Triggered?: boolean;
}

export interface BrandInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
}

export const CATALOG_BRANDS: Record<string, BrandInfo> = {
  brand_c: {
    id: "brand_c",
    name: "Coca-Cola",
    code: "COCA",
    color: "#ef4444", // Đỏ
    badgeBg: "bg-red-500/20",
    borderColor: "border-red-500/50",
    textColor: "text-red-400",
  },
  brand_a: {
    id: "brand_a",
    name: "Pepsi",
    code: "PEPSI",
    color: "#3b82f6", // Xanh dương
    badgeBg: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
  },
  brand_b: {
    id: "brand_b",
    name: "Red Bull",
    code: "REDBULL",
    color: "#f59e0b", // Vàng hổ phách
    badgeBg: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
    textColor: "text-amber-400",
  },
  brand_d: {
    id: "brand_d",
    name: "Aquafina",
    code: "AQUA",
    color: "#06b6d4", // Cyan
    badgeBg: "bg-cyan-500/20",
    borderColor: "border-cyan-500/50",
    textColor: "text-cyan-400",
  },
};

export interface BinRule {
  bin_id: 1 | 2;
  brand_ids: string[];
}

export interface SorterConfig {
  schema_version: number;
  config_version: number;
  device_id: string;
  catalog_version: string;
  bins: BinRule[];
  default_bin: 3;
  apply_mode: "when_line_empty" | "immediate";
  timestamp: string;
}

export interface TelemetryData {
  device_id: string;
  online: boolean;
  uptime: number; // giây
  cpu_temp: number; // độ C (cảm biến nội vi ESP32-C5)
  wifi_rssi: number; // dBm
  wifi_band: "2.4 GHz" | "5.0 GHz (Wi-Fi 6)";
  conveyor_running: boolean;
  conveyor_speed: number; // 0 - 100 (%)
  s1_entry: boolean; // IO0 - Cảm biến quang trước camera
  s2_sorter1: boolean; // IO1 - Cảm biến quang khay 1
  s3_sorter2: boolean; // IO6 - Cảm biến quang khay 2
  arm1_active: boolean; // IO23 - Servo 1 MCPWM
  arm2_active: boolean; // IO24 - Servo 2 MCPWM
  estop_pressed: boolean; // IO10 - Nút dừng khẩn cấp
  encoder_count: number; // IO2/IO3 - Xung PCNT
  active_config_version: number;
  last_heartbeat: string;
}

export interface VisionDetection {
  product_id: string;
  brand_id: string;
  confidence: number;
  catalog_version?: string;
  timestamp: string;
}

export interface ClassificationRecord {
  id: string;
  product_id: string;
  brand_id: string;
  brand_name: string;
  confidence: number;
  target_bin: number;
  actual_bin: number;
  status: "success" | "diverted_default" | "rejected" | "jammed";
  timestamp: string;
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertEvent {
  event_id: string;
  event_type:
    | "emergency_stop"
    | "jam_detected"
    | "motor_stall"
    | "sensor_fault"
    | "camera_disconnected"
    | "vision_service_down"
    | "config_rejected"
    | "mqtt_disconnected"
    | "device_offline"
    | "temperature_warning";
  severity: AlertSeverity;
  device_id: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
}

export interface ThroughputPoint {
  time: string;
  ppm: number;
  total: number;
  bin1: number;
  bin2: number;
  bin3: number;
  speed: number;
}
