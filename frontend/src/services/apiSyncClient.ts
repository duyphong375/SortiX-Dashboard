import { ClassificationRecord, VisualItem } from "@shared/types";
import { fetchWithTimeout } from "./apiFetch";
import type { DashboardSyncState, BinCounts } from "./syncService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/sync`
  : "/api/sync";

function getClientId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = sessionStorage.getItem("sortix_client_id");
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem("sortix_client_id", id);
    }
    return id;
  } catch {
    return `client_${Date.now()}`;
  }
}

export const myClientId = getClientId();

export async function fetchSyncData(): Promise<{
  success: boolean;
  state?: DashboardSyncState;
  history?: ClassificationRecord[];
}> {
  try {
    const url = new URL(BASE_URL, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const res = await fetchWithTimeout(url.toString(), { method: "GET" });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (err) {
    console.warn("fetchSyncData error:", err);
    return { success: false };
  }
}

export async function updateSyncState(state: Partial<DashboardSyncState>): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "update_state",
        state,
        senderId: myClientId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("updateSyncState error:", err);
    return false;
  }
}

export async function syncRecordsToServer(
  records: ClassificationRecord[],
  binCounts?: BinCounts
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "sync_records",
        records,
        binCounts,
        senderId: myClientId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("syncRecordsToServer error:", err);
    return false;
  }
}

export async function syncClearHistoryToServer(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "clear_history",
        senderId: myClientId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("syncClearHistoryToServer error:", err);
    return false;
  }
}

export async function syncSpawnItemToServer(item: VisualItem): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "spawn_item",
        item,
        senderId: myClientId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("syncSpawnItemToServer error:", err);
    return false;
  }
}
