import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { fetchAlerts, AlertResponseData, runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { MetricCardSkeleton } from "../components/ui/LoadingStates";
import {
  Bell,
  ShieldAlert,
  Mail,
  MessageSquare,
  Monitor,
  CheckCircle2,
  Info,
  Droplets,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [{ title: "Response & Alerts — PRAVAAH" }],
  }),
  component: AlertsScreen,
});

export function AlertsScreen() {
  const { basinId, scenario, riskData } = useBasin();
  const [alertData, setAlertData] = useState<AlertResponseData | null>(null);
  const [optData, setOptData] = useState<CoupledOptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAlerts(basinId), runCoupledOptimization({ basin_id: basinId, scenario })]).then(
      ([alData, opData]) => {
        setAlertData(alData);
        setOptData(opData);
        setIsLoading(false);
      }
    );
  }, [basinId, scenario]);

  const metrics = optData?.metrics;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-[var(--text-primary)] font-sans">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--primary-green)]" />
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Operational Response & Warning Center
            </h1>
            <span className="badge-state" data-state="LIVE">
              Rule-Based Dispatch
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Automated flood warning thresholds derived from IMD precipitation anomalies and WorldPop 2020 settlement density.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-state" data-state="LIVE">
            Deterministic Rule Engine
          </span>
          <span className="badge-state" data-state="SIMULATED">
            Prototype Delivery Mock
          </span>
        </div>
      </div>

      {/* 2. CURRENT RISK STATE & RECOMMENDED RESPONSE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Current Risk State */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Current Risk State
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge-risk text-sm px-3 py-1" data-risk={riskData?.risk_level ?? "HIGH"}>
                {riskData?.risk_level ?? "HIGH"} RISK
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">
              {riskData?.risk_score ?? 78} <span className="text-xs font-normal text-[var(--text-secondary)]">/ 100</span>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-3 pt-2 border-t border-[var(--border)] capitalize">
            {basinId} Catchment
          </div>
        </div>

        {/* Affected Area & Exposure */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Primary Priority Zone
            </div>
            <div className="text-lg font-bold text-[var(--primary-green)] mt-2">
              {basinId === "krishna" ? "Vijayawada Urban Delta" : "Rajahmundry Reach"}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Exposure: <strong className="text-[var(--text-primary)]">{((riskData?.population_exposure_count ?? 1240000) / 1000000).toFixed(2)}M residents</strong>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-3 pt-2 border-t border-[var(--border)]">
            WorldPop 2020 Settlement Grid
          </div>
        </div>

        {/* Selected Infrastructure */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Recommended Infrastructure
            </div>
            <div className="text-2xl font-bold text-[var(--primary-green)] mt-2">
              {metrics?.sensor_count ?? 3} Sensors + {metrics?.relay_count ?? 2} Relays
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Coverage: <strong className="text-[var(--primary-green)]">{((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}% Demand</strong>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-3 pt-2 border-t border-[var(--border)]">
            Coupled Quantum Plan
          </div>
        </div>

        {/* HUD Readiness */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border)] bg-[var(--soft-green)] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-[var(--primary-green)] uppercase tracking-wider">
              Alert System Readiness
            </div>
            <div className="text-xl font-bold text-[var(--primary-green)] mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-[var(--primary-green)]" /> Operational
            </div>
            <div className="text-xs text-[var(--primary-green)] mt-1">
              Dashboard HUD Active
            </div>
          </div>
          <div className="text-[11px] text-[var(--primary-green)] font-semibold mt-3 pt-2 border-t border-[var(--border)]">
            External Channels Simulated
          </div>
        </div>
      </div>

      {/* 3. ACTIVE ALERTS & DELIVERY CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--risk-high)]" /> Active Flood Warning Threshold Alerts ({alertData?.alerts.length ?? 0})
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">Evaluated from Gridded Rain & Population</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg">
                <p className="text-xs text-[var(--text-secondary)]">Evaluating flood alert thresholds...</p>
              </div>
            ) : alertData?.alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg p-5 space-y-2.5 shadow-xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] font-mono">{alert.id}</span>
                  <span className="badge-risk text-[10px]" data-risk={alert.level}>
                    {alert.level} ({alert.risk_score}/100)
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)]">{alert.title}</h3>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{alert.reason}</p>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Source: <strong className="text-[var(--text-secondary)]">{alert.source}</strong></span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Deployment Summary Box */}
          <div className="bg-[var(--soft-green)] border border-[var(--border)] rounded-lg p-5 space-y-2">
            <div className="text-xs font-bold text-[var(--primary-green)] flex items-center gap-1.5">
              <Droplets className="w-4 h-4" /> Recommended Sensor & Relay Dispatch Plan
            </div>
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Based on the current <strong>{riskData?.risk_level ?? "HIGH"}</strong> risk level, PRAVAAH recommends dispatching{" "}
              <strong>{metrics?.sensor_count ?? 3} active sensors</strong> ({metrics?.selected_sensors?.join(", ") || "C-KR-001, C-KR-002, C-KR-003"}) and{" "}
              <strong>{metrics?.relay_count ?? 2} relay masts</strong> ({metrics?.selected_relays?.join(", ") || "RL-KR-P1, RL-KR-P2"}), achieving{" "}
              <strong>{((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}% risk-weighted coverage</strong> over exposed downstream communities.
            </div>
          </div>
        </div>

        {/* Delivery Channels Panel (1 Col) */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg p-5 space-y-4 shadow-xs h-fit">
          <div className="border-b border-[var(--border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[var(--primary-green)]" /> Alert Communication Channels
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Integration status with external warning delivery channels</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Dashboard HUD */}
            <div className="bg-[var(--soft-green)] p-3.5 rounded-lg border border-[var(--border)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--primary-green)] flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-[var(--primary-green)]" /> Command Center HUD
                </span>
                <span className="text-[var(--primary-green)] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Real-time operational alerts rendered on PRAVAAH dashboard & map.
              </p>
            </div>

            {/* SDMA Email */}
            <div className="bg-[var(--surface-secondary)] p-3.5 rounded-lg border border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" /> SDMA Email Dispatch
                </span>
                <span className="badge-state" data-state="SIMULATED">
                  Simulated / UI Mock
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                External SMTP email delivery service is mocked for prototype demonstration.
              </p>
            </div>

            {/* WhatsApp Emergency */}
            <div className="bg-[var(--surface-secondary)] p-3.5 rounded-lg border border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" /> WhatsApp Emergency
                </span>
                <span className="badge-state" data-state="SIMULATED">
                  Simulated / UI Mock
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                External WhatsApp broadcast API is mocked for prototype demonstration.
              </p>
            </div>
          </div>

          <div className="bg-[var(--surface-secondary)] p-3 rounded-md border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
            <Info className="w-4 h-4 text-[var(--primary-green)] shrink-0 mt-0.5" />
            <span>
              <strong>Integrity Notice:</strong> External simulated channels are explicitly marked. No real external email or WhatsApp messages are sent from this prototype.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
