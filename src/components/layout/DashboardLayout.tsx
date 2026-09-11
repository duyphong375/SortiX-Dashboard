"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import {
  TelemetryData,
  SorterConfig,
  ClassificationRecord,
  AlertEvent,
  ThroughputPoint,
  CATALOG_BRANDS,
  ThemeMode,
  VisualItem,
} from "@/lib/types";
import {
  cleanTelemetryPayload,
  cleanVisionPayload,
  determineTargetBin,
  formatUptime,
  getBrandName,
  detectAnomalies,
} from "@/lib/dataProcessor";
import {
  loadClassificationHistory,
  saveClassificationRecord,
  clearClassificationHistory,
  loadAlertHistory,
  saveAlertHistory,
  clearAlertHistory,
  loadSorterConfigLocal,
  saveSorterConfigLocal,
  resetSorterConfigLocal,
  DEFAULT_INITIAL_CONFIG,
  factoryResetAll,
} from "@/lib/history";
import { SorterMQTTService } from "@/lib/mqttClient";
import { triggerAlertDispatch } from "@/lib/alertService";
import { industrialAudio } from "@/lib/audioService";

// Context chia sẻ dữ liệu toàn hệ thống
export interface DashboardState {
  // Telemetry & MQTT
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  mqttStatus: "connected" | "disconnected" | "error";
  pingMs: number;
  isSimulation: boolean;
  setIsSimulation: React.Dispatch<React.SetStateAction<boolean>>;

  // Conveyor
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  conveyorSpeed: number;
  setConveyorSpeed: React.Dispatch<React.SetStateAction<number>>;
  visualItems: VisualItem[];
  setVisualItems: React.Dispatch<React.SetStateAction<VisualItem[]>>;
  arm1Active: boolean;
  arm2Active: boolean;

  // Config
  sorterConfig: SorterConfig;
  setSorterConfig: React.Dispatch<React.SetStateAction<SorterConfig>>;
  configStatusMsg: string;
  handleSaveAndPublishConfig: (newConfig: SorterConfig) => Promise<{ success: boolean; message: string }>;

  // Data
  records: ClassificationRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ClassificationRecord[]>>;
  alerts: AlertEvent[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertEvent[]>>;
  binCounts: { bin1: number; bin2: number; bin3: number };
  setBinCounts: React.Dispatch<React.SetStateAction<{ bin1: number; bin2: number; bin3: number }>>;
  brandCounts: Record<string, number>;
  setBrandCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  throughputHistory: ThroughputPoint[];

  // Actions
  handleToggleRun: () => void;
  handleEmergencyStop: () => void;
  handleSpeedChange: (speed: number) => void;
  spawnVisualPackage: (brandKey?: string, productId?: string) => void;
  handleClearHistory: () => void;
  handleClearAlerts: () => void;
  handleResetConfigToDefault: () => void;
  handleResetActuatorStates: () => void;

  // Theme
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isMuted: boolean;
  handleToggleSound: () => void;
}

export const DashboardContext = React.createContext<DashboardState | null>(null);

export function useDashboard(): DashboardState {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard phải được gọi bên trong DashboardLayout");
  return ctx;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme & Sound
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [isMuted, setIsMuted] = useState(false);

  // Core state (di chuyển từ MainDashboard cũ)
  const [isClient, setIsClient] = useState(false);
  const [isSimulation, setIsSimulation] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [conveyorSpeed, setConveyorSpeed] = useState(65);
  const [mqttStatus, setMqttStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [configStatusMsg, setConfigStatusMsg] = useState("");
  const [pingMs, setPingMs] = useState(24);

  // Config
  const [sorterConfig, setSorterConfig] = useState<SorterConfig>(loadSorterConfigLocal);

  // Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    device_id: "sorter_01",
    online: true,
    uptime: 0,
    cpu_temp: 42.8,
    wifi_rssi: -56,
    wifi_band: "5.0 GHz (Wi-Fi 6)",
    conveyor_running: true,
    conveyor_speed: 65,
    s1_entry: false,
    s2_sorter1: false,
    s3_sorter2: false,
    arm1_active: false,
    arm2_active: false,
    estop_pressed: false,
    encoder_count: 0,
    active_config_version: 1,
    last_heartbeat: new Date().toISOString(),
  });

