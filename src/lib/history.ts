// Quản lý lưu trữ dữ liệu lịch sử vào LocalStorage phân tách 2 chế độ: Mô phỏng và Thực tế
import { ClassificationRecord, AlertEvent, SorterConfig } from "./types";

export const STORAGE_KEYS = {
  MODE: "pbl3_operating_mode", // "sim" | "real"
  SIM_RECORDS: "pbl3_sim_records",
  SIM_BIN_COUNTS: "pbl3_sim_bin_counts",
  REAL_RECORDS: "pbl3_real_records",
  REAL_BIN_COUNTS: "pbl3_real_bin_counts",
  LEGACY_RECORDS: "pbl3_sorter_records_v1",
  ALERTS: "pbl3_sorter_alerts_v1",
  CONFIG: "pbl3_sorter_config_v1",
} as const;

export interface BinCounts {
  bin1: number;
  bin2: number;
  bin3: number;
}

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

/**
 * Đọc chế độ vận hành đang lưu trữ ('sim' | 'real')
 * @returns true nếu là Mô phỏng, false nếu là Thực tế
 */
export function loadOperatingMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE);
    return saved !== "real";
  } catch {
    return true;
  }
}

/**
 * Lưu chế độ vận hành vào LocalStorage
 */
export function saveOperatingMode(isSim: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.MODE, isSim ? "sim" : "real");
  } catch (err) {
    console.warn("Lỗi lưu operating mode:", err);
  }
}

function generateInitialSeedRecords(): ClassificationRecord[] {
  const brands = [
    { id: "brand_c", name: "Coca-Cola", bin: 1 },
    { id: "brand_a", name: "Pepsi", bin: 2 },
    { id: "brand_b", name: "Red Bull", bin: 3 },
    { id: "brand_d", name: "Aquafina", bin: 3 },
  ];

  const records: ClassificationRecord[] = [];
  const now = new Date();

  // Tạo dữ liệu mẫu ngày Hôm nay (8 sản phẩm)
  for (let i = 8; i >= 1; i--) {
    const b = brands[(i - 1) % brands.length];
    const ts = new Date(now.getTime() - (8 - i) * 15 * 60 * 1000);
    records.push({
      id: `seed_today_${i}`,
      product_id: `#${i}`,
      brand_id: b.id,
      brand_name: b.name,
      confidence: Number((0.94 + ((i * 7) % 5) * 0.01).toFixed(2)),
      target_bin: b.bin,
      actual_bin: b.bin,
      status: "success",
      timestamp: ts.toISOString(),
    });
  }

  // Tạo dữ liệu mẫu ngày Hôm qua (15 sản phẩm)
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  for (let i = 15; i >= 1; i--) {
    const b = brands[(i * 3) % brands.length];
    const ts = new Date(yesterday.getTime() - (15 - i) * 20 * 60 * 1000);
    records.push({
      id: `seed_yest_${i}`,
      product_id: `#${i}`,
      brand_id: b.id,
      brand_name: b.name,
      confidence: Number((0.95 + ((i * 3) % 4) * 0.01).toFixed(2)),
      target_bin: b.bin,
      actual_bin: b.bin,
      status: "success",
      timestamp: ts.toISOString(),
    });
  }

  // Tạo dữ liệu mẫu 2 ngày trước (12 sản phẩm)
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000);
  for (let i = 12; i >= 1; i--) {
    const b = brands[(i * 2) % brands.length];
    const ts = new Date(twoDaysAgo.getTime() - (12 - i) * 25 * 60 * 1000);
    records.push({
      id: `seed_2days_${i}`,
      product_id: `#${i}`,
      brand_id: b.id,
      brand_name: b.name,
      confidence: Number((0.93 + ((i * 5) % 6) * 0.01).toFixed(2)),
      target_bin: b.bin,
      actual_bin: b.bin,
      status: "success",
      timestamp: ts.toISOString(),
    });
  }

  return records;
}

/**
 * Lấy danh sách lịch sử phân loại theo chế độ (Mô phỏng hoặc Thực tế)
 */
export function loadClassificationHistory(isSim: boolean = true): ClassificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const key = isSim ? STORAGE_KEYS.SIM_RECORDS : STORAGE_KEYS.REAL_RECORDS;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Nếu là chế độ Mô phỏng và chưa có key sim mới, kiểm tra key cũ để tương thích ngược
    if (isSim) {
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_RECORDS);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(STORAGE_KEYS.SIM_RECORDS, legacy);
        return parsed;
      }

      // Khởi tạo bộ dữ liệu mẫu mẫu phong phú có sẵn các ngày trước để người dùng trải nghiệm ngay
      const seed = generateInitialSeedRecords();
      localStorage.setItem(STORAGE_KEYS.SIM_RECORDS, JSON.stringify(seed));
      return seed;
    }
    return [];
  } catch (err) {
    console.warn("Lỗi đọc LocalStorage records:", err);
    return [];
  }
}

/**
 * Lưu một bản ghi phân loại vào chế độ tương ứng (Mô phỏng hoặc Thực tế)
 */
