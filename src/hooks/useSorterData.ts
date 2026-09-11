"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ClassificationRecord,
  AlertEvent,
  ThroughputPoint,
  VisualItem,
  VisionDetection,
  SorterConfig,
  CATALOG_BRANDS,
} from "@/lib/types";
import { getBrandName, determineTargetBin } from "@/lib/dataProcessor";
import {
  BinCounts,
  loadClassificationHistory,
  saveClassificationRecord,
  saveClassificationRecordsLocal,
  clearClassificationHistory,
  loadBinCountsLocal,
  updateBinCountsLocal,
  loadBrandCountsLocal,
  loadOperatingMode,
  saveOperatingMode,
  saveBinCountsLocal,
  loadAlertHistory,
  clearAlertHistory,
} from "@/lib/history";
import { industrialAudio } from "@/lib/audioService";
import { triggerAlertDispatch } from "@/lib/alertService";
import { useToast } from "@/components/ui/Toast";

export interface UseSorterDataProps {
  configRef: React.MutableRefObject<SorterConfig>;
  onSpawnRealVisualItem?: (item: VisualItem) => void;
  onPublishCommand?: (cmd: string, value?: number) => void;
}

export function useSorterData({ configRef, onSpawnRealVisualItem, onPublishCommand }: UseSorterDataProps) {
  const [isClient, setIsClient] = useState(false);
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const { error: showToastError, success: showToastSuccess } = useToast();

  // Simulation mode states
  const [simRecords, setSimRecords] = useState<ClassificationRecord[]>([]);
  const [simBinCounts, setSimBinCounts] = useState<BinCounts>({ bin1: 0, bin2: 0, bin3: 0 });
  const [simBrandCounts, setSimBrandCounts] = useState<Record<string, number>>({
    brand_c: 0,
    brand_a: 0,
    brand_b: 0,
    brand_d: 0,
  });
  const [simThroughput, setSimThroughput] = useState<ThroughputPoint[]>([]);

  // Real hardware mode states
  const [realRecords, setRealRecords] = useState<ClassificationRecord[]>([]);
  const [realBinCounts, setRealBinCounts] = useState<BinCounts>({ bin1: 0, bin2: 0, bin3: 0 });
  const [realBrandCounts, setRealBrandCounts] = useState<Record<string, number>>({
    brand_c: 0,
    brand_a: 0,
    brand_b: 0,
    brand_d: 0,
  });
  const [realThroughput, setRealThroughput] = useState<ThroughputPoint[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  // Refs for physics & interval callbacks
  const isSimulationRef = useRef<boolean>(isSimulation);
  isSimulationRef.current = isSimulation;
  const simRecordsRef = useRef<ClassificationRecord[]>(simRecords);
  simRecordsRef.current = simRecords;
  const realRecordsRef = useRef<ClassificationRecord[]>(realRecords);
  realRecordsRef.current = realRecords;
  const simBinCountsRef = useRef<BinCounts>(simBinCounts);
  simBinCountsRef.current = simBinCounts;
  const realBinCountsRef = useRef<BinCounts>(realBinCounts);
  realBinCountsRef.current = realBinCounts;

  const recentSortTimesSimRef = useRef<number[]>([]);
  const recentSortTimesRealRef = useRef<number[]>([]);

  // Load initial data from localStorage
  useEffect(() => {
    setIsClient(true);
    const savedMode = loadOperatingMode();
    setIsSimulation(savedMode);

    // 1. Sim Data
    const loadedSimRecords = loadClassificationHistory(true);
    const loadedSimCounts = loadBinCountsLocal(true);
    const loadedSimBrands = loadBrandCountsLocal(true);
    setSimRecords(loadedSimRecords);
    setSimBinCounts(loadedSimCounts);
    setSimBrandCounts(loadedSimBrands);

    // 2. Real Data
    const loadedRealRecords = loadClassificationHistory(false);
    const loadedRealCounts = loadBinCountsLocal(false);
    const loadedRealBrands = loadBrandCountsLocal(false);
    setRealRecords(loadedRealRecords);
    setRealBinCounts(loadedRealCounts);
    setRealBrandCounts(loadedRealBrands);

    // 3. Alerts
    const loadedAlerts = loadAlertHistory();
    setAlerts(loadedAlerts);

    // 4. Initial Throughput points
    const createInitialPoints = (total: number, counts: BinCounts): ThroughputPoint[] =>
      Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (12 - i) * 3000).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        ppm: 0,
        total,
        bin1: counts.bin1,
        bin2: counts.bin2,
        bin3: counts.bin3,
        speed: 0,
      }));

    setSimThroughput(createInitialPoints(loadedSimRecords.length, loadedSimCounts));
    setRealThroughput(createInitialPoints(loadedRealRecords.length, loadedRealCounts));
  }, []);

  // Toggle Mode Handler
  const toggleSimulationMode = useCallback(() => {
    industrialAudio.playClick();
    setIsSimulation((prev) => {
      const next = !prev;
      saveOperatingMode(next);
      return next;
    });
  }, []);

  // Tạo một bộ dữ liệu demo ngẫu nhiên khi người dùng chủ động yêu cầu.
  // Không gọi hàm này trong lúc khởi tạo để chế độ mô phỏng mặc định luôn rỗng.
  const generateSimulationDemoData = useCallback(() => {
    if (!isClient || !isSimulationRef.current) return;

    const brands = Object.keys(CATALOG_BRANDS);
    const count = 18 + Math.floor(Math.random() * 13);
    const now = Date.now();
    const generated: ClassificationRecord[] = Array.from({ length: count }, (_, index) => {
      const brandKey = brands[Math.floor(Math.random() * brands.length)];
      const targetBin = determineTargetBin(brandKey, configRef.current);
      const timestamp = new Date(now - Math.floor(Math.random() * 72 * 60 * 60 * 1000));
      const brand = CATALOG_BRANDS[brandKey];

      return {
        id: `demo_${now}_${index}_${Math.random().toString(16).slice(2, 6)}`,
        product_id: `#DEMO-${index + 1}`,
        brand_id: brandKey,
        brand_name: brand.name,
        confidence: Number((0.9 + Math.random() * 0.09).toFixed(2)),
        target_bin: targetBin,
        actual_bin: targetBin,
        status: "success",
        timestamp: timestamp.toISOString(),
      };
    });

    const updatedRecords = saveClassificationRecordsLocal(generated, true);
    const addedCounts = generated.reduce<BinCounts>(
      (counts, record) => {
        const key = `bin${record.actual_bin}` as keyof BinCounts;
        counts[key] += 1;
        return counts;
      },
      { bin1: 0, bin2: 0, bin3: 0 }
    );
    const nextCounts: BinCounts = {
      bin1: Math.min(simBinCountsRef.current.bin1 + addedCounts.bin1, 50),
      bin2: Math.min(simBinCountsRef.current.bin2 + addedCounts.bin2, 50),
      bin3: Math.min(simBinCountsRef.current.bin3 + addedCounts.bin3, 50),
    };

    saveBinCountsLocal(nextCounts, true);
    setSimRecords(updatedRecords);
    setSimBinCounts(nextCounts);
    setSimBrandCounts((previous) => {
      const next = { ...previous };
      generated.forEach((record) => {
        next[record.brand_id] = (next[record.brand_id] || 0) + 1;
      });
      return next;
    });
    setSimThroughput((previous) => [
      ...previous.slice(1),
      {
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        ppm: 0,
        total: updatedRecords.length,
        bin1: nextCounts.bin1,
        bin2: nextCounts.bin2,
        bin3: nextCounts.bin3,
        speed: 0,
      },
    ]);
    showToastSuccess(`Đã tạo ${generated.length} bản ghi demo ngẫu nhiên.`);
  }, [configRef, isClient, isSimulationRef, showToastSuccess, simBinCountsRef]);

  // Record Real Detection from MQTT Vision Camera (YOLOv8)
  const handleRealHardwareDetection = useCallback(
    (detection: VisionDetection) => {
      const targetBin = determineTargetBin(detection.brand_id, configRef.current);
      
      // Direct visualization on belt if in Real Mode
      if (!isSimulationRef.current && onSpawnRealVisualItem) {
        const newItem: VisualItem = {
          id: detection.product_id,
          brandKey: detection.brand_id,
          progress: 0,
          targetBin: targetBin,
          yOffset: 0,
          opacity: 1,
          deflected: false,
          sorted: false,
          s1Triggered: true, // We assume it's detected at S1
          isSim: false,
          confidence: detection.confidence,
          timestamp: detection.timestamp || new Date().toISOString(),
        };
        onSpawnRealVisualItem(newItem);
      }
    },
    [configRef, onSpawnRealVisualItem]
  );

  // Record sorted item from conveyor physics loop
  const handleItemSorted = useCallback((item: VisualItem, actualBin: number) => {
    const isSim = item.isSim;
    const isCorrect = item.targetBin === actualBin;
    const brand = CATALOG_BRANDS[item.brandKey];
    
    // Use stored confidence and timestamp if from real hardware, else simulate
    const confidence = item.confidence ?? (0.94 + Math.random() * 0.05);
    const timestamp = item.timestamp ?? new Date().toISOString();
    
    const record: ClassificationRecord = {
      id: `${isSim ? "sim" : "real"}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      product_id: item.id,
      brand_id: item.brandKey,
      brand_name: brand?.name || getBrandName(item.brandKey),
      confidence: confidence,
      target_bin: item.targetBin,
      actual_bin: actualBin,
      status: isCorrect ? "success" : "diverted_default",
      timestamp: timestamp,
    };

    const currentCount = isSim
      ? simBinCountsRef.current[`bin${actualBin}` as keyof BinCounts] || 0
      : realBinCountsRef.current[`bin${actualBin}` as keyof BinCounts] || 0;

    const newCount = currentCount + 1;
    const MAX_BIN_CAPACITY = 50;

    if (newCount === MAX_BIN_CAPACITY || (newCount > MAX_BIN_CAPACITY && (newCount - MAX_BIN_CAPACITY) % 5 === 0)) {
      const alert: AlertEvent = {
        event_id: `bin_full_${actualBin}_${Date.now()}`,
        event_type: "bin_full",
        severity: "warning",
        device_id: "sorter_01",
        description: `Cảnh báo: Khay số ${actualBin} đã đầy (${newCount}/${MAX_BIN_CAPACITY} SP). Yêu cầu dọn khay ngay!`,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      triggerAlertDispatch(alert);
      // Wait for UI to mount or just show toast
      setTimeout(() => showToastError(alert.description), 0);
    }

    if (isSim) {
      recentSortTimesSimRef.current.push(Date.now());
      saveClassificationRecord(record, true);
      updateBinCountsLocal(actualBin, true);
      setSimRecords((prev) => [record, ...prev].slice(0, 500));
      setSimBinCounts((prev: BinCounts) => {
        const binKey = `bin${actualBin}` as "bin1" | "bin2" | "bin3";
        if ((prev[binKey] || 0) >= 50) return prev;
        return { ...prev, [binKey]: (prev[binKey] || 0) + 1 };
      });
      setSimBrandCounts((prev) => ({
        ...prev,
        [item.brandKey]: (prev[item.brandKey] || 0) + 1,
      }));
    } else {
      recentSortTimesRealRef.current.push(Date.now());
      saveClassificationRecord(record, false);
      updateBinCountsLocal(actualBin, false);
      setRealRecords((prev) => [record, ...prev].slice(0, 500));
      setRealBinCounts((prev: BinCounts) => {
        const binKey = `bin${actualBin}` as "bin1" | "bin2" | "bin3";
        if ((prev[binKey] || 0) >= 50) return prev;
        return { ...prev, [binKey]: (prev[binKey] || 0) + 1 };
      });
      setRealBrandCounts((prev) => ({
        ...prev,
        [item.brandKey]: (prev[item.brandKey] || 0) + 1,
      }));
    }

    industrialAudio.playSortSuccess();
  }, [showToastError]);

  // Clear history action
  const executeClearHistory = useCallback(() => {
    industrialAudio.playClick();
    clearClassificationHistory(isSimulationRef.current);
    if (isSimulationRef.current) {
      setSimRecords([]);
      setSimBinCounts({ bin1: 0, bin2: 0, bin3: 0 });
      setSimBrandCounts({ brand_c: 0, brand_a: 0, brand_b: 0, brand_d: 0 });
      recentSortTimesSimRef.current = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("pbl3_product_seq");
      }
    } else {
      setRealRecords([]);
      setRealBinCounts({ bin1: 0, bin2: 0, bin3: 0 });
      setRealBrandCounts({ brand_c: 0, brand_a: 0, brand_b: 0, brand_d: 0 });
      recentSortTimesRealRef.current = [];
    }

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

    if (isSimulationRef.current) {
      setSimThroughput(resetPoints);
    } else {
      setRealThroughput(resetPoints);
    }
  }, []);

  // Clear specific bin
  const handleClearBin = useCallback((binIndex: 1 | 2 | 3) => {
    industrialAudio.playClick();
    
    // Luôn luôn gửi lệnh xuống phần cứng nếu có kết nối MQTT,
    // phòng trường hợp đang ở mode Thực tế hoặc hệ thống bị lệch đồng bộ
    if (onPublishCommand) {
      onPublishCommand("reset_bin", binIndex);
    }

    const isSim = isSimulationRef.current;
    const current = isSim ? simBinCountsRef.current : realBinCountsRef.current;
    const next = { ...current, [`bin${binIndex}`]: 0 } as BinCounts;
    saveBinCountsLocal(next, isSim);
    if (isSim) {
      setSimBinCounts(next);
    } else {
      setRealBinCounts(next);
    }
  }, [onPublishCommand, simBinCountsRef, realBinCountsRef]);

  // Clear alerts
  const handleClearAlerts = useCallback(() => {
    industrialAudio.playClick();
    clearAlertHistory();
    setAlerts([]);
  }, []);

  // Active data views based on current mode
  const records = isSimulation ? simRecords : realRecords;
  const binCounts = isSimulation ? simBinCounts : realBinCounts;
  const brandCounts = isSimulation ? simBrandCounts : realBrandCounts;
  const throughputHistory = isSimulation ? simThroughput : realThroughput;

  const setRecords = useCallback((action: React.SetStateAction<ClassificationRecord[]>) => {
    if (isSimulationRef.current) {
      setSimRecords(action);
    } else {
      setRealRecords(action);
    }
  }, []);

  const setBinCounts = useCallback(
    (action: React.SetStateAction<{ bin1: number; bin2: number; bin3: number }>) => {
      if (isSimulationRef.current) {
        setSimBinCounts(action);
      } else {
        setRealBinCounts(action);
      }
    },
    []
  );

  const setBrandCounts = useCallback(
    (action: React.SetStateAction<Record<string, number>>) => {
      if (isSimulationRef.current) {
        setSimBrandCounts(action);
      } else {
        setRealBrandCounts(action);
      }
    },
    []
  );

  // Unresolved alert count (BUG-05 fix)
  const unresolvedAlertCount = useMemo(
    () => alerts.filter((a) => !a.resolved).length,
    [alerts]
  );

  return {
    isClient,
    isSimulation,
    setIsSimulation,
    toggleSimulationMode,
    generateSimulationDemoData,
    isSimulationRef,
    simRecordsRef,
    realRecordsRef,
    simBinCountsRef,
    realBinCountsRef,
    recentSortTimesSimRef,
    recentSortTimesRealRef,
    records,
    setRecords,
    binCounts,
    setBinCounts,
    brandCounts,
    setBrandCounts,
    throughputHistory,
    setSimThroughput,
    setRealThroughput,
    alerts,
    setAlerts,
    handleClearAlerts,
    handleClearBin,
    unresolvedAlertCount,
    handleRealHardwareDetection,
    handleItemSorted,
    executeClearHistory,
  };
}
