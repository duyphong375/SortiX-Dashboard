import { z } from "zod";

export const TelemetrySchema = z.object({
  device_id: z.string().default("sorter_01"),
  online: z.boolean().default(true),
  uptime: z.number().default(0),
  cpu_temp: z.number().default(42.5),
  wifi_rssi: z.number().default(-58),
  wifi_band: z.enum(["2.4 GHz", "5.0 GHz (Wi-Fi 6)"]).default("2.4 GHz").catch("2.4 GHz"),
  conveyor_running: z.boolean().default(false),
  conveyor_speed: z.number().default(60),
  s1_entry: z.boolean().default(false),
  s2_sorter1: z.boolean().default(false),
  s3_sorter2: z.boolean().default(false),
  arm1_active: z.boolean().default(false),
  arm2_active: z.boolean().default(false),
  estop_pressed: z.boolean().default(false),
  encoder_count: z.number().default(0),
  active_config_version: z.number().default(1),
  last_heartbeat: z.string().default(() => new Date().toISOString()),
}).passthrough();

export const VisionDetectionSchema = z.object({
  product_id: z.string(),
  brand_id: z.string(),
  confidence: z.number().min(0).max(1).default(0.95),
  catalog_version: z.string().default("catalog_01"),
  timestamp: z.string().default(() => new Date().toISOString()),
}).passthrough();
