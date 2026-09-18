import fs from "node:fs";
import path from "node:path";
import { NotificationRecord, NotificationStatus } from "@shared/types";

let notificationsStore: NotificationRecord[] = [];

function resolveStorageFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), "..", "data", "notifications.json"),
    path.join(process.cwd(), "data", "notifications.json"),
    path.join(process.cwd(), "notifications.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  for (const p of possiblePaths) {
    const dir = path.dirname(p);
    if (fs.existsSync(dir)) {
      return p;
    }
  }

  return path.join(process.cwd(), "data", "notifications.json");
}

function loadFromFile(): void {
  try {
    const filePath = resolveStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          notificationsStore = parsed;
          return;
        }
      }
    }
  } catch (err) {
    console.warn("[NotificationModel] Không thể tải dữ liệu từ file:", err);
  }
  notificationsStore = [];
}

function saveToFile(): void {
  try {
    const filePath = resolveStorageFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(notificationsStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[NotificationModel] Lỗi lưu file dữ liệu:", err);
  }
}

// Tự động khởi tạo dữ liệu
loadFromFile();

export const NotificationModel = {
  getAll(): NotificationRecord[] {
    return [...notificationsStore];
  },

  getUnprocessed(): NotificationRecord[] {
    return notificationsStore.filter((n) => n.status === "unprocessed");
  },

  findById(id: string): NotificationRecord | undefined {
    return notificationsStore.find((n) => n.id === id);
  },

  add(record: Omit<NotificationRecord, "id"> & { id?: string }): NotificationRecord {
    const newRecord: NotificationRecord = {
      ...record,
      id: record.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };

    notificationsStore.unshift(newRecord);
    // Giữ tối đa 1000 thông báo gần nhất
    if (notificationsStore.length > 1000) {
      notificationsStore = notificationsStore.slice(0, 1000);
    }
    saveToFile();
    return newRecord;
  },

  resolve(id: string, resolvedBy: string): NotificationRecord | null {
    const target = notificationsStore.find((n) => n.id === id);
    if (!target) return null;

    target.status = "resolved";
    target.resolved_at = new Date().toISOString();
    target.resolved_by = resolvedBy;
    saveToFile();
    return target;
  },

  resolveAllActive(resolvedBy: string): number {
    let count = 0;
    const now = new Date().toISOString();
    for (const n of notificationsStore) {
      if (n.status === "unprocessed" || n.status === "acknowledged") {
        n.status = "resolved";
        n.resolved_at = now;
        n.resolved_by = resolvedBy;
        count++;
      }
    }
    if (count > 0) {
      saveToFile();
    }
    return count;
  },

  clear(): void {
    notificationsStore = [];
    saveToFile();
  },
};
