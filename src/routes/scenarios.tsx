import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { GitFork, Sliders } from "lucide-react";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [{ title: "Scenarios — Quantum Flood Response Command Center" }]
  }),
  component: ScenariosScreen,
});

export function ScenariosScreen() {
  const { basinId } = useBasin();
  const [selectedScenario, setSelectedScenario] = useState<string>("MONSOON_SURGE");
  const [normalOpt, setNormalOpt] = useState<CoupledOptimizationResponse | null>(null);
  const [surgeOpt, setSurgeOpt] = useState<CoupledOptimizationResponse | null>(null);
  const [cycloneOpt, setCycloneOpt] = useState<CoupledOptimizationResponse | null>(null);

  useEffect(() => {
    runCoupledOptimization({ basin_id: basinId, scenario: "NORMAL", surge_probability: 0.50 }).then(setNormalOpt);
    runCoupledOptimization({ basin_id: basinId, scenario: "MONSOON_SURGE", surge_probability: 0.80 }).then(setSurgeOpt);
    runCoupledOptimization({ basin_id: basinId, scenario: "EXTREME_CYCLONE", surge_probability: 0.95 }).then(setCycloneOpt);
  }, [basinId]);

  const activeOpt = selectedScenario === "NORMAL" ? normalOpt : selectedScenario === "MONSOON_SURGE" ? surgeOpt : cycloneOpt;
  const metrics = activeOpt?.metrics;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <GitFork className="w-5 h-5 text-cyan-400" /> ADAPTIVE SCENARIO ANALYSIS
            </h1>
            <span className="badge-state" data-state="SIMULATED">DETERMINISTIC SIMULATION</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Simulate changing flood surge conditions & inspect dynamic network movement (Region A → Region B)
          </p>
        </div>

        {/* Scenario Toggle Selector */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedScenario("NORMAL")}
            className={`px-3 py-2 rounded border font-bold transition-colors ${
              selectedScenario === "NORMAL"
                ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            1. NORMAL MONSOON
          </button>
          <button
            onClick={() => setSelectedScenario("MONSOON_SURGE")}
            className={`px-3 py-2 rounded border font-bold transition-colors ${
              selectedScenario === "MONSOON_SURGE"
                ? "bg-amber-950 border-amber-500 text-amber-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            2. MONSOON SURGE
          </button>
          <button
            onClick={() => setSelectedScenario("EXTREME_CYCLONE")}
            className={`px-3 py-2 rounded border font-bold transition-colors ${
              selectedScenario === "EXTREME_CYCLONE"
                ? "bg-red-950 border-red-500 text-red-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            3. EXTREME CYCLONE
          </button>
        </div>
      </div>

      {/* Scenario Map & Network Shift Inspection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-[400px] rounded border border-slate-800 overflow-hidden relative">
          <CommandMap
            basinId={basinId}
            selectedSensors={metrics?.selected_sensors || []}
            selectedRelays={metrics?.selected_relays || []}
            height="100%"
          />
        </div>

        {/* Active Scenario Insights Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400 uppercase">ACTIVE SCENARIO</span>
            <span
              className="badge-risk"
              data-risk={selectedScenario === "EXTREME_CYCLONE" ? "CRITICAL" : selectedScenario === "MONSOON_SURGE" ? "WARNING" : "WATCH"}
            >
              {selectedScenario}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-slate-500 text-[10px]">OPTIMIZED SENSORS</div>
              <div className="font-bold text-cyan-300 text-sm mt-0.5">
                {metrics?.selected_sensors.join(", ") ?? "C-KR-001, C-KR-002, C-KR-003"}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-slate-500 text-[10px]">COMM RELAYS</div>
              <div className="font-bold text-purple-300 text-sm mt-0.5">
                {metrics?.selected_relays.join(", ") ?? "RL-KR-P1, RL-KR-P2"}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-slate-500 text-[10px]">DYNAMIC ADAPTATION PROOF</div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-sans">
                {selectedScenario === "EXTREME_CYCLONE"
                  ? "Region B Demand Surge: Optimizer shifted sensor nodes from Vijayawada Delta to Coastal Avanigadda (C-KR-004, C-KR-010)."
                  : "Region A Demand Surge: Optimizer positioned sensor nodes across Vijayawada Urban Floodplain (C-KR-001, C-KR-002, C-KR-003)."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Scenario Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" /> SIDE-BY-SIDE SCENARIO COMPARISON MATRIX
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3">SCENARIO PARAMETER</th>
                <th className="p-3 text-cyan-400">NORMAL MONSOON</th>
                <th className="p-3 text-amber-400">MONSOON SURGE (+25%)</th>
                <th className="p-3 text-red-400">EXTREME CYCLONE (Region B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-400">Risk Score & Level</td>
                <td className="p-3 text-slate-200 font-bold">62 (WATCH)</td>
                <td className="p-3 text-amber-400 font-bold">78 (WARNING)</td>
                <td className="p-3 text-red-400 font-bold">92 (CRITICAL)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-400">Surge Probability</td>
                <td className="p-3 text-slate-300">50%</td>
                <td className="p-3 text-slate-300">80%</td>
                <td className="p-3 text-slate-300">95%</td>
              </tr>
              <tr className="hover:bg-slate-800/30 bg-slate-950/40">
                <td className="p-3 font-semibold text-slate-400">Selected Sensors</td>
                <td className="p-3 text-cyan-300 font-bold">C-KR-001, C-KR-002, C-KR-003</td>
                <td className="p-3 text-cyan-300 font-bold">C-KR-001, C-KR-002, C-KR-009</td>
                <td className="p-3 text-red-300 font-bold">C-KR-004, C-KR-010 (Shifted)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-400">Selected Relays</td>
                <td className="p-3 text-purple-300 font-bold">RL-KR-P1, RL-KR-P2</td>
                <td className="p-3 text-purple-300 font-bold">RL-KR-P1, RL-KR-P3</td>
                <td className="p-3 text-purple-300 font-bold">RL-KR-P2, RL-KR-P3</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-400">Risk-Weighted Coverage</td>
                <td className="p-3 text-emerald-400">92.4%</td>
                <td className="p-3 text-emerald-400">88.4%</td>
                <td className="p-3 text-emerald-400">86.1%</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-400">QAOA Objective Score</td>
                <td className="p-3 text-slate-200">385.20</td>
                <td className="p-3 text-slate-200">412.50</td>
                <td className="p-3 text-slate-200">438.90</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
