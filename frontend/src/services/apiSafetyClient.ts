import { EmergencyStopPayload, JamDetectedPayload, BinFullPayload, TemperatureWarningPayload, DeviceOfflinePayload, ShiftSummaryPayload, SafetyStatusResponse, NotificationRecord, UnlockSystemInput } from "@shared/types";

export const ApiSafetyClient = {
  async getStatus(): Promise<SafetyStatusResponse> {
    try {
      const res = await fetch("/api/safety/status");
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      status: "OPERATIONAL",
      is_locked: false,
      unprocessed_count: 0,
    };
  },

  async triggerEmergencyStop(payload: EmergencyStopPayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/estop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã kích hoạt E-Stop", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi kích hoạt E-Stop";
      return { success: false, message: msg };
    }
  },

  async triggerJamAlert(payload: JamDetectedPayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/jam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã ghi nhận sự cố kẹt phôi", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi báo kẹt phôi";
      return { success: false, message: msg };
    }
  },

  async triggerBinFullAlert(payload: BinFullPayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/bin-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã ghi nhận cảnh báo đầy khay", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi báo đầy khay";
      return { success: false, message: msg };
    }
  },

  async triggerTemperatureWarningAlert(payload: TemperatureWarningPayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/temp-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã ghi nhận cảnh báo quá nhiệt", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi báo quá nhiệt";
      return { success: false, message: msg };
    }
  },

  async triggerDeviceOfflineAlert(payload: DeviceOfflinePayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/device-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã ghi nhận sự cố mất kết nối", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi báo mất kết nối";
      return { success: false, message: msg };
    }
  },

  async sendHeartbeat(deviceId = "ESP32_MAIN_CONTROLLER"): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/safety/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, timestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Heartbeat sent" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi gửi heartbeat";
      return { success: false, message: msg };
    }
  },

  async triggerShiftSummary(payload: ShiftSummaryPayload): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await fetch("/api/safety/shift-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || "Đã ghi nhận báo cáo 1 ngày làm việc", data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi ghi nhận báo cáo 1 ngày làm việc";
      return { success: false, message: msg };
    }
  },

  async unlockSystem(
    adminInfo: { userId?: string; role?: string },
    input?: UnlockSystemInput
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminInfo.userId) headers["X-User-Id"] = adminInfo.userId;
      if (adminInfo.role) headers["X-User-Role"] = adminInfo.role;

      const res = await fetch("/api/safety/unlock", {
        method: "POST",
        headers,
        body: JSON.stringify(input || {}),
      });

      const data = await res.json();
      return {
        success: res.ok && data.success,
        message: data.message || (res.ok ? "Đã mở khóa an toàn thành công" : "Mở khóa thất bại"),
        data: data.data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng khi mở khóa";
      return { success: false, message: msg };
    }
  },

  async getNotifications(status?: string): Promise<NotificationRecord[]> {
    try {
      const url = status ? `/api/notifications?status=${encodeURIComponent(status)}` : "/api/notifications";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },
};
