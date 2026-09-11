"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VisualItem, TelemetryData, SorterConfig, CATALOG_BRANDS } from "@/lib/types";
import { determineTargetBin } from "@/lib/dataProcessor";
import { industrialAudio } from "@/lib/audioService";

export interface UseConveyorPhysicsProps {
  telemetryRef: React.MutableRefObject<TelemetryData>;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  configRef: React.MutableRefObject<SorterConfig>;
  isSimulationRef: React.MutableRefObject<boolean>;
  simRecordsRef: React.MutableRefObject<unknown[]>;
  onItemSorted: (item: VisualItem, actualBin: number) => void;
  onPublishCommand?: (cmd: string, value?: number) => void;
}

export function useConveyorPhysics({
  telemetryRef,
  setTelemetry,
  configRef,
  isSimulationRef,
  simRecordsRef,
  onItemSorted,
  onPublishCommand,
}: UseConveyorPhysicsProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [conveyorSpeed, setConveyorSpeed] = useState(65);
  const [arm1Active, setArm1Active] = useState(false);
  const [arm2Active, setArm2Active] = useState(false);
  const [visualItems, setVisualItems] = useState<VisualItem[]>([]);

  // Refs for requestAnimationFrame loop
  const animFrameRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]); // BUG-03: Track timeouts
  const visualItemsRef = useRef<VisualItem[]>(visualItems);
  visualItemsRef.current = visualItems;
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;
  const speedRef = useRef<number>(conveyorSpeed);
  speedRef.current = conveyorSpeed;
  const productSeqRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  // BUG-03: Helper to schedule tracked timeouts (auto-cleaned on unmount)
  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      fn();
      timeoutIdsRef.current = timeoutIdsRef.current.filter((tid) => tid !== id);
    }, ms);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  // Spawn visual package (Simulation mode)
  const spawnVisualPackage = useCallback(
    (brandKey?: string, productId?: string) => {
      if (!isSimulationRef.current) {
        console.warn("Chế độ máy thật: Các nút thả phôi ảo đã bị khóa!");
        return;
      }

      const brands = Object.keys(CATALOG_BRANDS);
      const chosenBrand = brandKey || brands[Math.floor(Math.random() * brands.length)];
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySimRecords = (simRecordsRef.current as { timestamp?: string }[]).filter(
        (r) => r.timestamp && r.timestamp.slice(0, 10) === todayStr
      );
      const currentSeq = todaySimRecords.length + visualItemsRef.current.length + 1;
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
        isSim: true,
      };
      setVisualItems((prev) => [...prev, newItem]);
      industrialAudio.playClick();
    },
    [configRef, isSimulationRef, simRecordsRef]
  );

  // Controls
  const handleToggleRun = useCallback(() => {
    industrialAudio.playClick();
    const nextState = !isRunningRef.current;
    setIsRunning(nextState);
    setTelemetry((prev) => ({ ...prev, conveyor_running: nextState }));
    onPublishCommand?.(nextState ? "START" : "STOP");
  }, [onPublishCommand, setTelemetry]);

  const handleEmergencyStop = useCallback(() => {
    industrialAudio.playEmergencyAlarm();
    setIsRunning(false);
    setTelemetry((prev) => ({
      ...prev,
      estop_pressed: true,
      conveyor_running: false,
    }));
    onPublishCommand?.("ESTOP");
  }, [onPublishCommand, setTelemetry]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setConveyorSpeed(newSpeed);
      setTelemetry((prev) => ({ ...prev, conveyor_speed: newSpeed }));
      onPublishCommand?.("SET_SPEED", newSpeed);
    },
    [onPublishCommand, setTelemetry]
  );

  const handleResetActuatorStates = useCallback(() => {
    setArm1Active(false);
    setArm2Active(false);
    setTelemetry((prev) => ({
      ...prev,
      s1_entry: false,
      s2_sorter1: false,
      s3_sorter2: false,
      arm1_active: false,
      arm2_active: false,
      estop_pressed: false,
    }));
  }, [setTelemetry]);

  // Main Conveyor Physics Loop
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const isBeltMoving =
        isRunningRef.current &&
        !telemetryRef.current.estop_pressed &&
        visualItemsRef.current.length > 0;

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

          // Sensor 1 Entry (14% - 17%)
          if (item.progress >= 14 && item.progress <= 17 && !item.s1Triggered) {
            item.s1Triggered = true;
            setTelemetry((prev) => ({ ...prev, s1_entry: true }));
            industrialAudio.playSensorBeep();
            scheduleTimeout(() => setTelemetry((prev) => ({ ...prev, s1_entry: false })), 300);
          }

          // Sensor 2 / Diverter Arm 1 (43% - 47%)
          if (item.progress >= 43 && item.progress <= 47 && !item.sorted) {
            setTelemetry((prev) => ({ ...prev, s2_sorter1: true }));
            scheduleTimeout(() => setTelemetry((prev) => ({ ...prev, s2_sorter1: false })), 250);
            if (item.targetBin === 1) {
              item.sorted = true;
              item.deflected = true;
              setArm1Active(true);
              industrialAudio.playServoArm();
              scheduleTimeout(() => setArm1Active(false), 450);
              onItemSorted(item, 1);
              updatedItems.push(item);
              continue;
            }
          }

          // Sensor 3 / Diverter Arm 2 (70% - 74%)
          if (item.progress >= 70 && item.progress <= 74 && !item.sorted) {
            setTelemetry((prev) => ({ ...prev, s3_sorter2: true }));
            scheduleTimeout(() => setTelemetry((prev) => ({ ...prev, s3_sorter2: false })), 250);
            if (item.targetBin === 2) {
              item.sorted = true;
              item.deflected = true;
              setArm2Active(true);
              industrialAudio.playServoArm();
              scheduleTimeout(() => setArm2Active(false), 450);
              onItemSorted(item, 2);
              updatedItems.push(item);
              continue;
            }
          }

          // End of belt / Default Bin 3 (96%)
          if (item.progress >= 96 && !item.sorted) {
            item.sorted = true;
            onItemSorted(item, 3);
            continue;
          }

          if (item.progress < 100) updatedItems.push(item);
        }
        
        // Cập nhật DOM ảo (React state) với tần số thấp hơn (30fps) để giảm overhead. 
        // 1000 / 30fps ~ 33ms
        if (!lastRenderTimeRef.current || time - lastRenderTimeRef.current > 33) {
          setVisualItems(updatedItems);
          lastRenderTimeRef.current = time;
        }
        // Luôn cập nhật ref ngay lập tức cho logic physics (chạy 60fps)
        visualItemsRef.current = updatedItems;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      // BUG-03: Cleanup all tracked timeouts on unmount
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, [onItemSorted, scheduleTimeout, setTelemetry, telemetryRef]);

  return {
    isRunning,
    setIsRunning,
    conveyorSpeed,
    setConveyorSpeed,
    arm1Active,
    arm2Active,
    visualItems,
    setVisualItems,
    visualItemsRef,
    isRunningRef,
    speedRef,
    productSeqRef,
    spawnVisualPackage,
    handleToggleRun,
    handleEmergencyStop,
    handleSpeedChange,
    handleResetActuatorStates,
  };
}
