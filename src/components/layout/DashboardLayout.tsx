"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  TelemetryData,
  SorterConfig,
  ClassificationRecord,
  AlertEvent,
  ThroughputPoint,
  ThemeMode,
  VisualItem,
} from "@/lib/types";
import { cleanTelemetryPayload, detectAnomalies } from "@/lib/dataProcessor";
import {
  loadSorterConfigLocal,
  saveSorterConfigLocal,
  resetSorterConfigLocal,
} from "@/lib/history";
import { triggerAlertDispatch } from "@/lib/alertService";
import { industrialAudio } from "@/lib/audioService";

// Custom Hooks (Refactored Architecture)
import { useThemeAudio } from "@/hooks/useThemeAudio";
import { useSorterData } from "@/hooks/useSorterData";
import { useConveyorPhysics } from "@/hooks/useConveyorPhysics";
import { useMQTT } from "@/hooks/useMQTT";

// Context chia sẻ dữ liệu toàn hệ thống
export interface DashboardState {
  // Telemetry & MQTT
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  mqttStatus: "connected" | "disconnected" | "error";
  pingMs: number;
  isSimulation: boolean;
  setIsSimulation: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSimulationMode: () => void;

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
  handleSaveAndPublishConfig: (
    newConfig: SorterConfig
  ) => Promise<{ success: boolean; message: string }>;

