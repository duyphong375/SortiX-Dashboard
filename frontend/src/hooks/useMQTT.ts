"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SorterMQTTService } from "@/lib/mqttClient";
import { SorterConfig, VisionDetection, EmergencyStopPayload, JamDetectedPayload, BinFullPayload, TemperatureWarningPayload, DeviceOfflinePayload, MqttDisconnectedPayload } from "@/lib/types";
import { DEFAULT_MQTT_TOPICS } from "@shared/constants";
import { cleanVisionPayload } from "@/lib/dataProcessor";

export interface UseMQTTOptions {
  isClient: boolean;
  onVisionDetection?: (detection: VisionDetection) => void;
  onTelemetryPayload?: (payload: unknown) => void;
  onConfigStatusApplied?: (version: number) => void;
  onConfigStatusRejected?: (reason: string) => void;
  onEmergencyStop?: (payload: EmergencyStopPayload) => void;
  onJamDetected?: (payload: JamDetectedPayload) => void;
  onBinFull?: (payload: BinFullPayload) => void;
  onTemperatureWarning?: (payload: TemperatureWarningPayload) => void;
  onHeartbeat?: (data: unknown) => void;
  onDeviceOffline?: (payload: DeviceOfflinePayload) => void;
  onMqttDisconnected?: (payload: MqttDisconnectedPayload) => void;
  onMqttReconnected?: () => void;
}

