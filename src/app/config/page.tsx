"use client";

import React from "react";
import { useDashboard } from "@/components/layout/DashboardLayout";
import { usePermission } from "@/contexts/AuthContext";
import { ConfigAndDiagnostics } from "@/components/ConfigAndDiagnostics";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function ConfigPage() {
  const {
    sorterConfig,
    telemetry,
    alerts,
    pingMs,
    handleSaveAndPublishConfig,
    configStatusMsg,
    handleClearAlerts,
    handleResetConfigToDefault,
  } = useDashboard();
  const canEdit = usePermission("config.edit");
  const router = useRouter();

  // Redirect if no permission
  React.useEffect(() => {
    if (!canEdit) {
      router.replace("/");
    }
  }, [canEdit, router]);

  if (!canEdit) return null;

  return (
    <div className="min-h-[calc(100vh-7.5rem)] w-full flex flex-col pb-6 animate-in fade-in duration-300">
      <ConfigAndDiagnostics
        config={sorterConfig}
        telemetry={telemetry}
        alerts={alerts}
        pingMs={pingMs}
        onSaveConfig={handleSaveAndPublishConfig}
        applyStatusText={configStatusMsg}
        onClearAlerts={handleClearAlerts}
        onResetDefaultConfig={handleResetConfigToDefault}
      />
    </div>
  );
}
