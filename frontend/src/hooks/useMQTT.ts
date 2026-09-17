"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SorterMQTTService } from "@/lib/mqttClient";
import { SorterConfig, VisionDetection } from "@/lib/types";
import { cleanVisionPayload } from "@/lib/dataProcessor";

export interface UseMQTTOptions {
  isClient: boolean;
  onVisionDetection?: (detection: VisionDetection) => void;
  onTelemetryPayload?: (payload: unknown) => void;
  onConfigStatusApplied?: (version: number) => void;
  onConfigStatusRejected?: (reason: string) => void;
}

export function useMQTT({
  isClient,
  onVisionDetection,
  onTelemetryPayload,
  onConfigStatusApplied,
  onConfigStatusRejected,
}: UseMQTTOptions) {
  const [mqttStatus, setMqttStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [pingMs, setPingMs] = useState<number>(24);
  const [configStatusMsg, setConfigStatusMsg] = useState<string>("");

  const mqttRef = useRef<SorterMQTTService | null>(null);

  // Callbacks ref to prevent stale closures
  const callbacksRef = useRef({
    onVisionDetection,
    onTelemetryPayload,
    onConfigStatusApplied,
    onConfigStatusRejected,
  });
  callbacksRef.current = {
    onVisionDetection,
    onTelemetryPayload,
    onConfigStatusApplied,
    onConfigStatusRejected,
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

    service.setCallbacks({
      onConnect: () => setMqttStatus("connected"),
      onDisconnect: () => setMqttStatus("disconnected"),
      onError: () => setMqttStatus("error"),
      onMessage: (topic: string, message: string) =>
        handleIncomingMessageRef.current(topic, message),
    });

    service.connect([statusTopic, visionTopic, cfgStatusTopic, telemetryTopic, alertTopic]);

    return () => {
      service.disconnect();
      if (mqttRef.current === service) {
        mqttRef.current = null;
        setMqttStatus("disconnected");
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

  return {
    mqttStatus,
    pingMs,
    setPingMs,
    configStatusMsg,
    setConfigStatusMsg,
    publishCommand,
    publishConfig,
    mqttRef,
  };
}
