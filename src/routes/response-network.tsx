import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { Network, Radio, CheckCircle, Wifi } from "lucide-react";

export const Route = createFileRoute("/response-network")({
  head: () => ({
    meta: [{ title: "Response Network — Quantum Flood Response Command Center" }]
  }),
  component: ResponseNetworkScreen,
});

export function ResponseNetworkScreen() {
  const { basinId, scenario } = useBasin();
  const [optData, setOptData] = useState<CoupledOptimizationResponse | null>(null);

  useEffect(() => {
    runCoupledOptimization({ basin_id: basinId, scenario }).then(setOptData);
  }, [basinId, scenario]);

  const metrics = optData?.metrics;

  const topologyLinks = [
    { sensor: "C-KR-001 (Vijayawada Delta)", relay: "RL-KR-P1 (Prakasam Node)", distance: "8.4 km", status: "CONNECTED" },
    { sensor: "C-KR-002 (Kolluru Floodplain)", relay: "RL-KR-P1 (Prakasam Node)", distance: "12.1 km", status: "CONNECTED" },
    { sensor: "C-KR-003 (Avanigadda Coast)", relay: "RL-KR-P2 (Delta Relay)", distance: "9.8 km", status: "CONNECTED" }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-mono">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" /> DISASTER RESPONSE NETWORK TOPOLOGY
            </h1>
            <span className="badge-state" data-state="OPTIMIZED">OPTIMIZED NETWORK</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Coupled Sensor Placement & Communication Relay Network · {basinId.toUpperCase()} BASIN
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-state" data-state="LIVE">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" /> 0 DISCONNECTED SENSORS
          </span>
        </div>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-1">
          <div className="text-xs text-slate-400">DEPLOYED SENSORS</div>
          <div className="text-3xl font-bold text-cyan-400">
            {metrics?.sensor_count ?? 3}
          </div>
          <div className="text-[11px] text-slate-500">Target Budget K_max=3</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-1">
          <div className="text-xs text-slate-400">COMM RELAYS</div>
          <div className="text-3xl font-bold text-purple-400">
            {metrics?.relay_count ?? 2}
          </div>
          <div className="text-[11px] text-slate-500">Target Budget M_max=2</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-1">
          <div className="text-xs text-slate-400">RISK-WEIGHTED COVERAGE</div>
          <div className="text-3xl font-bold text-emerald-400">
            {((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500">High-Risk Spatial Demand</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-1">
          <div className="text-xs text-slate-400">POPULATION COVERAGE</div>
          <div className="text-3xl font-bold text-slate-200">
            {((metrics?.population_weighted_coverage ?? 0.912) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500">Downstream Urban Delta</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-1">
          <div className="text-xs text-slate-400">UNCOVERED DEMAND</div>
          <div className="text-3xl font-bold text-amber-400">
            {metrics?.uncovered_high_risk_demand ?? 18.5}
          </div>
          <div className="text-[11px] text-slate-500">Low-Exposure Fringes</div>
        </div>
      </div>

      {/* Map & Topology Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-[420px] rounded border border-slate-800 overflow-hidden relative">
          <CommandMap
            basinId={basinId}
            selectedSensors={metrics?.selected_sensors || []}
            selectedRelays={metrics?.selected_relays || []}
            height="100%"
          />
        </div>

        {/* Network Topology Links List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" /> SENSOR-TO-RELAY LINKS
          </h2>

          <div className="space-y-3 text-xs">
            {topologyLinks.map((link, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{link.sensor.split(" ")[0]}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-purple-400 font-bold">{link.relay.split(" ")[0]}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Comm Range: {link.distance}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {link.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
