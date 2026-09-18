import mqtt, { MqttClient } from "mqtt";
import { DEFAULT_MQTT_TOPICS } from "@shared/constants";
import { EmergencyStopPayloadSchema, JamDetectedPayloadSchema, BinFullPayloadSchema, TemperatureWarningPayloadSchema, DeviceOfflinePayloadSchema, HeartbeatPayloadSchema } from "@shared/schemas";
import { SafetyService } from "./safetyService";

let client: MqttClient | null = null;
let isConnected = false;
let lastHeartbeatTimestamp = 0;
let isDeviceOffline = false;
let watchdogInterval: NodeJS.Timeout | null = null;
let isMqttDisconnectedAlertTriggered = false;
let disconnectTimeoutTimer: NodeJS.Timeout | null = null;
let reconnectAttemptCount = 0;

export function initBackendMQTT() {
  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.emqx.io:1883";
  const estopTopic = DEFAULT_MQTT_TOPICS.ESTOP || "conveyor/safety/estop";
  const jamTopic = DEFAULT_MQTT_TOPICS.JAM || "conveyor/sensor/jam";
  const binStatusTopic = DEFAULT_MQTT_TOPICS.BIN_STATUS || "conveyor/storage/bin_status";
  const tempTopic = DEFAULT_MQTT_TOPICS.TEMP || "conveyor/telemetry/temp";
  const heartbeatTopic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";

  try {
    console.log(`[Backend MQTT] Đang kết nối tới broker: ${brokerUrl}...`);
    client = mqtt.connect(brokerUrl, {
      clientId: `sortix_backend_${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    client.on("connect", () => {
      isConnected = true;
      lastHeartbeatTimestamp = Date.now();
      if (disconnectTimeoutTimer) {
        clearTimeout(disconnectTimeoutTimer);
        disconnectTimeoutTimer = null;
      }
      if (isMqttDisconnectedAlertTriggered) {
        isMqttDisconnectedAlertTriggered = false;
        reconnectAttemptCount = 0;
        SafetyService.recoverMqttConnected(brokerUrl);
      }
      console.log(`[Backend MQTT] Đã kết nối thành công! Đang lắng nghe topics: ${estopTopic}, ${jamTopic}, ${binStatusTopic}, ${tempTopic}, ${heartbeatTopic}`);

      client?.subscribe([estopTopic, jamTopic, binStatusTopic, tempTopic, heartbeatTopic], (err) => {
        if (err) {
          console.error(`[Backend MQTT] Lỗi subscribe topics an toàn & telemetry:`, err);
        } else {
          console.log(`[Backend MQTT] Đã subscribe thành công các topics: ${estopTopic}, ${jamTopic}, ${binStatusTopic}, ${tempTopic}, ${heartbeatTopic}`);
        }
      });
    });

    client.on("message", (topic, message) => {
      if (topic === estopTopic) {
        try {
          const raw = JSON.parse(message.toString());
          const validated = EmergencyStopPayloadSchema.safeParse(raw);
          if (validated.success) {
            console.warn(`[Backend MQTT] Nhận tín hiệu Dừng Khẩn Cấp từ phần cứng qua topic ${topic}:`, validated.data);
            SafetyService.triggerEmergencyStop(validated.data);
          } else {
            console.warn(`[Backend MQTT] Payload E-Stop không hợp lệ:`, validated.error.format());
          }
        } catch (err) {
          console.error(`[Backend MQTT] Lỗi giải mã message trên ${topic}:`, err);
        }
      } else if (topic === jamTopic) {
        try {
          const raw = JSON.parse(message.toString());
          const validated = JamDetectedPayloadSchema.safeParse(raw);
          if (validated.success) {
            console.warn(`[Backend MQTT] Nhận tín hiệu KẸT PHÔI qua topic ${topic}:`, validated.data);
            SafetyService.triggerJamAlert(validated.data);
          } else {
            console.warn(`[Backend MQTT] Payload Kẹt Phôi không hợp lệ:`, validated.error.format());
          }
        } catch (err) {
          console.error(`[Backend MQTT] Lỗi giải mã message trên ${topic}:`, err);
        }
      } else if (topic === binStatusTopic) {
        try {
          const raw = JSON.parse(message.toString());
          const validated = BinFullPayloadSchema.safeParse(raw);
          if (validated.success) {
            console.warn(`[Backend MQTT] Nhận tín hiệu ĐẦY KHAY qua topic ${topic}:`, validated.data);
            SafetyService.triggerBinFull(validated.data);
          } else {
            console.warn(`[Backend MQTT] Payload Đầy Khay không hợp lệ:`, validated.error.format());
          }
        } catch (err) {
          console.error(`[Backend MQTT] Lỗi giải mã message trên ${topic}:`, err);
        }
      } else if (topic === tempTopic) {
        try {
          const raw = JSON.parse(message.toString());
          const validated = TemperatureWarningPayloadSchema.safeParse(raw);
          if (validated.success) {
            console.warn(`[Backend MQTT] Nhận tín hiệu CẢNH BÁO NHIỆT ĐỘ qua topic ${topic}:`, validated.data);
            if (validated.data.current_temp > validated.data.threshold_temp) {
              SafetyService.triggerTemperatureWarning(validated.data);
            }
          } else {
            console.warn(`[Backend MQTT] Payload Cảnh Báo Nhiệt Độ không hợp lệ:`, validated.error.format());
          }
        } catch (err) {
          console.error(`[Backend MQTT] Lỗi giải mã message trên ${topic}:`, err);
        }
      } else if (topic === heartbeatTopic) {
        try {
          lastHeartbeatTimestamp = Date.now();
          const raw = JSON.parse(message.toString());
          const validated = HeartbeatPayloadSchema.safeParse(raw);
          const deviceId = validated.success ? validated.data.device_id : "ESP32_MAIN_CONTROLLER";

          if (isDeviceOffline) {
            isDeviceOffline = false;
            console.log(`[Backend MQTT] 🟢 Đã nhận lại tín hiệu Heartbeat từ ${deviceId}! Phục hồi trạng thái Online.`);
            SafetyService.recoverDeviceOnline(deviceId);
          }
        } catch (err) {
          lastHeartbeatTimestamp = Date.now();
          if (isDeviceOffline) {
            isDeviceOffline = false;
            SafetyService.recoverDeviceOnline("ESP32_MAIN_CONTROLLER");
          }
        }
      }
    });

    // Thiết lập Watchdog kiểm tra Heartbeat định kỳ mỗi giây (Timeout 6 giây)
    if (watchdogInterval) clearInterval(watchdogInterval);
    watchdogInterval = setInterval(() => {
      if (isConnected && lastHeartbeatTimestamp > 0 && !isDeviceOffline) {
        const elapsedMs = Date.now() - lastHeartbeatTimestamp;
        if (elapsedMs > 6000) {
          isDeviceOffline = true;
          const diffSec = Math.round(elapsedMs / 1000);
          console.error(`[Backend MQTT Watchdog] ❌ Quá 6s không nhận được Heartbeat (Đã qua ${diffSec}s)! Kích hoạt cảnh báo device_offline.`);
          SafetyService.triggerDeviceOffline({
            event: "device_offline",
            device_id: "ESP32_MAIN_CONTROLLER",
            ip_address: "192.168.1.105",
            last_seen: `${diffSec} giây trước`,
            mode: "realtime",
          });
        }
      }
    }, 1000);

    client.on("error", (err) => {
      console.warn(`[Backend MQTT] Cảnh báo kết nối:`, err.message);
    });

    client.on("close", () => {
      isConnected = false;
      if (!disconnectTimeoutTimer && !isMqttDisconnectedAlertTriggered) {
        disconnectTimeoutTimer = setTimeout(() => {
          if (!isConnected) {
            isMqttDisconnectedAlertTriggered = true;
            reconnectAttemptCount++;
            SafetyService.triggerMqttDisconnected({
              event: "mqtt_disconnected",
              broker_url: brokerUrl,
              disconnected_duration_seconds: 5,
              reconnect_attempt: reconnectAttemptCount,
              mode: "realtime",
            });
          }
        }, 5000);
      }
    });


    // Cài đặt hook khi Admin mở khóa hệ thống -> gửi thông điệp release qua MQTT
    SafetyService.setOnUnlockPublishHook(() => {
      if (client && isConnected) {
        const releasePayload = JSON.stringify({
          command: "ESTOP_RELEASE",
          timestamp: new Date().toISOString(),
          released_by: "admin",
        });
        client.publish(DEFAULT_MQTT_TOPICS.ESTOP_RELEASE, releasePayload);
        client.publish(DEFAULT_MQTT_TOPICS.CONTROL, releasePayload);
        console.log(`[Backend MQTT] Đã xuất bản lệnh mở khóa ESTOP_RELEASE tới phần cứng qua MQTT.`);
      }
    });
  } catch (err) {
    console.error("[Backend MQTT] Khởi tạo MQTT client thất bại:", err);
  }
}

export function publishEstopSimulation(payload: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.ESTOP || "conveyor/safety/estop";
    client.publish(topic, JSON.stringify(payload));
  }
}

export function publishJamSimulation(payload: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.JAM || "conveyor/sensor/jam";
    client.publish(topic, JSON.stringify(payload));
  }
}

export function publishBinFullSimulation(payload: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.BIN_STATUS || "conveyor/storage/bin_status";
    client.publish(topic, JSON.stringify(payload));
  }
}

export function publishTemperatureWarningSimulation(payload: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.TEMP || "conveyor/telemetry/temp";
    client.publish(topic, JSON.stringify(payload));
  }
}

export function publishHeartbeatSimulation(payload?: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";
    const data = payload || {
      device_id: "ESP32_MAIN_CONTROLLER",
      ip_address: "192.168.1.105",
      timestamp: new Date().toISOString(),
    };
    client.publish(topic, JSON.stringify(data));
  }
}

export function publishDeviceOfflineSimulation(payload: unknown) {
  if (client && isConnected) {
    const topic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";
    client.publish(topic, JSON.stringify(payload));
  }
}

export function publishMqttDisconnectedSimulation(payload?: unknown) {
  const data = (payload as any) || {
    event: "mqtt_disconnected",
    broker_url: process.env.MQTT_BROKER_URL || "mqtt://broker.emqx.io:1883",
    disconnected_duration_seconds: 5,
    reconnect_attempt: 1,
    mode: "simulation",
  };
  SafetyService.triggerMqttDisconnected(data);
}