  // Arms
  const [arm1Active, setArm1Active] = useState(false);
  const [arm2Active, setArm2Active] = useState(false);

  // Items on belt
  const [visualItems, setVisualItems] = useState<VisualItem[]>([]);

  // Records & Alerts
  const [records, setRecords] = useState<ClassificationRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  // Counts
  const [binCounts, setBinCounts] = useState({ bin1: 0, bin2: 0, bin3: 0 });
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({
    brand_c: 0,
    brand_a: 0,
    brand_b: 0,
    brand_d: 0,
  });

  // Chart
  const [throughputHistory, setThroughputHistory] = useState<ThroughputPoint[]>([]);

  // Refs
  const mqttRef = useRef<SorterMQTTService | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const visualItemsRef = useRef<VisualItem[]>(visualItems);
  visualItemsRef.current = visualItems;
  const telemetryRef = useRef<TelemetryData>(telemetry);
  telemetryRef.current = telemetry;
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;
  const speedRef = useRef<number>(conveyorSpeed);
  speedRef.current = conveyorSpeed;
  const configRef = useRef<SorterConfig>(sorterConfig);
  configRef.current = sorterConfig;
  const productSeqRef = useRef<number>(0);
  const recordsRef = useRef<ClassificationRecord[]>(records);
  recordsRef.current = records;
  const binCountsRef = useRef(binCounts);
  binCountsRef.current = binCounts;
  const recentSortTimesRef = useRef<number[]>([]);

  // Auth redirect
  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  // Client init
  useEffect(() => {
    setIsClient(true);
    const loadedRecords = loadClassificationHistory();
    const loadedAlerts = loadAlertHistory();
    setRecords(loadedRecords);
    setAlerts(loadedAlerts);

    const savedSeq = localStorage.getItem("pbl3_product_seq");
    productSeqRef.current = savedSeq ? parseInt(savedSeq, 10) : loadedRecords.length;

    const savedMuted = localStorage.getItem("pbl3_sound_muted") === "true";
    setIsMuted(savedMuted);

    const savedTheme = (localStorage.getItem("pbl3_theme_mode") as ThemeMode) || "dark";
    setThemeMode(savedTheme === "light" ? "light" : "dark");

    const bCounts = { bin1: 0, bin2: 0, bin3: 0 };
    const brCounts: Record<string, number> = { brand_c: 0, brand_a: 0, brand_b: 0, brand_d: 0 };
    loadedRecords.forEach((r) => {
      if (r.actual_bin === 1) bCounts.bin1++;
      else if (r.actual_bin === 2) bCounts.bin2++;
      else bCounts.bin3++;
      if (brCounts[r.brand_id] !== undefined) brCounts[r.brand_id]++;
      else brCounts[r.brand_id] = 1;
    });
    setBinCounts(bCounts);
    setBrandCounts(brCounts);

    const initialPoints: ThroughputPoint[] = Array.from({ length: 12 }, (_, i) => ({
      time: new Date(Date.now() - (12 - i) * 3000).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      ppm: 0,
      total: loadedRecords.length,
      bin1: bCounts.bin1,
      bin2: bCounts.bin2,
      bin3: bCounts.bin3,
      speed: 0,
    }));
    setThroughputHistory(initialPoints);
  }, []);

