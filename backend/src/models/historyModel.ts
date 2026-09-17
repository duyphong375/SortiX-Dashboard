import { ClassificationRecord } from "@shared/types";

const MAX_SERVER_RECORDS = 1000;
let inMemoryHistory: ClassificationRecord[] = [];

export const HistoryModel = {
  getAll(): ClassificationRecord[] {
    return inMemoryHistory;
  },

  add(record: ClassificationRecord): ClassificationRecord {
    inMemoryHistory.unshift(record);
    if (inMemoryHistory.length > MAX_SERVER_RECORDS) {
      inMemoryHistory.length = MAX_SERVER_RECORDS;
    }
    return record;
  },

  clear(): void {
    inMemoryHistory = [];
  },

  count(): number {
    return inMemoryHistory.length;
  },
};