export function saveClassificationRecord(
  record: ClassificationRecord,
  isSim: boolean = true
): ClassificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const key = isSim ? STORAGE_KEYS.SIM_RECORDS : STORAGE_KEYS.REAL_RECORDS;
    const existing = loadClassificationHistory(isSim);
    const updated = [record, ...existing].slice(0, MAX_RECORDS);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Lỗi ghi LocalStorage records:", err);
    return [];
  }
}

/**
 * Lấy số lượng từng khay theo chế độ độc lập
 */
export function loadBinCountsLocal(isSim: boolean = true): BinCounts {
  const defaultCounts: BinCounts = { bin1: 0, bin2: 0, bin3: 0 };
  if (typeof window === "undefined") return defaultCounts;

  try {
    const key = isSim ? STORAGE_KEYS.SIM_BIN_COUNTS : STORAGE_KEYS.REAL_BIN_COUNTS;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bin1: Number(parsed.bin1 || 0),
        bin2: Number(parsed.bin2 || 0),
        bin3: Number(parsed.bin3 || 0),
      };
    }

    // Nếu chưa có cache số lượng khay, tự động tính từ lịch sử của chế độ đó
    const records = loadClassificationHistory(isSim);
    const computed: BinCounts = { bin1: 0, bin2: 0, bin3: 0 };
    records.forEach((r) => {
      if (r.actual_bin === 1) computed.bin1++;
      else if (r.actual_bin === 2) computed.bin2++;
      else computed.bin3++;
    });
    localStorage.setItem(key, JSON.stringify(computed));
    return computed;
  } catch (err) {
    console.warn("Lỗi đọc LocalStorage bin counts:", err);
    return defaultCounts;
  }
}

/**
 * Lưu số lượng khay theo chế độ độc lập
 */
export function saveBinCountsLocal(counts: BinCounts, isSim: boolean = true): void {
  if (typeof window === "undefined") return;
  try {
    const key = isSim ? STORAGE_KEYS.SIM_BIN_COUNTS : STORAGE_KEYS.REAL_BIN_COUNTS;
    localStorage.setItem(key, JSON.stringify(counts));
  } catch (err) {
    console.warn("Lỗi ghi LocalStorage bin counts:", err);
  }
}

/**
 * Tăng số lượng khay khi phân loại xong một sản phẩm
 */
export function updateBinCountsLocal(actualBin: number, isSim: boolean = true): BinCounts {
  const current = loadBinCountsLocal(isSim);
  const updated: BinCounts = {
    bin1: actualBin === 1 ? current.bin1 + 1 : current.bin1,
    bin2: actualBin === 2 ? current.bin2 + 1 : current.bin2,
    bin3: actualBin === 3 ? current.bin3 + 1 : current.bin3,
  };
  saveBinCountsLocal(updated, isSim);
  return updated;
}

/**
 * Tính toán số lượng theo từng thương hiệu theo chế độ
 */
export function loadBrandCountsLocal(isSim: boolean = true): Record<string, number> {
  const brCounts: Record<string, number> = {
    brand_c: 0,
    brand_a: 0,
    brand_b: 0,
    brand_d: 0,
  };
  const records = loadClassificationHistory(isSim);
  records.forEach((r) => {
    if (brCounts[r.brand_id] !== undefined) {
      brCounts[r.brand_id]++;
    } else {
      brCounts[r.brand_id] = 1;
    }
  });
  return brCounts;
}

/**
 * Xóa lịch sử phân loại:
 * Nếu isSim truyền vào, chỉ xóa đúng chế độ đó.
 * Nếu không truyền, xóa cả hai chế độ.
 */
export function clearClassificationHistory(isSim?: boolean): void {
  if (typeof window === "undefined") return;

  if (isSim === true || isSim === undefined) {
    localStorage.removeItem(STORAGE_KEYS.SIM_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SIM_BIN_COUNTS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_RECORDS);
  }
  if (isSim === false || isSim === undefined) {
    localStorage.removeItem(STORAGE_KEYS.REAL_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.REAL_BIN_COUNTS);
  }
}

export function saveAlertHistory(alert: AlertEvent): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadAlertHistory();
    if (existing.some((e) => e.event_id === alert.event_id)) return;
    const updated = [alert, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Lỗi ghi LocalStorage alerts:", err);
  }
}

export function loadAlertHistory(): AlertEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Lỗi đọc LocalStorage alerts:", err);
    return [];
  }
}

export function clearAlertHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
}

export function saveSorterConfigLocal(config: SorterConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn("Lỗi lưu LocalStorage config:", err);
  }
}

export function loadSorterConfigLocal(): SorterConfig {
  if (typeof window === "undefined") return DEFAULT_INITIAL_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
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
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
  }
  return {
    ...DEFAULT_INITIAL_CONFIG,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Khôi phục cài đặt gốc toàn diện: Xóa sạch dữ liệu phân loại cả 2 chế độ, cảnh báo và cấu hình
 */
export function factoryResetAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SIM_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.SIM_BIN_COUNTS);
  localStorage.removeItem(STORAGE_KEYS.REAL_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.REAL_BIN_COUNTS);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  localStorage.removeItem(STORAGE_KEYS.MODE);
}