  // Theme application
  useEffect(() => {
    if (!isClient) return;
    const root = document.documentElement;
    if (themeMode === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("pbl3_theme_mode", themeMode);
  }, [themeMode, isClient]);

  const toggleTheme = () => {
    industrialAudio.playClick();
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    industrialAudio.setMuted(nextMuted);
    if (!nextMuted) industrialAudio.playClick();
  };

  // MQTT Connection
  useEffect(() => {
    if (!isClient) return;
    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
    const service = new SorterMQTTService(brokerUrl);
    mqttRef.current = service;

    const statusTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_STATUS || "sorter/sorter_01/status";
    const visionTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_VISION || "sorter/sorter_01/vision";
    const cfgStatusTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_CONFIG_STATUS || "sorter/sorter_01/config/status";
    const telemetryTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_TELEMETRY || "sorter/sorter_01/telemetry";
    const alertTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC_ALERTS || "sorter/sorter_01/alerts";

    service.setCallbacks({
      onConnect: () => setMqttStatus("connected"),
      onDisconnect: () => setMqttStatus("disconnected"),
      onError: () => setMqttStatus("error"),
      onMessage: (topic, message) => handleIncomingMessage(topic, message),
    });

    service.connect([statusTopic, visionTopic, cfgStatusTopic, telemetryTopic, alertTopic]);
    return () => service.disconnect();
  }, [isClient]);

  const handleIncomingMessage = (topic: string, msgText: string) => {
    try {
      const data = JSON.parse(msgText);
      if (topic.includes("config/status")) {
        if (data.status === "applied") {
          setConfigStatusMsg(`ESP32-C5 đã áp dụng thành công v${data.config_version}`);
          setTelemetry((prev) => ({ ...prev, active_config_version: data.config_version }));
        } else if (data.status === "rejected") {
          setConfigStatusMsg(`ESP32 từ chối cấu hình: ${data.reason || "Không hợp lệ"}`);
        }
      }
      if (topic.includes("status") || topic.includes("telemetry")) {
        setTelemetry((prev) => {
          const updated = cleanTelemetryPayload(data, prev);
          const detected = detectAnomalies(updated);
          if (detected.length > 0) {
            detected.forEach((alt) => {
              triggerAlertDispatch(alt);
              setAlerts((a) => [alt, ...a].slice(0, 100));
            });
          }
          return updated;
        });
      }
      if (topic.includes("vision") && !isSimulation) {
        const detection = cleanVisionPayload(data);
        if (detection) {
          spawnVisualPackage(detection.brand_id, detection.product_id);
        }
      }
    } catch (e) {
      console.warn("Lỗi phân tích JSON MQTT:", e);
    }
  };

  // Spawn package
  const spawnVisualPackage = useCallback((brandKey?: string, productId?: string) => {
    const brands = Object.keys(CATALOG_BRANDS);
    const chosenBrand = brandKey || brands[Math.floor(Math.random() * brands.length)];
    const currentSeq = recordsRef.current.length + visualItemsRef.current.length + 1;
    const chosenId = productId || `#${currentSeq}`;
    const target = determineTargetBin(chosenBrand, configRef.current);

    const newItem: VisualItem = {
      id: chosenId,
      brandKey: chosenBrand,
      progress: 0,
      targetBin: target,
      yOffset: 0,
      opacity: 1,
      deflected: false,
      sorted: false,
    };
    setVisualItems((prev) => [...prev, newItem]);
    industrialAudio.playClick();
  }, []);

  // Handle item sorted
  const handleItemSorted = useCallback((item: VisualItem, actualBin: number) => {
    recentSortTimesRef.current.push(Date.now());
    const isCorrect = item.targetBin === actualBin;
    const brand = CATALOG_BRANDS[item.brandKey];
    const record: ClassificationRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      product_id: item.id,
      brand_id: item.brandKey,
      brand_name: brand?.name || item.brandKey,
      confidence: 0.94 + Math.random() * 0.05,
      target_bin: item.targetBin,
      actual_bin: actualBin,
      status: isCorrect ? "success" : "diverted_default",
      timestamp: new Date().toISOString(),
    };
    saveClassificationRecord(record);
    setRecords((prev) => [record, ...prev].slice(0, 500));
    industrialAudio.playSortSuccess();
    setBinCounts((prev) => ({
      ...prev,
      [actualBin === 1 ? "bin1" : actualBin === 2 ? "bin2" : "bin3"]:
        prev[actualBin === 1 ? "bin1" : actualBin === 2 ? "bin2" : "bin3"] + 1,
    }));
    setBrandCounts((prev) => ({
      ...prev,
      [item.brandKey]: (prev[item.brandKey] || 0) + 1,
    }));
  }, []);

