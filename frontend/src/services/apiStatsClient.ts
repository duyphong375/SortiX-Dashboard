const BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/stats` : "/api/stats";

export interface SystemStatsResponse {
  totalSorted: number;
  successCount: number;
  successRate: number;
  divertedCount: number;
  rejectedCount: number;
  jammedCount: number;
  binBreakdown: { bin1: number; bin2: number; bin3: number };
  brandBreakdown: Record<string, number>;
}

export async function fetchStats(): Promise<SystemStatsResponse | null> {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json.stats || null;
  } catch (err) {
    console.warn("fetchStats error:", err);
    return null;
  }
}
