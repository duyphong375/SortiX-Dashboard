import { z } from "zod";

// MQTT payloads are untrusted input. Keep these schemas deliberately strict for
// known fields while allowing firmware versions to add metadata via
// `passthrough()`.
const finiteNumber = z.number().finite();
const nonEmptyString = z.string().trim().min(1);

export const TelemetrySchema = z.object({
  device_id: nonEmptyString.max(128).default("sorter_01"),
  online: z.boolean().default(true),
  uptime: finiteNumber.nonnegative().default(0),
  cpu_temp: finiteNumber.default(42.5),
  wifi_rssi: finiteNumber.default(-58),
  wifi_band: z.enum(["2.4 GHz", "5.0 GHz (Wi-Fi 6)"]).default("2.4 GHz").catch("2.4 GHz"),
  conveyor_running: z.boolean().default(false),
  conveyor_speed: finiteNumber.min(0).max(100).default(60),
  s1_entry: z.boolean().default(false),
  s2_sorter1: z.boolean().default(false),
  s3_sorter2: z.boolean().default(false),
  arm1_active: z.boolean().default(false),
  arm2_active: z.boolean().default(false),
  estop_pressed: z.boolean().default(false),
  encoder_count: finiteNumber.nonnegative().default(0),
  active_config_version: finiteNumber.int().nonnegative().default(1),
  last_heartbeat: nonEmptyString.max(128).default(() => new Date().toISOString()),
}).passthrough();

export const VisionDetectionSchema = z.object({
  product_id: nonEmptyString.max(128),
  brand_id: nonEmptyString.max(128),
  confidence: finiteNumber.min(0).max(1).default(0.95),
  catalog_version: nonEmptyString.max(128).default("catalog_01"),
  timestamp: nonEmptyString.max(128).default(() => new Date().toISOString()),
}).passthrough();

export const BinRuleSchema = z.object({
  bin_id: z.union([z.literal(1), z.literal(2)]),
  brand_ids: z.array(z.string().trim().min(1)),
}).passthrough();

export const SorterConfigSchema = z.object({
  schema_version: finiteNumber.int().positive().default(1),
  config_version: finiteNumber.int().nonnegative().default(1),
  device_id: nonEmptyString.max(128).default("sorter_01"),
  catalog_version: nonEmptyString.max(128).default("catalog_01"),
  bins: z.array(BinRuleSchema).min(1),
  default_bin: z.literal(3).default(3),
  apply_mode: z.enum(["when_line_empty", "immediate"]).default("when_line_empty"),
  timestamp: nonEmptyString.max(128).default(() => new Date().toISOString()),
  timezone: z.string().optional(),
  shift: z.object({ start: z.string(), end: z.string() }).optional(),
  servo_routes: z.record(z.string(), z.object({ io: z.string(), angle: finiteNumber })).optional(),
}).passthrough();

export const ClassificationRecordSchema = z.object({
  id: nonEmptyString.max(128),
  product_id: nonEmptyString.max(128),
  brand_id: nonEmptyString.max(128),
  brand_name: nonEmptyString.max(128),
  confidence: finiteNumber.min(0).max(1),
  target_bin: finiteNumber.int().min(1).max(3),
  actual_bin: finiteNumber.int().min(1).max(3),
  status: z.enum(["success", "diverted_default", "rejected", "jammed"]),
  timestamp: nonEmptyString.max(128),
}).passthrough();

export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  brand: z.string().optional(),
  bin: z.coerce.number().int().min(1).max(3).optional(),
  status: z.enum(["success", "diverted_default", "rejected", "jammed"]).optional(),
  date: z.string().optional(),
});

// User Account Schemas
export const UserRoleSchema = z.enum(["admin", "user"]);
export const UserStatusSchema = z.enum(["active", "locked"]);

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không được quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch dưới, gạch ngang và dấu chấm")
    .optional(),
  full_name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được quá 100 ký tự")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Định dạng email không hợp lệ")
    .max(255)
    .optional(),
}).refine((data) => data.username !== undefined || data.full_name !== undefined || data.email !== undefined, {
  message: "Cần ít nhất một trường dữ liệu (username, full_name hoặc email) để cập nhật",
});

export const ChangePasswordSchema = z.object({
  current_password: z
    .string()
    .min(1, "Mật khẩu hiện tại không được để trống"),
  new_password: z
    .string()
    .min(4, "Mật khẩu mới phải có ít nhất 4 ký tự")
    .max(100, "Mật khẩu mới không được quá 100 ký tự"),
  confirm_password: z
    .string()
    .min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp với mật khẩu mới",
  path: ["confirm_password"],
}).refine((data) => data.new_password !== data.current_password, {
  message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
  path: ["new_password"],
});