  // Physics loop
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const isBeltMoving =
        isRunningRef.current && !telemetryRef.current.estop_pressed && visualItemsRef.current.length > 0;

      if (isBeltMoving) {
        const moveStep = delta * (speedRef.current * 0.35);
        const currentItems = visualItemsRef.current;
        const updatedItems: VisualItem[] = [];

        for (let i = 0; i < currentItems.length; i++) {
          const item = { ...currentItems[i] };

          if (item.deflected) {
            item.yOffset = (item.yOffset || 0) + delta * 120;
            item.opacity = Math.max(0, (item.opacity ?? 1) - delta * 2.5);
            if (item.yOffset >= 45 || item.opacity <= 0.05) continue;
            updatedItems.push(item);
            continue;
          }

          item.progress += moveStep;

          if (item.progress >= 14 && item.progress <= 17 && !item.s1Triggered) {
            (item as any).s1Triggered = true;
            setTelemetry((prev) => ({ ...prev, s1_entry: true }));
            industrialAudio.playSensorBeep();
            setTimeout(() => setTelemetry((prev) => ({ ...prev, s1_entry: false })), 300);
          }

          if (item.progress >= 43 && item.progress <= 47 && !item.sorted) {
            setTelemetry((prev) => ({ ...prev, s2_sorter1: true }));
            setTimeout(() => setTelemetry((prev) => ({ ...prev, s2_sorter1: false })), 250);
            if (item.targetBin === 1) {
              item.sorted = true;
              item.deflected = true;
              setArm1Active(true);
              industrialAudio.playServoArm();
              setTimeout(() => setArm1Active(false), 450);
              handleItemSorted(item, 1);
              updatedItems.push(item);
              continue;
            }
          }

          if (item.progress >= 70 && item.progress <= 74 && !item.sorted) {
            setTelemetry((prev) => ({ ...prev, s3_sorter2: true }));
            setTimeout(() => setTelemetry((prev) => ({ ...prev, s3_sorter2: false })), 250);
            if (item.targetBin === 2) {
              item.sorted = true;
              item.deflected = true;
              setArm2Active(true);
              industrialAudio.playServoArm();
              setTimeout(() => setArm2Active(false), 450);
              handleItemSorted(item, 2);
              updatedItems.push(item);
              continue;
            }
          }

          if (item.progress >= 96 && !item.sorted) {
            item.sorted = true;
            handleItemSorted(item, 3);
            continue;
          }

          if (item.progress < 100) updatedItems.push(item);
        }
        setVisualItems(updatedItems);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [handleItemSorted]);

