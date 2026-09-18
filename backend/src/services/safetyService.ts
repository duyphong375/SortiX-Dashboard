import { EmergencyStopPayload, JamDetectedPayload, BinFullPayload, TemperatureWarningPayload, DeviceOfflinePayload, ShiftSummaryPayload, MqttDisconnectedPayload, SystemSafetyStatus, NotificationRecord, SafetyStatusResponse } from "@shared/types";
import { NotificationModel } from "../models/notificationModel";
import { SSEService } from "./sseService";


let currentStatus: SystemSafetyStatus = "OPERATIONAL";
let activeIncident: EmergencyStopPayload | null = null;
let lastNotification: NotificationRecord | null = null;
let lastUnlockedAt: number = 0;

// Callback khi mở khóa để publish MQTT (nếu có)
let onUnlockPublishHook: (() => void) | null = null;

export const SafetyService = {
  getStatus(): SafetyStatusResponse {
    const unprocessedCount = NotificationModel.getUnprocessed().length;
    return {
      success: true,
      status: currentStatus,
      is_locked: currentStatus !== "OPERATIONAL",
      active_incident: activeIncident,
      last_notification: lastNotification,
      unprocessed_count: unprocessedCount,
    };
  },

  isLocked(): boolean {
    return currentStatus !== "OPERATIONAL";
  },

  triggerEmergencyStop(payload: EmergencyStopPayload): {
    success: boolean;
    notification: NotificationRecord;
    status: SystemSafetyStatus;
  } {
    // 1. Nếu vừa mới mở khóa trong vòng 2.5s -> bỏ qua gói tin trễ từ broker
    if (Date.now() - lastUnlockedAt < 2500) {
      console.log("[SafetyService] Bỏ qua tín hiệu E-Stop trong thời gian ân hạn 2.5s sau khi mở khóa");
      return {
        success: true,
        notification: lastNotification || ({} as any),
        status: currentStatus,
      };
    }

    // 2. Nếu hệ thống đã bị khóa và sự cố tương tự đang diễn ra -> không spam DB & SSE
    if (currentStatus === "SYSTEM_LOCKED" && lastNotification) {
      return {
        success: true,
        notification: lastNotification,
        status: currentStatus,
      };
    }

    currentStatus = "SYSTEM_LOCKED";
    activeIncident = payload;

    const station = payload.station_id || "STATION_01";
    const source = payload.triggered_by || "Physical E-Stop Button #1";
    const description = `[NGUY HIỂM] NÚT DỪNG KHẨN CẤP ĐÃ ĐƯỢC KÍCH HOẠT TẠI TRẠM ${station.replace(/[^0-9]/g, "") || "01"}! BĂNG CHUYỀN ĐÃ NGẮT TOÀN BỘ.`;

    const record = NotificationModel.add({
      event: "emergency_stop",
      severity: "critical",
      station_id: station,
      triggered_by: source,
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.warn(`[SAFETY ALERT] 🚨 DỪNG KHẨN CẤP ĐÃ ĐƯỢC KÍCH HOẠT TẠI ${station} (${source})!`);

    // Gửi sự kiện tức thời tới toàn bộ Dashboard clients qua SSE
    SSEService.broadcast("emergency_stop", {
      event: "emergency_stop",
      payload,
      notification: record,
      status: currentStatus,
    });

    return {
      success: true,
      notification: record,
      status: currentStatus,
    };
  },

  triggerJamAlert(payload: JamDetectedPayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const section = payload.section || "Conveyor_Belt_Zone_A";
    const sensorId = payload.sensor_id || "OPTICAL_JAM_02";
    const duration = payload.duration_seconds || 5;
    const description = `[CẢNH BÁO KẸT PHÔI] Phát hiện tắc nghẽn sản phẩm tại Khu vực ${section} (Cảm biến ${sensorId} che khuất liên tục ${duration}s). Băng tải đã tự động giảm tốc/dừng.`;

    const record = NotificationModel.add({
      event: "jam_detected",
      severity: "critical",
      station_id: section,
      triggered_by: sensorId,
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.warn(`[JAM ALERT] ⚠️ KẸT PHÔI TẠI ${section} (${sensorId}) trong ${duration}s!`);

    SSEService.broadcast("jam_detected", {
      event: "jam_detected",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  triggerBinFull(payload: BinFullPayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const binId = payload.bin_id || "BIN_RED_01";
    const currentCount = payload.current_count ?? 50;
    const maxCapacity = payload.max_capacity ?? 50;

    let binLabel = "Đỏ (#01)";
    if (binId.toUpperCase().includes("BLUE") || binId.includes("02")) {
      binLabel = "Xanh (#02)";
    } else if (binId.toUpperCase().includes("DEFAULT") || binId.includes("03")) {
      binLabel = "Mặc định (#03)";
    }

    const description = `[ĐẦY KHAY CHỨA] Khay phân loại sản phẩm ${binLabel} đã đạt giới hạn ${currentCount}/${maxCapacity} cái. Vui lòng thay thế khay rỗng mới`;

    const record = NotificationModel.add({
      event: "bin_full",
      severity: "warning",
      station_id: binId,
      triggered_by: `STORAGE_${binId}`,
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.warn(`[BIN FULL WARNING] 📦 KHAY ĐẦY TẠI ${binId} (${currentCount}/${maxCapacity} SP)!`);

    SSEService.broadcast("bin_full", {
      event: "bin_full",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  triggerTemperatureWarning(payload: TemperatureWarningPayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const deviceName = payload.device_name || "Main_Drive_Motor / Edge_AI_Box";
    const currentTemp = payload.current_temp ?? 78.5;
    const thresholdTemp = payload.threshold_temp ?? 75.0;
    const unit = payload.unit || "°C";

    let deviceLabel = "Động cơ truyền động chính";
    if (deviceName.includes("Main_Drive_Motor") || deviceName.includes("Motor") || deviceName.includes("Động cơ")) {
      deviceLabel = "Động cơ truyền động chính";
    } else if (deviceName.includes("Edge_AI") || deviceName.includes("CPU")) {
      deviceLabel = "CPU máy chủ Edge AI";
    }

    const description = `[QUÁ NHIỆT] ${deviceLabel} đang ở mức ${currentTemp}${unit} (Ngưỡng an toàn: ${thresholdTemp}${unit}). Khuyến nghị kiểm tra quạt tản nhiệt hoặc giảm tải`;

    const record = NotificationModel.add({
      event: "temperature_warning",
      severity: "warning",
      station_id: deviceName,
      triggered_by: "TEMP_SENSOR_TELEMETRY",
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.warn(`[TEMP WARNING] 🔥 ${deviceLabel} QUÁ NHIỆT: ${currentTemp}${unit} > ${thresholdTemp}${unit}!`);

    SSEService.broadcast("temperature_warning", {
      event: "temperature_warning",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  triggerDeviceOffline(payload: DeviceOfflinePayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const deviceId = payload.device_id || "ESP32_MAIN_CONTROLLER";
    const ipAddress = payload.ip_address || "192.168.1.105";
    const lastSeen = payload.last_seen || "15 giây trước";

    const description = `[MẤT KẾT NỐI THIẾT BỊ] Vi điều khiển trung tâm (ESP32) đã ngoại tuyến! Dữ liệu cảm biến thời gian thực bị ngắt`;

    const record = NotificationModel.add({
      event: "device_offline",
      severity: "error",
      station_id: deviceId,
      triggered_by: "HEARTBEAT_WATCHDOG",
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.error(`[DEVICE OFFLINE] ❌ Thiết bị ${deviceId} (${ipAddress}) đã ngoại tuyến! Last seen: ${lastSeen}`);

    SSEService.broadcast("device_offline", {
      event: "device_offline",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  recoverDeviceOnline(deviceId: string = "ESP32_MAIN_CONTROLLER"): {
    success: boolean;
    message: string;
  } {
    console.log(`[DEVICE ONLINE] ✅ Thiết bị ${deviceId} đã kết nối trực tuyến trở lại.`);

    SSEService.broadcast("device_online", {
      event: "device_online",
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Thiết bị ${deviceId} đã trực tuyến thành công`,
    };
  },

  triggerShiftSummary(payload: ShiftSummaryPayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const shiftName = payload.shift_name || "Báo cáo 1 ngày làm việc";
    const total = payload.total_products ?? 1250;
    const good = payload.sorted_good ?? 1180;
    const defect = payload.sorted_defect ?? 70;
    const accuracy = payload.accuracy_rate || `${((good / Math.max(total, 1)) * 100).toFixed(1)}%`;

    const description = `[BÁO CÁO 1 NGÀY LÀM VIỆC] ${shiftName}: Tổng ${total.toLocaleString("vi-VN")} sản phẩm (Đạt ${accuracy}). Nhấn để xem chi tiết`;

    const record = NotificationModel.add({
      event: "shift_summary",
      severity: "info",
      station_id: "SHIFT_SUPERVISOR",
      triggered_by: "SHIFT_END_TRIGGER",
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.log(`[SHIFT SUMMARY] 📋 ${shiftName}: ${good}/${total} SP đạt (${accuracy}), ${defect} lỗi, ${payload.emergency_stops_count ?? 0} E-Stops.`);

    SSEService.broadcast("shift_summary", {
      event: "shift_summary",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  triggerMqttDisconnected(payload: MqttDisconnectedPayload): {
    success: boolean;
    notification: NotificationRecord;
  } {
    const attempt = payload.reconnect_attempt || 1;
    const duration = payload.disconnected_duration_seconds || 5;
    const brokerUrl = payload.broker_url || "wss://broker.emqx.io:8084/mqtt";
    const description = `[MẤT KẾT NỐI MẠNG] Mất liên lạc với MQTT Broker! Đang thử kết nối lại lần thứ ${attempt} (Reconnecting...)`;

    const record = NotificationModel.add({
      event: "mqtt_disconnected",
      severity: "critical",
      station_id: "MQTT_BROKER",
      triggered_by: "TCP_SOCKET_WATCHDOG",
      description,
      timestamp: payload.timestamp || new Date().toISOString(),
      mode: payload.mode || "realtime",
      status: "unprocessed",
    });

    lastNotification = record;

    console.error(`[MQTT DISCONNECTED] 🔴 Mất kết nối MQTT Broker (${brokerUrl}) quá ${duration}s! Đang thử lại lần ${attempt}.`);

    SSEService.broadcast("mqtt_disconnected", {
      event: "mqtt_disconnected",
      payload,
      notification: record,
    });

    return {
      success: true,
      notification: record,
    };
  },

  recoverMqttConnected(brokerUrl?: string): {
    success: boolean;
    message: string;
    notification: NotificationRecord;
  } {
    const broker = brokerUrl || "wss://broker.emqx.io:8084/mqtt";
    const description = `[ĐÃ PHỤC HỒI] Kết nối MQTT Broker thành công`;

    const record = NotificationModel.add({
      event: "mqtt_connected",
      severity: "info",
      station_id: "MQTT_BROKER",
      triggered_by: "AUTO_RECONNECT_SERVICE",
      description,
      timestamp: new Date().toISOString(),
      mode: "realtime",
      status: "resolved",
    });

    console.log(`[MQTT CONNECTED] 🟢 Đã phục hồi kết nối tới MQTT Broker (${broker}) thành công!`);

    SSEService.broadcast("mqtt_connected", {
      event: "mqtt_connected",
      message: description,
      timestamp: new Date().toISOString(),
      notification: record,
    });

    return {
      success: true,
      message: description,
      notification: record,
    };
  },


  unlockSystem(adminUsername: string, note?: string): {
    success: boolean;
    message: string;
    status: SystemSafetyStatus;
    resolvedCount: number;
  } {
    lastUnlockedAt = Date.now();
    currentStatus = "OPERATIONAL";
    activeIncident = null;

    const resolvedCount = NotificationModel.resolveAllActive(adminUsername);

    console.log(`[SAFETY RESTORED] ✅ Hệ thống đã được mở khóa an toàn bởi: ${adminUsername} (ghi chú: ${note || "Không có"})`);

    // Gửi thông báo tới toàn bộ clients qua SSE
    SSEService.broadcast("system_unlocked", {
      event: "system_unlocked",
      unlocked_by: adminUsername,
      note,
      status: currentStatus,
      timestamp: new Date().toISOString(),
    });

    // Gọi hook để gửi lệnh MQTT giải phóng E-Stop tới phần cứng
    if (onUnlockPublishHook) {
      try {
        onUnlockPublishHook();
      } catch (err) {
        console.error("[SafetyService] Lỗi khi gọi unlock MQTT hook:", err);
      }
    }

    return {
      success: true,
      message: "Hệ thống đã được mở khóa an toàn thành công!",
      status: currentStatus,
      resolvedCount,
    };
  },

  setOnUnlockPublishHook(hook: (() => void) | null) {
    onUnlockPublishHook = hook;
  },

  resetForTesting() {
    currentStatus = "OPERATIONAL";
    activeIncident = null;
    lastNotification = null;
    lastUnlockedAt = 0;
  },
};
