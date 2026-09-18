import { ClassificationRecord, VisualItem } from "@shared/types";
import { HistoryModel } from "../models/historyModel";
import { SSEService } from "./sseService";

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

export interface DashboardSyncState {
  mode: "sim" | "real";
  isRunning: boolean;
  speed: number;
  binCounts: BinCounts;
  binCapacities: BinCapacities;
  brandCounts: Record<string, number>;
  updatedAt: string;
}

let currentState: DashboardSyncState = {
  mode: "sim",
  isRunning: false,
  speed: 50,
  binCounts: { bin1: 0, bin2: 0, bin3: 0 },
  binCapacities: { bin1: 50, bin2: 50, bin3: 50 },
  brandCounts: {
    brand_c: 0,
    brand_a: 0,
    brand_b: 0,
    brand_d: 0,
  },
  updatedAt: new Date().toISOString(),
};

export const SyncService = {
  getState(): DashboardSyncState {
    return { ...currentState };
  },

  updateState(partial: Partial<DashboardSyncState>, senderId?: string): DashboardSyncState {
    currentState = {
      ...currentState,
      ...partial,
      binCounts: partial.binCounts ? { ...currentState.binCounts, ...partial.binCounts } : currentState.binCounts,
      binCapacities: partial.binCapacities ? { ...currentState.binCapacities, ...partial.binCapacities } : currentState.binCapacities,
      brandCounts: partial.brandCounts ? { ...currentState.brandCounts, ...partial.brandCounts } : currentState.brandCounts,
      updatedAt: new Date().toISOString(),
    };

    SSEService.broadcast("state_sync", {
      state: currentState,
      senderId,
    });

    return { ...currentState };
  },

  syncRecords(records: ClassificationRecord[], binCounts?: BinCounts, senderId?: string): void {
    if (Array.isArray(records) && records.length > 0) {
      records.forEach((record) => {
        HistoryModel.add(record);
      });
    }

    if (binCounts) {
      currentState.binCounts = { ...binCounts };
    }

    currentState.updatedAt = new Date().toISOString();

    SSEService.broadcast("history_sync", {
      records,
      binCounts: currentState.binCounts,
      senderId,
    });
  },

  clearHistory(senderId?: string): void {
    HistoryModel.clear();
    currentState.binCounts = { bin1: 0, bin2: 0, bin3: 0 };
    currentState.brandCounts = {
      brand_c: 0,
      brand_a: 0,
      brand_b: 0,
      brand_d: 0,
    };
    currentState.updatedAt = new Date().toISOString();

    SSEService.broadcast("history_cleared", {
      binCounts: currentState.binCounts,
      senderId,
    });
  },

  spawnItem(item: VisualItem, senderId?: string): void {
    SSEService.broadcast("spawn_item", {
      item,
      senderId,
    });
  },
};
