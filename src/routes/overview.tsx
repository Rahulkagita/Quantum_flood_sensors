import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { ShieldAlert, Radio, Activity, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [{ title: "Overview — Quantum Flood Response Command Center" }]
  }),
  component: OverviewScreen,
});

export function OverviewScreen() {
  const { basinId, riskData, scenario } = useBasin();
  const [optData, setOptData] = useState<CoupledOptimizationResponse | null>(null);

  useEffect(() => {
    runCoupledOptimization({ basin_id: basinId, scenario }).then(setOptData);
  }, [basinId, scenario]);

  const metrics = optData?.metrics;

  return (
    <div className="relative w-full min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      {/* Hero Geospatial Map */}
      <CommandMap
        basinId={basinId}
        selectedSensors={metrics?.selected_sensors || []}
        selectedRelays={metrics?.selected_relays || []}
      />

      {/* Floating HUD Panel — Top Right Operational Status */}
      <div className="absolute top-4 right-4 z-20 w-80 hud-card p-4 space-y-4 border border-slate-700/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            {basinId.toUpperCase()} OPERATIONAL STATUS
          </span>
          <span className="badge-state" data-state="LIVE">LIVE ENGINE</span>
        </div>

        {/* Risk Score */}
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 font-mono">FLOOD RISK INDEX</div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-bold text-amber-400">
              {riskData?.risk_score ?? 78}<span className="text-sm text-slate-500">/100</span>
            </span>
            <span className="badge-risk" data-risk={riskData?.risk_level ?? "WARNING"}>
              {riskData?.risk_level ?? "WARNING"}
            </span>
          </div>
        </div>

        {/* Key Operational KPIs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">HAZARD PROB.</div>
            <div className="text-cyan-400 font-bold text-sm">
              {((metrics?.forecast_probability ?? 0.85) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">EXPOSED POP.</div>
            <div className="text-slate-200 font-bold text-sm">
              {((riskData?.population_exposure_count ?? 1240000) / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">COVERAGE RATIO</div>
            <div className="text-emerald-400 font-bold text-sm">
              {((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">QAOA APPROX.</div>
            <div className="text-purple-400 font-bold text-sm">
              {((metrics?.approximation_ratio ?? 0.9929) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Compact Recommended Response */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> RECOMMENDED RESPONSE
            </span>
            <span className="badge-state" data-state="OPTIMIZED">QAOA p=1</span>
          </div>

          <div className="text-xs space-y-1 bg-slate-950/80 p-2.5 rounded border border-slate-800/80 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Deployed Sensors:</span>
              <span className="text-cyan-300 font-bold">{metrics?.sensor_count ?? 3} Sites</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deployed Relays:</span>
              <span className="text-purple-300 font-bold">{metrics?.relay_count ?? 2} Nodes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">High-Risk Coverage:</span>
              <span className="text-emerald-400 font-bold">
                {((metrics?.high_risk_coverage ?? 0.884) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Disconnected Sensors:</span>
              <span className="text-slate-300 font-bold">
                {metrics?.disconnected_sensors.length ?? 0}
              </span>
            </div>
          </div>

          <Link
            to="/quantum-optimizer"
            className="w-full mt-2 py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold rounded flex items-center justify-center gap-1 transition-colors"
          >
            INSPECT QUANTUM PIPELINE <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