export function useMQTT({
  isClient,
  onVisionDetection,
  onTelemetryPayload,
  onConfigStatusApplied,
  onConfigStatusRejected,
  onEmergencyStop,
  onJamDetected,
  onBinFull,
  onTemperatureWarning,
  onHeartbeat,
  onDeviceOffline,
  onMqttDisconnected,
  onMqttReconnected,
}: UseMQTTOptions) {
  const [mqttStatus, setMqttStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [pingMs, setPingMs] = useState<number>(24);
  const [configStatusMsg, setConfigStatusMsg] = useState<string>("");

  // Cảnh báo mất kết nối MQTT Broker > 5s và Auto-reconnect
  const [isMqttAlertActive, setIsMqttAlertActive] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [mqttDisconnectedIncident, setMqttDisconnectedIncident] = useState<MqttDisconnectedPayload | null>(null);
  const [isSimulatedDisconnect, setIsSimulatedDisconnect] = useState<boolean>(false);

  const mqttRef = useRef<SorterMQTTService | null>(null);

  // Callbacks ref to prevent stale closures
  const callbacksRef = useRef({
    onVisionDetection,
    onTelemetryPayload,
    onConfigStatusApplied,
    onConfigStatusRejected,
    onEmergencyStop,
    onJamDetected,
    onBinFull,
    onTemperatureWarning,
    onHeartbeat,
    onDeviceOffline,
    onMqttDisconnected,
    onMqttReconnected,
  });
  callbacksRef.current = {
    onVisionDetection,
    onTelemetryPayload,
    onConfigStatusApplied,
    onConfigStatusRejected,
    onEmergencyStop,
    onJamDetected,
    onBinFull,
    onTemperatureWarning,
    onHeartbeat,
    onDeviceOffline,
    onMqttDisconnected,
    onMqttReconnected,
  };


  const handleIncomingMessage = useCallback((topic: string, msgText: string) => {
    try {
      const data = JSON.parse(msgText);
      if (data === null || typeof data !== "object") return;

      const isConfigStatus = topic.includes("config/status");

      // 1. Config status from ESP32
      if (isConfigStatus) {
        if (data.status === "applied" && Number.isFinite(Number(data.config_version))) {
          const version = Number(data.config_version);
          setConfigStatusMsg(`ESP32-C5 đã áp dụng thành công v${data.config_version}`);
          callbacksRef.current.onConfigStatusApplied?.(version);
        } else if (data.status === "rejected") {
          const reason = typeof data.reason === "string" && data.reason.trim()
            ? data.reason.trim()
            : "Không hợp lệ";
          setConfigStatusMsg(`ESP32 từ chối cấu hình: ${reason}`);
          callbacksRef.current.onConfigStatusRejected?.(reason);
        }
      }

      // 2. Status / Telemetry
      // Config acknowledgements are status topics too, but are not telemetry.
      if (!isConfigStatus && (topic.includes("status") || topic.includes("telemetry"))) {
        callbacksRef.current.onTelemetryPayload?.(data);
      }

      // 3. Vision Detection
      if (topic.includes("vision")) {
        const detection = cleanVisionPayload(data);
        if (detection) {
          callbacksRef.current.onVisionDetection?.(detection);
        }
      }

      // 4. Emergency Stop Event (conveyor/safety/estop)
      const isReleaseMessage =
        topic.includes("/release") ||
        data.command === "ESTOP_RELEASE" ||
        data.event === "system_unlocked";

      if (!isReleaseMessage && (topic === (DEFAULT_MQTT_TOPICS.ESTOP || "conveyor/safety/estop") || data.event === "emergency_stop")) {
        const estopPayload: EmergencyStopPayload = {
          event: "emergency_stop",
          station_id: typeof data.station_id === "string" ? data.station_id : "STATION_01",
          triggered_by: typeof data.triggered_by === "string" ? data.triggered_by : "Physical E-Stop Button #1",
          timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
          mode: data.mode === "simulation" ? "simulation" : "realtime",
        };
        callbacksRef.current.onEmergencyStop?.(estopPayload);
      }

      // 5. Jam Detected Event (conveyor/sensor/jam)
      if (topic === (DEFAULT_MQTT_TOPICS.JAM || "conveyor/sensor/jam") || data.event === "jam_detected") {
        const jamPayload: JamDetectedPayload = {
          event: "jam_detected",
          section: typeof data.section === "string" ? data.section : "Conveyor_Belt_Zone_A",
          duration_seconds: Number.isFinite(Number(data.duration_seconds)) ? Number(data.duration_seconds) : 5,
          sensor_id: typeof data.sensor_id === "string" ? data.sensor_id : "OPTICAL_JAM_02",
          mode: data.mode === "simulation" ? "simulation" : "realtime",
          timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
        };
        callbacksRef.current.onJamDetected?.(jamPayload);
      }

      // 6. Bin Full Event (conveyor/storage/bin_status)
      if (topic === (DEFAULT_MQTT_TOPICS.BIN_STATUS || "conveyor/storage/bin_status") || data.event === "bin_full") {
        const binFullPayload: BinFullPayload = {
          event: "bin_full",
          bin_id: typeof data.bin_id === "string" ? data.bin_id : "BIN_RED_01",
          category: typeof data.category === "string" ? data.category : "Sản phẩm loại A",
          current_count: Number.isFinite(Number(data.current_count)) ? Number(data.current_count) : 50,
          max_capacity: Number.isFinite(Number(data.max_capacity)) ? Number(data.max_capacity) : 50,
          mode: data.mode === "simulation" ? "simulation" : "realtime",
          timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
        };
        callbacksRef.current.onBinFull?.(binFullPayload);
      }

      // 7. Temperature Warning Event (conveyor/telemetry/temp)
      if (topic === (DEFAULT_MQTT_TOPICS.TEMP || "conveyor/telemetry/temp") || data.event === "temperature_warning") {
        const tempPayload: TemperatureWarningPayload = {
          event: "temperature_warning",
          device_name: typeof data.device_name === "string" ? data.device_name : "Main_Drive_Motor / Edge_AI_Box",
          current_temp: Number.isFinite(Number(data.current_temp)) ? Number(data.current_temp) : 78.5,
          threshold_temp: Number.isFinite(Number(data.threshold_temp)) ? Number(data.threshold_temp) : 75.0,
          unit: typeof data.unit === "string" ? data.unit : "°C",
          mode: data.mode === "simulation" ? "simulation" : "realtime",
          timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
        };
        callbacksRef.current.onTemperatureWarning?.(tempPayload);
      }

      // 8. Heartbeat & Device Offline Event (conveyor/heartbeat)
      const heartbeatTopic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";
      if (topic === heartbeatTopic || topic.includes("heartbeat") || data.event === "device_offline") {
        if (data.event === "device_offline") {
          const offlinePayload: DeviceOfflinePayload = {
            event: "device_offline",
            device_id: typeof data.device_id === "string" ? data.device_id : "ESP32_MAIN_CONTROLLER",
            ip_address: typeof data.ip_address === "string" ? data.ip_address : "192.168.1.105",
            last_seen: typeof data.last_seen === "string" ? data.last_seen : "15 giây trước",
            mode: data.mode === "simulation" ? "simulation" : "realtime",
            timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
          };
          callbacksRef.current.onDeviceOffline?.(offlinePayload);
        } else {
          callbacksRef.current.onHeartbeat?.(data);
        }
      }
    } catch (e) {
      console.warn("Lỗi phân tích JSON MQTT:", e);
    }
  }, []);

  const handleIncomingMessageRef = useRef(handleIncomingMessage);
  handleIncomingMessageRef.current = handleIncomingMessage;

  // Initialize MQTT connection
  useEffect(() => {
    if (!isClient) return;
    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
    const service = new SorterMQTTService(brokerUrl);
    mqttRef.current = service;

    const statusTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_STATUS || "sorter/sorter_01/status";
    const visionTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_VISION || "sorter/sorter_01/vision";
    const cfgStatusTopic =
      process.env.NEXT_PUBLIC_MQTT_TOPIC_CONFIG_STATUS || "sorter/sorter_01/config/status";
    const telemetryTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_TELEMETRY || "sorter/sorter_01/telemetry";
    const alertTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_ALERTS || "sorter/sorter_01/alerts";
    const estopTopic = DEFAULT_MQTT_TOPICS.ESTOP || "conveyor/safety/estop";
    const jamTopic = DEFAULT_MQTT_TOPICS.JAM || "conveyor/sensor/jam";
    const binStatusTopic = DEFAULT_MQTT_TOPICS.BIN_STATUS || "conveyor/storage/bin_status";
    const tempTopic = DEFAULT_MQTT_TOPICS.TEMP || "conveyor/telemetry/temp";
    const heartbeatTopic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";

    service.setCallbacks({
      onConnect: () => {
        setMqttStatus("connected");
        setIsMqttAlertActive(false);
        setReconnectAttempt(0);
        setIsSimulatedDisconnect(false);
      },
      onDisconnect: () => {
        setMqttStatus("disconnected");
      },
      onError: () => {
        setMqttStatus("error");
      },
      onMqttDisconnectedAlert: (attempt, durationSec) => {
        setIsMqttAlertActive(true);
        setReconnectAttempt(attempt);
        const incident: MqttDisconnectedPayload = {
          event: "mqtt_disconnected",
          broker_url: brokerUrl,
          disconnected_duration_seconds: durationSec,
          reconnect_attempt: attempt,
          mode: "realtime",
          timestamp: new Date().toISOString(),
        };
        setMqttDisconnectedIncident(incident);
        callbacksRef.current.onMqttDisconnected?.(incident);
      },
      onMqttReconnectedAlert: () => {
        setIsMqttAlertActive(false);
        setMqttDisconnectedIncident(null);
        setReconnectAttempt(0);
        callbacksRef.current.onMqttReconnected?.();
      },
      onReconnectAttempt: (attempt) => {
        setReconnectAttempt(attempt);
      },
      onMessage: (topic: string, message: string) =>
        handleIncomingMessageRef.current(topic, message),
    });

    service.connect([statusTopic, visionTopic, cfgStatusTopic, telemetryTopic, alertTopic, estopTopic, jamTopic, binStatusTopic, tempTopic, heartbeatTopic]);

    return () => {
      service.disconnect();
      if (mqttRef.current === service) {
        mqttRef.current = null;
        setMqttStatus("disconnected");
        setIsMqttAlertActive(false);
      }
    };
  }, [isClient]);


  const publishCommand = useCallback(async (cmd: string, value?: number): Promise<boolean> => {
    const command = typeof cmd === "string" ? cmd.trim() : "";
    if (!command || !mqttRef.current || !mqttRef.current.isConnected()) return false;
    if (value !== undefined && !Number.isFinite(value)) return false;
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC_CONTROL || "sorter/sorter_01/control";
    const payload = {
      command,
      value: value !== undefined ? value : null,
      timestamp: new Date().toISOString(),
    };
    return mqttRef.current.publish(topic, payload);
  }, []);

  const publishConfig = useCallback(async (config: SorterConfig): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC_CONFIG || "sorter/sorter_01/config";
    return await mqttRef.current.publish(topic, config);
  }, []);

  const publishEmergencyStop = useCallback(async (payload: EmergencyStopPayload): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.ESTOP || "conveyor/safety/estop";
    return await mqttRef.current.publish(topic, payload);
  }, []);

  const publishJamAlert = useCallback(async (payload: JamDetectedPayload): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.JAM || "conveyor/sensor/jam";
    return await mqttRef.current.publish(topic, payload);
  }, []);

  const publishBinFullAlert = useCallback(async (payload: BinFullPayload): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.BIN_STATUS || "conveyor/storage/bin_status";
    return await mqttRef.current.publish(topic, payload);
  }, []);

  const publishTemperatureWarningAlert = useCallback(async (payload: TemperatureWarningPayload): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.TEMP || "conveyor/telemetry/temp";
    return await mqttRef.current.publish(topic, payload);
  }, []);

  const publishDeviceOfflineAlert = useCallback(async (payload: DeviceOfflinePayload): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";
    return await mqttRef.current.publish(topic, payload);
  }, []);

  const publishHeartbeatPing = useCallback(async (deviceId = "ESP32_MAIN_CONTROLLER"): Promise<boolean> => {
    if (!mqttRef.current || !mqttRef.current.isConnected()) return false;
    const topic = DEFAULT_MQTT_TOPICS.HEARTBEAT || "conveyor/heartbeat";
    return await mqttRef.current.publish(topic, {
      device_id: deviceId,
      ip_address: "192.168.1.105",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const simulateDisconnect = useCallback(() => {
    setIsSimulatedDisconnect(true);
    setMqttStatus("disconnected");
    if (mqttRef.current) {
      mqttRef.current.simulateDisconnect();
    }
  }, []);

  const reconnectManual = useCallback(() => {
    setIsSimulatedDisconnect(false);
    if (mqttRef.current) {
      mqttRef.current.reconnectManual();
    }
  }, []);

  return {
    mqttStatus,
    pingMs,
    setPingMs,
    configStatusMsg,
    setConfigStatusMsg,
    isMqttAlertActive,
    reconnectAttempt,
    mqttDisconnectedIncident,
    isSimulatedDisconnect,
    simulateDisconnect,
    reconnectManual,
    publishCommand,
    publishConfig,
    publishEmergencyStop,
    publishJamAlert,
    publishBinFullAlert,
    publishTemperatureWarningAlert,
    publishDeviceOfflineAlert,
    publishHeartbeatPing,
    mqttRef,
  };
}

