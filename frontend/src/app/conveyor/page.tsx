"use client";

import React from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { useAuth, usePermission } from "@/contexts/AuthContext";
import { ConveyorVisualizer } from "@/components/ConveyorVisualizer";
import { ShieldAlert } from "lucide-react";

export default function ConveyorPage() {
  const {
    telemetry,
    sorterConfig,
    visualItems,
    isRunning,
    conveyorSpeed,
    handleToggleRun,
    handleEmergencyStop,
    handleSpeedChange,
    spawnVisualPackage,
    arm1Active,
    arm2Active,
    binCounts,
    brandCounts,
    isSimulation,
    toggleSimulationMode,
    generateSimulationDemoData,
    handleClearBin,
  } = useDashboard();

  const canEstop = usePermission("conveyor.estop");

  // Wrap E-Stop để kiểm tra quyền
  const wrappedEmergencyStop = () => {
    if (!canEstop) return;
    handleEmergencyStop();
  };

  return (
    <div className="min-h-[calc(100vh-7.5rem)] w-full flex flex-col pb-4 animate-in fade-in duration-300">
      {/* Permission warning cho User */}
      {!canEstop && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Bạn đang ở chế độ Vận Hành — nút E-Stop bị khóa (chỉ Admin mới sử dụng được)</span>
        </div>
      )}

      <ConveyorVisualizer
        telemetry={telemetry}
        config={sorterConfig}
        items={visualItems}
        isRunning={isRunning}
        speed={conveyorSpeed}
        onToggleRun={handleToggleRun}
        onEmergencyStop={wrappedEmergencyStop}
        onSpeedChange={handleSpeedChange}
        onSpawnPackage={spawnVisualPackage}
        arm1Active={arm1Active}
        arm2Active={arm2Active}
        binCounts={binCounts}
        brandCounts={brandCounts}
        isSimulation={isSimulation}
        onToggleSimulationMode={toggleSimulationMode}
        onGenerateDemoData={generateSimulationDemoData}
        onClearBin={handleClearBin}
      />
    </div>
  );
}
