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
  clearClassificationHistory,
  loadBinCountsLocal,
  updateBinCountsLocal,
  loadBrandCountsLocal,
  loadOperatingMode,
  saveOperatingMode,
  loadAlertHistory,
  clearAlertHistory,
} from "@/lib/history";
import { industrialAudio } from "@/lib/audioService";
import { triggerAlertDispatch } from "@/lib/alertService";
import { useToast } from "@/components/ui/Toast";

export interface UseSorterDataProps {
  configRef: React.MutableRefObject<SorterConfig>;
  onSpawnRealVisualItem?: (item: VisualItem) => void;
  telemetryRef?: React.MutableRefObject<any>;
}

export function useSorterData({ configRef, onSpawnRealVisualItem, telemetryRef }: UseSorterDataProps) {
  const [isClient, setIsClient] = useState(false);
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const toast = useToast();

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

  // Record Real Detection from MQTT Vision Camera (YOLOv8)
  const handleRealHardwareDetection = useCallback(
    (detection: VisionDetection) => {
      const targetBin = determineTargetBin(detection.brand_id, configRef.current);
      const brand = CATALOG_BRANDS[detection.brand_id];
      const record: ClassificationRecord = {
        id: `real_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        product_id: detection.product_id,
        brand_id: detection.brand_id,
        brand_name: brand?.name || getBrandName(detection.brand_id),
        confidence: detection.confidence,
        target_bin: targetBin,
        actual_bin: targetBin,
        status: "success",
        timestamp: detection.timestamp || new Date().toISOString(),
      };

      recentSortTimesRealRef.current.push(Date.now());
      saveClassificationRecord(record, false);
      updateBinCountsLocal(targetBin, false);
      setRealRecords((prev) => [record, ...prev].slice(0, 500));
      setRealBinCounts((prev: BinCounts) => {
        const binKey = `bin${targetBin}` as "bin1" | "bin2" | "bin3";
        return { ...prev, [binKey]: (prev[binKey] || 0) + 1 };
      });
      setRealBrandCounts((prev) => ({
        ...prev,
        [detection.brand_id]: (prev[detection.brand_id] || 0) + 1,
      }));

      // Direct visualization on belt if in Real Mode (BUG-04: marked as preRecorded)
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
          isSim: false,
          preRecorded: true,
        };
        onSpawnRealVisualItem(newItem);
      }
    },
    [configRef, onSpawnRealVisualItem]
  );

  // Record sorted item from conveyor physics loop
  const handleItemSorted = useCallback((item: VisualItem, actualBin: number) => {
    // BUG-04: If preRecorded, only play sound, don't re-record
    if (item.preRecorded) {
      industrialAudio.playSortSuccess();
      return;
    }

    const isSim = item.isSim;
    const isCorrect = item.targetBin === actualBin;
    const brand = CATALOG_BRANDS[item.brandKey];
    const record: ClassificationRecord = {
      id: `${isSim ? "sim" : "real"}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      product_id: item.id,
      brand_id: item.brandKey,
      brand_name: brand?.name || getBrandName(item.brandKey),
      confidence: 0.94 + Math.random() * 0.05,
      target_bin: item.targetBin,
      actual_bin: actualBin,
      status: isCorrect ? "success" : "diverted_default",
      timestamp: new Date().toISOString(),
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
      setTimeout(() => toast.error(alert.description), 0);
    }

    if (isSim) {
      recentSortTimesSimRef.current.push(Date.now());
      saveClassificationRecord(record, true);
      updateBinCountsLocal(actualBin, true);
      setSimRecords((prev) => [record, ...prev].slice(0, 500));
      setSimBinCounts((prev: BinCounts) => {
        const binKey = `bin${actualBin}` as "bin1" | "bin2" | "bin3";
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
        return { ...prev, [binKey]: (prev[binKey] || 0) + 1 };
      });
      setRealBrandCounts((prev) => ({
        ...prev,
        [item.brandKey]: (prev[item.brandKey] || 0) + 1,
      }));
    }

    industrialAudio.playSortSuccess();
  }, []);

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
    unresolvedAlertCount,
    handleRealHardwareDetection,
    handleItemSorted,
    executeClearHistory,
  };
}
