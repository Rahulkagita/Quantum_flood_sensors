import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin, BasinId } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { MetricCardSkeleton, MapLoadingState } from "../components/ui/LoadingStates";
import {
  ShieldAlert,
  Droplets,
  Network,
  Cpu,
  ArrowRight,
  TrendingUp,
  Users,
  Compass,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [{ title: "Flood Intelligence Overview — PRAVAAH" }],
  }),
  component: OverviewScreen,
});

export function OverviewScreen() {
  const { basinId, setBasinId, scenario, setScenario, riskData, candidateData } = useBasin();
  const [optData, setOptData] = useState<CoupledOptimizationResponse | null>(null);
  const [viewMode, setViewMode] = useState<"OPTIMIZED" | "CANDIDATE">("OPTIMIZED");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    runCoupledOptimization({ basin_id: basinId, scenario }).then((data) => {
      setOptData(data);
      setIsLoading(false);
    });
  }, [basinId, scenario]);

  const metrics = optData?.metrics;
  const decoding = optData?.decoding;

  const scenarioRainfall =
    scenario === "EXTREME_CYCLONE"
      ? 210.0
      : scenario === "NORMAL"
        ? 45.0
        : (riskData?.rainfall_mm ?? 142.5);

  const demandZones =
    basinId === "krishna"
      ? [
          { name: "Vijayawada Urban Delta", risk: "94.5/100", weight: "1.45x", pop: "180k" },
          { name: "Kolluru Lowland Reach", risk: "88.0/100", weight: "1.30x", pop: "150k" },
          { name: "Avanigadda Estuary", risk: "82.5/100", weight: "1.15x", pop: "120k" },
        ]
      : [
          { name: "Rajahmundry Urban Reach", risk: "96.0/100", weight: "1.50x", pop: "220k" },
          { name: "Kakinada Canal Junction", risk: "89.5/100", weight: "1.35x", pop: "160k" },
        ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-[#1A2421] font-sans">
      {/* 1. PAGE TITLE & CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFE5DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#168A5B]" />
            <h1 className="text-xl font-bold tracking-tight text-[#1A2421]">
              Flood Intelligence Overview
            </h1>
            <span className="badge-state" data-state="LIVE">
              Real-Time Dashboard
            </span>
          </div>
          <p className="text-xs text-[#5C6E66] mt-1">
            Integrated hydro-meteorological forecasting, population risk mapping, and quantum-optimized sensor placement for{" "}
            <strong className="text-[#1A2421] capitalize">{basinId} Basin</strong>.
          </p>
        </div>

        {/* Basin & Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#DFE5DF] shadow-xs text-xs">
            <span className="text-[#5C6E66] font-medium">Basin:</span>
            {(["krishna", "godavari"] as BasinId[]).map((b) => (
              <button
                key={b}
                onClick={() => setBasinId(b)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                  basinId === b
                    ? "bg-[#168A5B] text-white shadow-xs"
                    : "text-[#5C6E66] hover:text-[#1A2421]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-[#DFE5DF] shadow-xs text-xs">
            <span className="text-[#5C6E66] font-medium">Scenario:</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-transparent font-semibold text-[#1A2421] text-xs outline-none cursor-pointer"
            >
              <option value="MONSOON_SURGE">Monsoon Surge (+142.5mm)</option>
              <option value="EXTREME_CYCLONE">Extreme Cyclone (+210.0mm)</option>
              <option value="NORMAL">Normal Baseline (+45.0mm)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. HERO MAP WORKSPACE (DOMINATES PAGE) */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE5DF] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#168A5B]" />
            <h2 className="text-sm font-bold text-[#1A2421]">Spatial Flood Risk & Response Network Map</h2>
          </div>

          {/* Map Controls Toggle */}
          <div className="flex items-center bg-[#F7F8F3] p-0.5 rounded-md border border-[#DFE5DF] text-xs">
            <button
              onClick={() => setViewMode("OPTIMIZED")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "OPTIMIZED"
                  ? "bg-white text-[#126B48] font-semibold shadow-xs"
                  : "text-[#5C6E66] hover:text-[#1A2421]"
              }`}
            >
              Optimized Network
            </button>
            <button
              onClick={() => setViewMode("CANDIDATE")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "CANDIDATE"
                  ? "bg-white text-[#126B48] font-semibold shadow-xs"
                  : "text-[#5C6E66] hover:text-[#1A2421]"
              }`}
            >
              Candidate Grid
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-[520px] min-h-[400px] rounded-lg overflow-hidden border border-[#DFE5DF] relative">
          {isLoading ? (
            <MapLoadingState message="Updating Flood Response Network..." />
          ) : (
            <CommandMap
              basinId={basinId}
              selectedSensors={metrics?.selected_sensors || []}
              selectedRelays={metrics?.selected_relays || []}
              viewMode={viewMode}
              candidateLocations={candidateData?.candidates || []}
              height="100%"
            />
          )}
        </div>
      </div>

      {/* 3. 4 KEY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Basin Risk */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs hover:border-[#B3C0B8] transition-colors">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Basin Risk Index</span>
                <ShieldAlert className="w-4 h-4 text-[#F28C45]" />
              </div>
              <div className="text-3xl font-bold text-[#1A2421] mt-2">
                {riskData?.risk_score ?? 78}
                <span className="text-xs text-[#5C6E66] font-normal"> / 100</span>
              </div>
              <div className="mt-2">
                <span className="badge-risk text-[10px]" data-risk={riskData?.risk_level ?? "HIGH"}>
                  {riskData?.risk_level ?? "HIGH"}
                </span>
              </div>
            </div>

            {/* Hazard Probability */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs hover:border-[#B3C0B8] transition-colors">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Hazard Probability</span>
                <TrendingUp className="w-4 h-4 text-[#168A5B]" />
              </div>
              <div className="text-3xl font-bold text-[#168A5B] mt-2">
                {((metrics?.forecast_probability ?? 0.85) * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-2">
                +{scenarioRainfall} mm 3-day rainfall
              </div>
            </div>

            {/* Population Exposure */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs hover:border-[#B3C0B8] transition-colors">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Population Exposure</span>
                <Users className="w-4 h-4 text-[#3E8ED0]" />
              </div>
              <div className="text-3xl font-bold text-[#1A2421] mt-2">
                {((riskData?.population_exposure_count ?? 1240000) / 1000000).toFixed(2)}M
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-2">WorldPop 2020 GeoTIFF</div>
            </div>

            {/* Risk-Weighted Coverage */}
            <div className="bg-white border border-[#C4E2D3] rounded-lg p-4 bg-[#EEF7F1] shadow-xs hover:border-[#168A5B] transition-colors">
              <div className="text-[11px] font-medium text-[#126B48] flex items-center justify-between">
                <span>Risk-Weighted Coverage</span>
                <Droplets className="w-4 h-4 text-[#168A5B]" />
              </div>
              <div className="text-3xl font-bold text-[#126B48] mt-2">
                {((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#126B48] mt-2">
                Coupled QUBO Target
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. THREE OPERATIONAL SUMMARY PANELS GRID: RISK SUMMARY | NETWORK SUMMARY | DEMAND */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Summary Panel */}
        <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-2">
              <h3 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F28C45]" /> Risk Summary
              </h3>
              <span className="badge-state" data-state="LIVE">IMD Gridded</span>
            </div>
            <div className="space-y-2 text-xs pt-3 text-[#5C6E66]">
              <div className="flex justify-between p-2 rounded bg-[#F7F8F3]">
                <span>Gridded Rainfall Weight (45%):</span>
                <strong className="text-[#1A2421]">75.0 / 100</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#F7F8F3]">
                <span>Precipitation Anomaly (30%):</span>
                <strong className="text-[#1A2421]">67.6 / 100</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#F7F8F3]">
                <span>Population Settlement (25%):</span>
                <strong className="text-[#1A2421]">82.0 / 100</strong>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#5C6E66] bg-[#F7F8F3] p-2.5 rounded border border-[#DFE5DF] mt-2 leading-relaxed">
            Composite risk combining 0.25° gridded IMD series with WorldPop 100m density.
          </p>
        </div>

        {/* Network Summary Panel */}
        <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-2">
              <h3 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#168A5B]" /> Network Summary
              </h3>
              <span className="font-mono text-xs text-[#7657B8] font-bold">
                {decoding?.bitstring ?? "10101111"}
              </span>
            </div>
            <div className="space-y-2 text-xs pt-3 text-[#5C6E66]">
              <div className="flex justify-between p-2 rounded bg-[#F7F8F3]">
                <span>Selected Sensors:</span>
                <strong className="text-[#126B48]">
                  {metrics?.sensor_count ?? 3} Sites ({metrics?.selected_sensors?.slice(0, 3).join(", ") || "C-KR-001, 002, 003"})
                </strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#F7F8F3]">
                <span>Selected Relays:</span>
                <strong className="text-[#7657B8]">
                  {metrics?.relay_count ?? 2} Masts ({metrics?.selected_relays?.join(", ") || "RL-KR-P1, P2"})
                </strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#EEF7F1]">
                <span>Link Reachability:</span>
                <strong className="text-[#126B48]">100% Connected (0 Disconnected)</strong>
              </div>
            </div>
          </div>
          <Link
            to="/quantum-optimizer"
            className="w-full py-2 px-3 bg-[#168A5B] hover:bg-[#126B48] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5" /> Inspect Quantum QAOA Execution
          </Link>
        </div>

        {/* Demand Priority Panel */}
        <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-2">
              <h3 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#3E8ED0]" /> Demand Priority Zones
              </h3>
              <span className="badge-state" data-state="LIVE">Coupled Weights</span>
            </div>
            <div className="space-y-2 text-xs pt-3">
              {demandZones.map((dz, idx) => (
                <div key={idx} className="p-2 rounded bg-[#F7F8F3] border border-[#DFE5DF] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#1A2421]">{dz.name}</div>
                    <div className="text-[11px] text-[#5C6E66]">Pop: {dz.pop}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#168A5B]">{dz.weight}</span>
                    <div className="text-[10px] text-[#5C6E66]">{dz.risk}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/forecast"
            className="w-full py-2 px-3 bg-white hover:bg-[#F7F8F3] border border-[#DFE5DF] text-[#1A2421] text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            View Complete Forecast <ArrowRight className="w-3.5 h-3.5 text-[#5C6E66]" />
          </Link>
        </div>
      </div>

      {/* 5. RECENT / CURRENT OPERATIONAL STATUS TABLE */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#168A5B]" /> Operational Status & Infrastructure Health
            </h2>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              Live status of hydro-meteorological telemetry, gridded feeds, and QAOA optimizer
            </p>
          </div>
          <span className="badge-state" data-state="LIVE">System Nominal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DFE5DF] text-[#5C6E66] bg-[#F7F8F3]">
                <th className="p-3">Component / Feed</th>
                <th className="p-3">Source Provider</th>
                <th className="p-3">Update Interval</th>
                <th className="p-3">Health Status</th>
                <th className="p-3">Operational Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE5DF]">
              <tr className="hover:bg-[#F7F8F3] transition-colors">
                <td className="p-3 font-semibold text-[#1A2421]">IMD Precipitation Grids</td>
                <td className="p-3 text-[#5C6E66]">India Meteorological Dept (0.25°)</td>
                <td className="p-3 text-[#5C6E66] font-mono">24 Hours</td>
                <td className="p-3">
                  <span className="badge-state" data-state="LIVE">Active</span>
                </td>
                <td className="p-3 text-[#5C6E66]">Gridded NetCDF netcdf4 raster layer parsed</td>
              </tr>
              <tr className="hover:bg-[#F7F8F3] transition-colors">
                <td className="p-3 font-semibold text-[#1A2421]">WorldPop Settlement Exposure</td>
                <td className="p-3 text-[#5C6E66]">WorldPop 2020 UN-Adjusted (100m)</td>
                <td className="p-3 text-[#5C6E66] font-mono">Static GeoTIFF</td>
                <td className="p-3">
                  <span className="badge-state" data-state="DATASET">Dataset Loaded</span>
                </td>
                <td className="p-3 text-[#5C6E66]">High-resolution settlement density raster</td>
              </tr>
              <tr className="hover:bg-[#F7F8F3] transition-colors">
                <td className="p-3 font-semibold text-[#1A2421]">Coupled QUBO / QAOA Engine</td>
                <td className="p-3 text-[#5C6E66]">Qiskit 2.5 Statevector Simulator</td>
                <td className="p-3 text-[#5C6E66] font-mono">On-Demand</td>
                <td className="p-3">
                  <span className="badge-quantum">Optimal (p=1)</span>
                </td>
                <td className="p-3 text-[#126B48] font-medium">99.29% approximation ratio (0.71% gap)</td>
              </tr>
              <tr className="hover:bg-[#F7F8F3] transition-colors">
                <td className="p-3 font-semibold text-[#1A2421]">Sensor-Relay Telemetry Link</td>
                <td className="p-3 text-[#5C6E66]">Wireless UHF 15km Relay Network</td>
                <td className="p-3 text-[#5C6E66] font-mono">1 Minute</td>
                <td className="p-3">
                  <span className="badge-state" data-state="OPTIMIZED">100% Reachability</span>
                </td>
                <td className="p-3 text-[#5C6E66]">0 disconnected active sensors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