export const RegisterSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được quá 100 ký tự"),
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không được quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang và dấu chấm"),
  email: z
    .string()
    .trim()
    .email("Định dạng email không hợp lệ")
    .max(255),
  password: z
    .string()
    .min(4, "Mật khẩu phải có ít nhất 4 ký tự")
    .max(100, "Mật khẩu không được quá 100 ký tự"),
  confirm_password: z
    .string()
    .min(1, "Vui lòng nhập lại mật khẩu"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

export const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Tên đăng nhập hoặc email không được để trống"),
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống"),
});

export const AdminCreateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được quá 100 ký tự"),
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không được quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang và dấu chấm"),
  email: z
    .string()
    .trim()
    .email("Định dạng email không hợp lệ")
    .max(255),
  password: z
    .string()
    .min(4, "Mật khẩu phải có ít nhất 4 ký tự")
    .max(100, "Mật khẩu không được quá 100 ký tự"),
  role: z.enum(["admin", "user"]).default("user"),
  status: z.enum(["active", "locked"]).default("active"),
});

export const AdminUpdateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được quá 100 ký tự")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Định dạng email không hợp lệ")
    .max(255)
    .optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "locked"]).optional(),
  new_password: z
    .string()
    .min(4, "Mật khẩu mới phải có ít nhất 4 ký tự")
    .max(100, "Mật khẩu mới không được quá 100 ký tự")
    .optional(),
});

export const ForgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên đăng nhập hoặc email"),
});

export const ResetPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Tên đăng nhập hoặc email không được để trống"),
  otp: z
    .string()
    .trim()
    .length(6, "Mã OTP phải gồm đúng 6 chữ số")
    .regex(/^\d{6}$/, "Mã OTP chỉ bao gồm các chữ số"),
  new_password: z
    .string()
    .min(4, "Mật khẩu mới phải có ít nhất 4 ký tự")
    .max(100, "Mật khẩu mới không được quá 100 ký tự"),
  confirm_password: z
    .string()
    .min(1, "Vui lòng nhập lại mật khẩu mới"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp với mật khẩu mới",
  path: ["confirm_password"],
});

// Emergency Stop & Safety Schemas
export const EmergencyStopPayloadSchema = z.object({
  event: z.literal("emergency_stop"),
  station_id: nonEmptyString.default("STATION_01"),
  triggered_by: nonEmptyString.default("Physical E-Stop Button #1"),
  timestamp: nonEmptyString.default(() => new Date().toISOString()),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
}).passthrough();

export const UnlockSystemSchema = z.object({
  note: z.string().trim().max(255).optional(),
}).passthrough();

export const JamDetectedPayloadSchema = z.object({
  event: z.literal("jam_detected"),
  section: nonEmptyString.default("Conveyor_Belt_Zone_A"),
  duration_seconds: finiteNumber.positive().default(5),
  sensor_id: nonEmptyString.default("OPTICAL_JAM_02"),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const BinFullPayloadSchema = z.object({
  event: z.literal("bin_full"),
  bin_id: nonEmptyString.default("BIN_RED_01"),
  category: nonEmptyString.default("Sản phẩm loại A"),
  current_count: finiteNumber.int().nonnegative().default(50),
  max_capacity: finiteNumber.int().positive().default(50),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const TemperatureWarningPayloadSchema = z.object({
  event: z.literal("temperature_warning"),
  device_name: nonEmptyString.default("Main_Drive_Motor / Edge_AI_Box"),
  current_temp: finiteNumber.default(78.5),
  threshold_temp: finiteNumber.default(75.0),
  unit: nonEmptyString.default("°C"),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const DeviceOfflinePayloadSchema = z.object({
  event: z.literal("device_offline"),
  device_id: nonEmptyString.default("ESP32_MAIN_CONTROLLER"),
  ip_address: nonEmptyString.default("192.168.1.105"),
  last_seen: nonEmptyString.default("15 giây trước"),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const HeartbeatPayloadSchema = z.object({
  device_id: z.string().default("ESP32_MAIN_CONTROLLER"),
  ip_address: z.string().default("192.168.1.105"),
  uptime: z.number().default(0),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const ShiftSummaryPayloadSchema = z.object({
  event: z.literal("shift_summary"),
  shift_name: nonEmptyString.default("Ca 1 - Buổi sáng"),
  total_products: finiteNumber.int().nonnegative().default(1250),
  sorted_good: finiteNumber.int().nonnegative().default(1180),
  sorted_defect: finiteNumber.int().nonnegative().default(70),
  accuracy_rate: nonEmptyString.default("94.4%"),
  emergency_stops_count: finiteNumber.int().nonnegative().default(1),
  operating_hours: nonEmptyString.default("7.5 giờ"),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();

export const MqttDisconnectedPayloadSchema = z.object({
  event: z.literal("mqtt_disconnected"),
  broker_url: nonEmptyString.default("wss://broker.emqx.io:8084/mqtt"),
  disconnected_duration_seconds: finiteNumber.default(5),
  reconnect_attempt: finiteNumber.int().nonnegative().default(1),
  mode: z.enum(["realtime", "simulation"]).default("realtime"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
}).passthrough();



