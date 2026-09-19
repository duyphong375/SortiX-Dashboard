// Kiểu dữ liệu và giao diện trung tâm cho hệ thống SortiX Dashboard
// Dùng chung cho cả Frontend, Backend và IoT Gateway

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
  s2Triggered?: boolean;
  s3Triggered?: boolean;
  isSim: boolean; // true = phôi mô phỏng, false = phôi thực từ Camera AI
  confidence?: number;
  timestamp?: string;
  isJammed?: boolean; // Đánh dấu phôi bị kẹt tại trạm cảm biến
  isRemote?: boolean; // true = phôi nhận từ thiết bị khác qua mạng
  waitingForBin?: number; // Khay đích đang đầy, phôi tạm giữ trước máng
}

export interface BrandInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  packaging?: string;
  icon?: string;
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
    packaging: "Lon nhôm 330ml", icon: "🔴",
  },
  brand_a: {
    id: "brand_a",
    name: "Pepsi",
    code: "PEPSI",
    color: "#3b82f6", // Xanh dương
    badgeBg: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
    packaging: "Lon nhôm 330ml", icon: "🔵",
  },
  brand_b: {
    id: "brand_b",
    name: "Red Bull",
    code: "REDBULL",
    color: "#f59e0b", // Vàng hổ phách
    badgeBg: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
    textColor: "text-amber-400",
    packaging: "Lon nhôm 250ml", icon: "🟡",
  },
  brand_d: {
    id: "brand_d",
    name: "Aquafina",
    code: "AQUA",
    color: "#06b6d4", // Cyan
    badgeBg: "bg-cyan-500/20",
    borderColor: "border-cyan-500/50",
    textColor: "text-cyan-400",
    packaging: "Chai nhựa PET 500ml", icon: "🔷",
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
  timezone?: string;
  shift?: { start: string; end: string };
  servo_routes?: Record<string, { io: string; angle: number }>;
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
    | "temperature_warning"
    | "bin_full"
    | "shift_summary";
  severity: AlertSeverity;
  device_id: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
  mode?: "simulation" | "realtime";
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

// User & Account Domain Types
export type UserRole = "admin" | "user";
export type UserStatus = "active" | "locked";

export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  is_online?: boolean;
  last_login_at?: string | null;
  reset_otp?: string | null;
  reset_otp_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<UserAccount, "password_hash" | "reset_otp" | "reset_otp_expires_at">;

export interface UpdateProfileInput {
  username?: string;
  full_name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface RegisterInput {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginInput {
  identifier: string; // username hoặc email
  password: string;
}

export interface ForgotPasswordInput {
  identifier: string; // username hoặc email
}

export interface ResetPasswordInput {
  identifier: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  demo_otp?: string;
  expires_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: SafeUser;
  token?: string;
}

export interface AdminCreateUserInput {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export interface AdminUpdateUserInput {
  full_name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  new_password?: string;
}

// Emergency Stop (E-Stop) & Safety Domain Types
export type SystemSafetyStatus = "OPERATIONAL" | "SYSTEM_LOCKED" | "HALTED";

export interface EmergencyStopPayload {
  event: "emergency_stop";
  station_id: string;
  triggered_by: string;
  timestamp: string;
  mode: "realtime" | "simulation";
}

export type NotificationStatus = "unprocessed" | "acknowledged" | "resolved";

export interface NotificationRecord {
  id: string;
  event: string;
  severity: "critical" | "warning" | "info" | "error";
  station_id: string;
  triggered_by: string;
  description: string;
  timestamp: string;
  mode: "realtime" | "simulation";
  status: NotificationStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface SafetyStatusResponse {
  success: boolean;
  status: SystemSafetyStatus;
  is_locked: boolean;
  active_incident?: EmergencyStopPayload | null;
  last_notification?: NotificationRecord | null;
  unprocessed_count: number;
}

export interface UnlockSystemInput {
  note?: string;
}

export interface JamDetectedPayload {
  event: "jam_detected";
  section: string;
  duration_seconds: number;
  sensor_id: string;
  mode: "realtime" | "simulation";
  timestamp?: string;
}

export interface BinFullPayload {
  event: "bin_full";
  bin_id: string;
  category: string;
  current_count: number;
  max_capacity: number;
  mode: "realtime" | "simulation";
  timestamp?: string;
}

export interface TemperatureWarningPayload {
  event: "temperature_warning";
  device_name: string;
  current_temp: number;
  threshold_temp: number;
  unit: string;
  mode: "realtime" | "simulation";
  timestamp?: string;
}

export interface DeviceOfflinePayload {
  event: "device_offline";
  device_id: string;
  ip_address: string;
  last_seen: string;
  mode: "realtime" | "simulation";
  timestamp?: string;
}

export interface HeartbeatPayload {
  device_id: string;
  ip_address?: string;
  uptime?: number;
  timestamp?: string;
}

export interface ShiftSummaryPayload {
  event: "shift_summary";
  shift_name: string;
  total_products: number;
  sorted_good: number;
  sorted_defect: number;
  accuracy_rate: string;
  emergency_stops_count: number;
  operating_hours: string;
  timestamp?: string;
  mode?: "realtime" | "simulation";
}

export interface MqttDisconnectedPayload {
  event: "mqtt_disconnected";
  broker_url?: string;
  disconnected_duration_seconds: number;
  reconnect_attempt: number;
  timestamp?: string;
  mode?: "realtime" | "simulation";
}

export interface BinCounts {
  bin1: number;
  bin2: number;
  bin3: number;
}

export interface BinCapacities {
  bin1: number;
  bin2: number;
  bin3: number;
}