  // Heartbeat & chart update
  useEffect(() => {
    const interval = setInterval(() => {
      const isBeltMoving =
        isRunningRef.current &&
        !telemetryRef.current.estop_pressed &&
        visualItemsRef.current.length > 0;

      if (isRunningRef.current && !telemetryRef.current.estop_pressed) {
        setTelemetry((prev) => ({
          ...prev,
          uptime: prev.uptime + 1,
          encoder_count:
            prev.encoder_count +
            (isBeltMoving ? Math.floor((speedRef.current / 100) * 8) : 0),
          cpu_temp: Number((42.5 + Math.sin(Date.now() / 10000) * 2.2).toFixed(1)),
          conveyor_running: isBeltMoving,
        }));

        setThroughputHistory((prev) => {
          const nowStr = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          // Lọc các lần phân loại trong 60 giây gần nhất để tính lưu lượng thực tế
          const now = Date.now();
          recentSortTimesRef.current = recentSortTimesRef.current.filter(
            (t) => now - t < 60000
          );
          const recentSorts = recentSortTimesRef.current.length;

          // Nếu có sản phẩm trên băng tải đang chạy, lưu lượng tức thời tương ứng theo tốc độ
          let currentPPM = 0;
          if (isBeltMoving) {
            const baseRate = Math.round((speedRef.current / 100) * 20);
            currentPPM = baseRate + (recentSorts > 0 ? Math.min(recentSorts * 2, 8) : 0);
          } else if (recentSorts > 0) {
            currentPPM = recentSorts;
          }

          const newPoint: ThroughputPoint = {
            time: nowStr,
            ppm: currentPPM,
            total: recordsRef.current.length,
            bin1: binCountsRef.current.bin1,
            bin2: binCountsRef.current.bin2,
            bin3: binCountsRef.current.bin3,
            speed: isBeltMoving ? speedRef.current : 0,
          };
          return [...prev.slice(1), newPoint];
        });

        setPingMs(Math.floor(20 + Math.random() * 10));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Control handlers
  const handleToggleRun = () => {
    industrialAudio.playClick();
    const nextState = !isRunning;
    setIsRunning(nextState);
    setTelemetry((prev) => ({ ...prev, conveyor_running: nextState }));
    if (mqttRef.current) {
      mqttRef.current.publish(
        process.env.NEXT_PUBLIC_MQTT_TOPIC_CONTROL || "sorter/sorter_01/control",
        { action: nextState ? "start" : "pause", timestamp: new Date().toISOString() }
      );
    }
  };

  const handleEmergencyStop = () => {
    const newEstopState = !telemetry.estop_pressed;
    setTelemetry((prev) => ({
      ...prev,
      estop_pressed: newEstopState,
      conveyor_running: !newEstopState,
    }));
    if (newEstopState) {
      setIsRunning(false);
      industrialAudio.playEmergencyAlarm();
      const estopAlert: AlertEvent = {
        event_id: `estop_${Date.now()}`,
        event_type: "emergency_stop",
        severity: "critical",
        device_id: "sorter_01",
        description: "NGƯỜI DÙNG NHẤN NÚT DỪNG KHẨN CẤP (E-STOP) TỪ BẢNG ĐIỀU KHIỂN!",
        timestamp: new Date().toISOString(),
      };
      triggerAlertDispatch(estopAlert);
      setAlerts((prev) => [estopAlert, ...prev]);
    } else {
      industrialAudio.playClick();
    }
    if (mqttRef.current) {
      mqttRef.current.publish(
        process.env.NEXT_PUBLIC_MQTT_TOPIC_CONTROL || "sorter/sorter_01/control",
        { action: newEstopState ? "estop_active" : "estop_reset" }
      );
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setConveyorSpeed(newSpeed);
    setTelemetry((prev) => ({ ...prev, conveyor_speed: newSpeed }));
    if (mqttRef.current) {
      mqttRef.current.publish(
        process.env.NEXT_PUBLIC_MQTT_TOPIC_CONTROL || "sorter/sorter_01/control",
        { action: "set_speed", speed: newSpeed }
      );
    }
  };

  const handleSaveAndPublishConfig = async (newConfig: SorterConfig) => {
    industrialAudio.playClick();
    setSorterConfig(newConfig);
    saveSorterConfigLocal(newConfig);
    setConfigStatusMsg(`Đang gửi v${newConfig.config_version} qua MQTT...`);
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC_CONFIG || "sorter/sorter_01/config/set";
    if (mqttRef.current && mqttRef.current.isConnected()) {
      const pubOk = await mqttRef.current.publish(topic, newConfig);
      if (pubOk) {
        setConfigStatusMsg(`Đã xuất bản v${newConfig.config_version} (Chờ ESP32 xác nhận)`);
        return { success: true, message: "Đã gửi qua MQTT thành công" };
      } else {
        setConfigStatusMsg("Lỗi khi publish MQTT!");
        return { success: false, message: "Lỗi publish MQTT" };
      }
    } else {
      setTimeout(() => {
        setConfigStatusMsg(`Đã áp dụng cấu hình v${newConfig.config_version} (Giả lập ESP32)`);
        setTelemetry((prev) => ({ ...prev, active_config_version: newConfig.config_version }));
      }, 700);
      return { success: true, message: "Đã lưu và áp dụng trong chế độ mô phỏng" };
    }
  };

  const handleClearHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân loại trong bộ nhớ?")) {
      industrialAudio.playClick();
      clearClassificationHistory();
      productSeqRef.current = 0;
      recentSortTimesRef.current = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("pbl3_product_seq");
      }
      setRecords([]);
      setVisualItems([]);
      setBinCounts({ bin1: 0, bin2: 0, bin3: 0 });
      setBrandCounts({ brand_c: 0, brand_a: 0, brand_b: 0, brand_d: 0 });

      // Reset biểu đồ thông lượng về 0
      const resetPoints: ThroughputPoint[] = Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (12 - i) * 1000).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        ppm: 0,
        total: 0,
        bin1: 0,
        bin2: 0,
        bin3: 0,
        speed: 0,
      }));
      setThroughputHistory(resetPoints);
    }
  };

  const handleClearAlerts = () => {
    industrialAudio.playClick();
    clearAlertHistory();
    setAlerts([]);
  };

  const handleResetConfigToDefault = () => {
    industrialAudio.playClick();
    const defaultConfig = resetSorterConfigLocal();
    setSorterConfig(defaultConfig);
    setTelemetry((prev) => ({
      ...prev,
      active_config_version: 1,
      s1_entry: false,
      s2_sorter1: false,
      s3_sorter2: false,
      arm1_active: false,
      arm2_active: false,
      estop_pressed: false,
    }));
    setArm1Active(false);
    setArm2Active(false);

    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC_CONFIG || "sorter/sorter_01/config/set";
    if (mqttRef.current && mqttRef.current.isConnected()) {
      mqttRef.current.publish(topic, defaultConfig);
      setConfigStatusMsg("Đã khôi phục cấu hình v1 mặc định qua MQTT thành công!");
    } else {
      setConfigStatusMsg("Đã khôi phục cấu hình v1 mặc định thành công!");
    }
  };

  const handleResetActuatorStates = () => {
    industrialAudio.playClick();
    setTelemetry((prev) => ({
      ...prev,
      s1_entry: false,
      s2_sorter1: false,
      s3_sorter2: false,
      arm1_active: false,
      arm2_active: false,
    }));
    setArm1Active(false);
    setArm2Active(false);
    if (mqttRef.current && mqttRef.current.isConnected()) {
      mqttRef.current.publish(
        process.env.NEXT_PUBLIC_MQTT_TOPIC_CONTROL || "sorter/sorter_01/control",
        { action: "reset_actuators", timestamp: new Date().toISOString() }
      );
    }
  };

  // Don't render layout on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Not authenticated → render nothing (redirect will happen)
  if (!isAuthenticated) return null;

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-cyan-400 font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mr-3" />
        Đang khởi động hệ thống IoT Dashboard...
      </div>
    );
  }

  const dashboardState: DashboardState = {
    telemetry,
    setTelemetry,
    mqttStatus,
    pingMs,
    isSimulation,
    setIsSimulation,
    isRunning,
    setIsRunning,
    conveyorSpeed,
    setConveyorSpeed,
    visualItems,
    setVisualItems,
    arm1Active,
    arm2Active,
    sorterConfig,
    setSorterConfig,
    configStatusMsg,
    handleSaveAndPublishConfig,
    records,
    setRecords,
    alerts,
    setAlerts,
    binCounts,
    setBinCounts,
    brandCounts,
    setBrandCounts,
    throughputHistory,
    handleToggleRun,
    handleEmergencyStop,
    handleSpeedChange,
    spawnVisualPackage,
    handleClearHistory,
    handleClearAlerts,
    handleResetConfigToDefault,
    handleResetActuatorStates,
    themeMode,
    toggleTheme,
    isMuted,
    handleToggleSound,
  };

  return (
    <DashboardContext.Provider value={dashboardState}>
      <div
        className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
          themeMode === "light"
            ? "light bg-slate-50 text-slate-900"
            : "dark bg-[#0D0F12] text-slate-100"
        }`}
      >
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          alertCount={alerts.filter((a) => !a.resolved).length}
        />

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div
          className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
          }`}
        >
          <TopHeader
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            alertCount={alerts.filter((a) => !a.resolved).length}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            mqttStatus={mqttStatus}
            pingMs={pingMs}
          />

          {/* Page Content with smooth GPU-accelerated transition */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <div key={pathname} className="page-transition-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};
