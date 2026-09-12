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
