import { SorterConfig } from "@shared/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/config` : "/api/config";

export async function fetchConfig(): Promise<SorterConfig | null> {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json.config || null;
  } catch (err) {
    console.warn("fetchConfig error:", err);
    return null;
  }
}

export async function saveConfig(config: Partial<SorterConfig>): Promise<{ success: boolean; config?: SorterConfig; error?: string }> {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
  }
}

export async function resetConfig(): Promise<{ success: boolean; config?: SorterConfig; error?: string }> {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
  }
}
