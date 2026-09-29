"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { KpiStatGrid } from "@/components/overview/KpiStatGrid";
import { LiveHealthAndBinWidget } from "@/components/overview/LiveHealthAndBinWidget";
import { CalendarWidget } from "@/components/overview/CalendarWidget";
import { RecentActivityList } from "@/components/overview/RecentActivityList";
import { TemperatureGaugeWidget } from "@/components/ui/TemperatureGaugeWidget";
import { calculateDailyTotalProduction } from "@/lib/history";

export default function DashboardPage() {
  const {
    telemetry,
    mqttStatus,
    records,
    binCounts,
    visualItems,
    isRunning,
    conveyorSpeed,
    sorterConfig,
    handleToggleRun,
    handleEmergencyStop,
    pingMs,
    isSimulation,
    isDeviceOffline,
    handleSetBinCount,
    binCapacities,
    handleSetBinCapacity,
    handleTriggerTemperatureWarning,
    handleCoolDownTemperature,
  } = useDashboard();

  // Tổng sản lượng tích lũy trong ca/ngày (không bị sụt giảm hay mất số liệu khi công nhân dọn khay)
  const totalSorted = useMemo(() => {
    return calculateDailyTotalProduction(records, binCounts);
  }, [records, binCounts]);

  // Xác định ESP32 có đang online thực sự hay không (nhịp tim ping mỗi 2s, quá 6s coi như ngắt)
  const isEspConnected =
    !isDeviceOffline &&
    !isSimulation &&
    mqttStatus === "connected" &&
    telemetry.last_heartbeat !== "" &&
    Date.now() - new Date(telemetry.last_heartbeat).getTime() < 6000;

  // Tính độ tin cậy AI trung bình thực tế từ danh sách records
  const avgConfidence =
    !isEspConnected && !isSimulation
      ? "--%"
      : records.length > 0
      ? (
          (records.reduce((acc, r) => acc + (r.confidence || 0.95), 0) / records.length) *
          100
        ).toFixed(1) + "%"
      : "--%";

  // Nhãn phân loại theo từng máng
  const bin1Brands = sorterConfig?.bins?.[0]?.brand_ids || [];
  const bin2Brands = sorterConfig?.bins?.[1]?.brand_ids || [];
  const bin3Brands = sorterConfig?.bins?.[2]?.brand_ids || [];

  return (
    <div className="space-y-6 page-transition-enter pb-6">
      {/* HÀNG 1: 4 THẺ KPI TINH GỌN */}
      <KpiStatGrid
        totalSorted={totalSorted}
        binCounts={binCounts}
        telemetry={telemetry}
        isEspConnected={isEspConnected}
        isSimulation={isSimulation}
        isRunning={isRunning}
        conveyorSpeed={conveyorSpeed}
        visualItemsCount={visualItems.length}
        avgConfidence={avgConfidence}
        sampleCount={records.length}
        pingMs={pingMs}
        isDeviceOffline={isDeviceOffline}
      />

      {/* HÀNG 2: GIÁM SÁT NHANH & TÓM TẮT HÔM NAY */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Cột 1 (2/3 chiều rộng): Live Sorter Health & 3 Bins */}
        <div className="xl:col-span-2">
          <LiveHealthAndBinWidget
            telemetry={telemetry}
            mqttStatus={mqttStatus}
            isEspConnected={isEspConnected}
            isSimulation={isSimulation}
            isRunning={isRunning}
            binCounts={binCounts}
            bin1Brands={bin1Brands}
            bin2Brands={bin2Brands}
            bin3Brands={bin3Brands}
            handleToggleRun={handleToggleRun}
            handleEmergencyStop={handleEmergencyStop}
            isDeviceOffline={isDeviceOffline}
            onSetBinCount={handleSetBinCount}
            binCapacities={binCapacities}
            onSetBinCapacity={handleSetBinCapacity}
          />
        </div>

        {/* Cột 2 (1/3 chiều rộng): Đồng Hồ Đo Nhiệt Độ Gauge & Tóm Tắt Hôm Nay */}
        <div className="space-y-4">
          <TemperatureGaugeWidget
            currentTemp={telemetry.cpu_temp}
            thresholdTemp={75.0}
            deviceName="Cảm biến nhiệt độ nội vi ESP32-C5"
            isOnline={isEspConnected || isSimulation}
            isSimulation={isSimulation}
            showSimulationControls={false}
          />
          <CalendarWidget
            records={records}
            bin1Brands={bin1Brands}
            bin2Brands={bin2Brands}
            compact={true}
          />
        </div>
      </div>

      {/* HÀNG 3: NHẬT KÝ HOẠT ĐỘNG MỚI NHẤT (5 BẢN GHI TÓM TẮT) */}
      <RecentActivityList records={records} />
    </div>
  );
}
