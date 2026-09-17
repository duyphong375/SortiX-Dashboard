"use client";

import React from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { KpiStatGrid } from "@/components/overview/KpiStatGrid";
import { LiveHealthAndBinWidget } from "@/components/overview/LiveHealthAndBinWidget";
import { CalendarWidget } from "@/components/overview/CalendarWidget";
import { RecentActivityList } from "@/components/overview/RecentActivityList";

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
  } = useDashboard();

  const totalSorted = binCounts.bin1 + binCounts.bin2 + binCounts.bin3;

  // Xác định ESP32 có đang online thực sự hay không
  const isEspConnected =
    !isSimulation &&
    mqttStatus === "connected" &&
    telemetry.last_heartbeat !== "" &&
    Date.now() - new Date(telemetry.last_heartbeat).getTime() < 15000;

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
        pingMs={pingMs}
      />

      {/* HÀNG 2: GIÁM SÁT NHANH & LỊCH VẬN HÀNH */}
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
            handleToggleRun={handleToggleRun}
            handleEmergencyStop={handleEmergencyStop}
          />
        </div>

        {/* Cột 2 (1/3 chiều rộng): Bộ Lọc Thống Kê Theo Ngày */}
        <CalendarWidget
          records={records}
          bin1Brands={bin1Brands}
          bin2Brands={bin2Brands}
        />
      </div>

      {/* HÀNG 3: NHẬT KÝ HOẠT ĐỘNG MỚI NHẤT (5 BẢN GHI TÓM TẮT) */}
      <RecentActivityList records={records} />
    </div>
  );
}
