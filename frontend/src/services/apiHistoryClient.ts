import { ClassificationRecord } from "@shared/types";
import { fetchWithTimeout } from "./apiFetch";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/history` : "/api/history";

export interface QueryHistoryOptions {
  limit?: number;
  offset?: number;
  brand?: string;
  bin?: number;
  status?: string;
  date?: string;
}

export async function fetchHistory(params: QueryHistoryOptions = {}): Promise<{
  data: ClassificationRecord[];
  total: number;
  limit: number;
  offset: number;
}> {
  try {
    const url = new URL(BASE_URL, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.offset) url.searchParams.set("offset", String(params.offset));
    if (params.brand) url.searchParams.set("brand", params.brand);
    if (params.bin) url.searchParams.set("bin", String(params.bin));
    if (params.status) url.searchParams.set("status", params.status);
    if (params.date) url.searchParams.set("date", params.date);

    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) return { data: [], total: 0, limit: params.limit || 50, offset: params.offset || 0 };
    const json = await res.json();
    return {
      data: json.data || [],
      total: json.total || 0,
      limit: json.limit || params.limit || 50,
      offset: json.offset || params.offset || 0,
    };
  } catch (err) {
    console.warn("fetchHistory error:", err);
    return { data: [], total: 0, limit: params.limit || 50, offset: params.offset || 0 };
  }
}

export async function saveRecord(record: ClassificationRecord): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchWithTimeout(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
  }
}

export async function clearServerHistory(): Promise<{ success: boolean }> {
  try {
    const res = await fetchWithTimeout(BASE_URL, { method: "DELETE" });
    return await res.json();
  } catch (err) {
    console.warn("clearServerHistory error:", err);
    return { success: false };
  }
}