  // Data
  records: ClassificationRecord[];
  setRecords: (action: React.SetStateAction<ClassificationRecord[]>) => void;
  alerts: AlertEvent[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertEvent[]>>;
  binCounts: { bin1: number; bin2: number; bin3: number };
  setBinCounts: (
    action: React.SetStateAction<{ bin1: number; bin2: number; bin3: number }>
  ) => void;
  brandCounts: Record<string, number>;
  setBrandCounts: (action: React.SetStateAction<Record<string, number>>) => void;
  throughputHistory: ThroughputPoint[];

  // Action handlers
  handleToggleRun: () => void;
  handleEmergencyStop: () => void;
  handleSpeedChange: (speed: number) => void;
  spawnVisualPackage: (brandKey?: string, productId?: string) => void;
  handleClearHistory: () => void;
  handleClearAlerts: () => void;
  handleResetConfigToDefault: () => void;
  handleResetActuatorStates: () => void;

  // Theme & Audio
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isMuted: boolean;
  handleToggleSound: () => void;
}

const DashboardContext = React.createContext<DashboardState | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard phải được sử dụng bên trong DashboardLayout");
  }
  return context;
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // Sidebar & Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);

  // Hook 1: Theme and Audio Management
  const { themeMode, toggleTheme, isMuted, handleToggleSound } = useThemeAudio();

  // Sorter Config state & ref
  const [sorterConfig, setSorterConfig] = useState<SorterConfig>(loadSorterConfigLocal);
  const configRef = useRef<SorterConfig>(sorterConfig);
  configRef.current = sorterConfig;

  // Telemetry state & ref
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => {
    const initConfig = loadSorterConfigLocal();
    return {
      device_id: "sorter_01",
      online: true,
      uptime: 0,
      cpu_temp: 42.5,
      wifi_rssi: -58,
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
      active_config_version: initConfig?.config_version || 1,
      last_heartbeat: "",
    };
  });
  const telemetryRef = useRef<TelemetryData>(telemetry);
  telemetryRef.current = telemetry;

  // Cross-hook refs to avoid circular dependency / access before declaration
  const spawnRealItemRef = useRef<(item: VisualItem) => void>(() => {});
  const publishCommandRef = useRef<(cmd: string, value?: number) => void>(() => {});

  // Hook 2: Sorter Data (Records, Bins, Brands, Mode, Alerts)
  const sorterData = useSorterData({
    configRef,
    onSpawnRealVisualItem: (item) => {
      spawnRealItemRef.current(item);
    },
  });

  // Hook 3: Conveyor Physics & Controls
  const conveyor = useConveyorPhysics({
    telemetryRef,
    setTelemetry,
    configRef,
    isSimulationRef: sorterData.isSimulationRef,
    simRecordsRef: sorterData.simRecordsRef,
    onItemSorted: sorterData.handleItemSorted,
    onPublishCommand: (cmd, value) => {
      publishCommandRef.current(cmd, value);
    },
  });
  spawnRealItemRef.current = (item) => {
    conveyor.setVisualItems((prev) => [...prev, item]);
  };

  // Hook 4: MQTT WebSocket Connection
  const mqtt = useMQTT({
    isClient: sorterData.isClient,
    onVisionDetection: sorterData.handleRealHardwareDetection,
    onTelemetryPayload: (payload) => {
      setTelemetry((prev) => {
        const updated = cleanTelemetryPayload(payload, prev);
        const detected = detectAnomalies(updated);
        if (detected.length > 0) {
          detected.forEach((alt) => {
            triggerAlertDispatch(alt);
            sorterData.setAlerts((a) => [alt, ...a].slice(0, 100));
          });
        }
        return updated;
      });
    },
    onConfigStatusApplied: (version) => {
      setTelemetry((prev) => ({ ...prev, active_config_version: version }));
    },
  });
  publishCommandRef.current = mqtt.publishCommand;

  // Auth Redirect check
  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  // Heartbeat & Throughput Chart update (every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      const isBeltMoving =
        conveyor.isRunningRef.current &&
        !telemetryRef.current.estop_pressed &&
        conveyor.visualItemsRef.current.length > 0;

      if (conveyor.isRunningRef.current && !telemetryRef.current.estop_pressed) {
        const isSimMode = sorterData.isSimulationRef.current;
        if (isSimMode) {
          setTelemetry((prev) => ({
            ...prev,
            uptime: prev.uptime + 1,
            encoder_count:
              prev.encoder_count +
              (isBeltMoving ? Math.floor((conveyor.speedRef.current / 100) * 8) : 0),
            cpu_temp: Number((42.5 + Math.sin(Date.now() / 10000) * 2.2).toFixed(1)),
            conveyor_running: isBeltMoving,
          }));
        } else {
          setTelemetry((prev) => ({
            ...prev,
            conveyor_running: isBeltMoving,
          }));
        }

        const nowStr = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // 1. Lưu lượng Mô Phỏng (Simulation PPM)
        const now = Date.now();
        sorterData.recentSortTimesSimRef.current = sorterData.recentSortTimesSimRef.current.filter(
          (t) => now - t < 60000
        );
        const simSorts = sorterData.recentSortTimesSimRef.current.length;

        let simPPM = 0;
        if (isBeltMoving) {
          const baseRate = Math.round((conveyor.speedRef.current / 100) * 20);
          simPPM = baseRate + (simSorts > 0 ? Math.min(simSorts * 2, 8) : 0);
        } else if (simSorts > 0) {
          simPPM = simSorts;
        }

        sorterData.setSimThroughput((prev) => [
          ...prev.slice(1),
          {
            time: nowStr,
            ppm: simPPM,
            total: sorterData.simRecordsRef.current.length,
            bin1: sorterData.simBinCountsRef.current.bin1,
            bin2: sorterData.simBinCountsRef.current.bin2,
            bin3: sorterData.simBinCountsRef.current.bin3,
            speed: isBeltMoving ? conveyor.speedRef.current : 0,
          },
        ]);

        // 2. Lưu lượng Thực Tế (Real Hardware PPM)
        sorterData.recentSortTimesRealRef.current = sorterData.recentSortTimesRealRef.current.filter(
          (t) => now - t < 60000
        );
        const realSorts = sorterData.recentSortTimesRealRef.current.length;
        const realPPM = realSorts;

        sorterData.setRealThroughput((prev) => [
          ...prev.slice(1),
          {
            time: nowStr,
            ppm: realPPM,
            total: sorterData.realRecordsRef.current.length,
            bin1: sorterData.realBinCountsRef.current.bin1,
            bin2: sorterData.realBinCountsRef.current.bin2,
            bin3: sorterData.realBinCountsRef.current.bin3,
            speed: telemetryRef.current.conveyor_running ? telemetryRef.current.conveyor_speed : 0,
          },
        ]);

        // FLAW-03: Chỉ fake ping khi ở Simulation mode
        if (isSimMode) {
          mqtt.setPingMs(Math.floor(20 + Math.random() * 10));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conveyor, mqtt, sorterData]);

  // Config Actions
  const handleSaveAndPublishConfig = useCallback(
    async (newConfig: SorterConfig) => {
      industrialAudio.playClick();
      saveSorterConfigLocal(newConfig);
      setSorterConfig(newConfig);

      if (!sorterData.isSimulationRef.current) {
        mqtt.setConfigStatusMsg("Đang đồng bộ cấu hình sang vi điều khiển ESP32-C5...");
        const published = await mqtt.publishConfig(newConfig);
        if (published) {
          return { success: true, message: "Đã gửi cấu hình thành công qua MQTT tới ESP32-C5" };
        }
        return { success: false, message: "Lỗi kết nối MQTT, cấu hình chỉ được lưu cục bộ" };
      } else {
        setTimeout(() => {
          mqtt.setConfigStatusMsg(
            `Đã áp dụng cấu hình v${newConfig.config_version} (Giả lập ESP32)`
          );
        }, 700);
        return { success: true, message: "Đã lưu và áp dụng trong chế độ mô phỏng" };
      }
    },
    [mqtt, sorterData.isSimulationRef]
  );

  const handleResetConfigToDefault = useCallback(() => {
    industrialAudio.playClick();
    const defaultConfig = resetSorterConfigLocal();
    setSorterConfig(defaultConfig);
    setTelemetry((prev) => ({
      ...prev,
      active_config_version: defaultConfig.config_version || 1,
    }));
    if (!sorterData.isSimulationRef.current && mqtt.mqttRef.current?.isConnected()) {
      mqtt.publishConfig(defaultConfig);
      mqtt.setConfigStatusMsg("Đã khôi phục cấu hình v1 mặc định qua MQTT thành công!");
    } else {
      mqtt.setConfigStatusMsg("Đã khôi phục cấu hình v1 mặc định thành công!");
    }
  }, [mqtt, sorterData.isSimulationRef]);

  const handleResetActuatorStates = useCallback(() => {
    industrialAudio.playClick();
    conveyor.handleResetActuatorStates();
    mqtt.publishCommand("reset_actuators");
  }, [conveyor, mqtt]);

  const handleClearHistory = useCallback(() => {
    setClearHistoryDialogOpen(true);
  }, []);

  const confirmClearHistoryAction = useCallback(() => {
    sorterData.executeClearHistory();
    conveyor.setVisualItems([]);
    toast.success(
      `Đã xóa toàn bộ lịch sử phân loại (${
        sorterData.isSimulation ? "Mô phỏng" : "Thực tế"
      }) thành công!`
    );
  }, [conveyor, sorterData, toast]);

  // Context value
  const dashboardState: DashboardState = {
    telemetry,
    setTelemetry,
    mqttStatus: mqtt.mqttStatus,
    pingMs: mqtt.pingMs,
    isSimulation: sorterData.isSimulation,
    setIsSimulation: sorterData.setIsSimulation,
    toggleSimulationMode: sorterData.toggleSimulationMode,
    isRunning: conveyor.isRunning,
    setIsRunning: conveyor.setIsRunning,
    conveyorSpeed: conveyor.conveyorSpeed,
    setConveyorSpeed: conveyor.setConveyorSpeed,
    visualItems: conveyor.visualItems,
    setVisualItems: conveyor.setVisualItems,
    arm1Active: conveyor.arm1Active,
    arm2Active: conveyor.arm2Active,
    sorterConfig,
    setSorterConfig,
    configStatusMsg: mqtt.configStatusMsg,
    handleSaveAndPublishConfig,
    records: sorterData.records,
    setRecords: sorterData.setRecords,
    alerts: sorterData.alerts,
    setAlerts: sorterData.setAlerts,
    binCounts: sorterData.binCounts,
    setBinCounts: sorterData.setBinCounts,
    brandCounts: sorterData.brandCounts,
    setBrandCounts: sorterData.setBrandCounts,
    throughputHistory: sorterData.throughputHistory,
    handleToggleRun: conveyor.handleToggleRun,
    handleEmergencyStop: conveyor.handleEmergencyStop,
    handleSpeedChange: conveyor.handleSpeedChange,
    spawnVisualPackage: conveyor.spawnVisualPackage,
    handleClearHistory,
    handleClearAlerts: sorterData.handleClearAlerts,
    handleResetConfigToDefault,
    handleResetActuatorStates,
    themeMode,
    toggleTheme,
    isMuted,
    handleToggleSound,
  };

  // Skip layout on login page
  if (pathname === "/login") {
    return (
      <DashboardContext.Provider value={dashboardState}>
        {children}
      </DashboardContext.Provider>
    );
  }

  // Not authenticated -> wait for redirect
  if (!isAuthenticated) return null;

  if (!sorterData.isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-cyan-400 font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mr-3" />
        Đang khởi động hệ thống IoT Dashboard...
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={dashboardState}>
      <div
        className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
          themeMode === "light"
            ? "light bg-slate-50 text-slate-900"
            : "dark bg-[#0D0F12] text-slate-100"
        }`}
      >
        {/* Sidebar — Responsive with mobile open/close */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          alertCount={sorterData.unresolvedAlertCount}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Mobile backdrop overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-xs"
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
            alertCount={sorterData.unresolvedAlertCount}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            mqttStatus={mqtt.mqttStatus}
            pingMs={mqtt.pingMs}
            isSimulation={sorterData.isSimulation}
            onToggleSimulationMode={sorterData.toggleSimulationMode}
          />

          {/* Page Content with smooth GPU-accelerated transition */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <div key={pathname} className="page-transition-enter">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Confirm Dialog: Xóa lịch sử phân loại */}
      <ConfirmDialog
        isOpen={clearHistoryDialogOpen}
        title="Xác nhận xóa lịch sử"
        message={`Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân loại trong chế độ ${
          sorterData.isSimulation ? "MÔ PHỎNG" : "THỰC TẾ"
        }? Hành động này sẽ đặt lại bộ đếm sản phẩm và không thể hoàn tác.`}
        confirmText="Xóa dữ liệu"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={() => {
          setClearHistoryDialogOpen(false);
          confirmClearHistoryAction();
        }}
        onCancel={() => setClearHistoryDialogOpen(false)}
      />
    </DashboardContext.Provider>
  );
};
