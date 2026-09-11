// Quản lý lưu trữ dữ liệu lịch sử vào LocalStorage (bộ nhớ đệm ngoại tuyến và nhật ký hằng ngày)
import { ClassificationRecord, AlertEvent, SorterConfig } from "./types";

const HISTORY_STORAGE_KEY = "pbl3_sorter_records_v1";
const ALERTS_STORAGE_KEY = "pbl3_sorter_alerts_v1";
const CONFIG_STORAGE_KEY = "pbl3_sorter_config_v1";
const MAX_RECORDS = 500;

export const DEFAULT_INITIAL_CONFIG: SorterConfig = {
  schema_version: 1,
  config_version: 1,
  device_id: "sorter_01",
  catalog_version: "catalog_01",
  bins: [
    { bin_id: 1, brand_ids: ["brand_c"] }, // Khay 1: Coca-Cola
    { bin_id: 2, brand_ids: ["brand_a"] }, // Khay 2: Pepsi
  ],
  default_bin: 3, // Khay 3: Mặc định (Red Bull, Aquafina, hoặc nhãn khác đi thẳng)
  apply_mode: "when_line_empty",
  timestamp: new Date().toISOString(),
};

export function saveClassificationRecord(record: ClassificationRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadClassificationHistory();
    const updated = [record, ...existing].slice(0, MAX_RECORDS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Lỗi ghi LocalStorage records:", err);
  }
}

export function loadClassificationHistory(): ClassificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Lỗi đọc LocalStorage records:", err);
    return [];
  }
}

export function clearClassificationHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function saveAlertHistory(alert: AlertEvent): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadAlertHistory();
    // Chống ghi trùng event_id
    if (existing.some((e) => e.event_id === alert.event_id)) return;
    const updated = [alert, ...existing].slice(0, 100);
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Lỗi ghi LocalStorage alerts:", err);
  }
}

export function loadAlertHistory(): AlertEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Lỗi đọc LocalStorage alerts:", err);
    return [];
  }
}

export function clearAlertHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ALERTS_STORAGE_KEY);
}

export function saveSorterConfigLocal(config: SorterConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("Lỗi lưu LocalStorage config:", err);
  }
}

export function loadSorterConfigLocal(): SorterConfig {
  if (typeof window === "undefined") return DEFAULT_INITIAL_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_INITIAL_CONFIG;
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_INITIAL_CONFIG;
  }
}

/**
 * Khôi phục cấu hình phân loại về mặc định v1 nguyên bản
 */
export function resetSorterConfigLocal(): SorterConfig {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
  return {
    ...DEFAULT_INITIAL_CONFIG,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Khôi phục cài đặt gốc toàn diện: Xóa sạch dữ liệu phân loại, cảnh báo và cấu hình
 */
export function factoryResetAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  localStorage.removeItem(ALERTS_STORAGE_KEY);
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

