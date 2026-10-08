import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useBasin } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { Layers, Sliders, ShieldAlert, Radio, MapPin, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/risk-map")({
  head: () => ({
    meta: [{ title: "Risk Map — Quantum Flood Response Command Center" }],
  }),
  component: RiskMapScreen,
});

export function RiskMapScreen() {
  const { basinId, setBasinId, scenario, setScenario } = useBasin();
  const [showRiskZones, setShowRiskZones] = useState<boolean>(true);
  const [showCandidates, setShowCandidates] = useState<boolean>(true);
  const [showRelays, setShowRelays] = useState<boolean>(true);
  const [riskThreshold, setRiskThreshold] = useState<number>(60);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Spatial Controls Panel */}
      <div className="w-full md:w-80 bg-slate-900/95 border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-5 z-20 shrink-0 font-mono text-xs overflow-y-auto">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> SPATIAL RISK INTELLIGENCE
          </h1>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            Layer Controls & Spatial Hazard Thresholds
          </p>
        </div>

        {/* Basin Control */}
        <div className="space-y-2">
          <label className="text-slate-400 font-semibold block uppercase">SELECT BASIN</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBasinId("krishna")}
              className={`py-2 px-3 rounded border text-center font-bold transition-colors ${
                basinId === "krishna"
                  ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              KRISHNA
            </button>
            <button
              onClick={() => setBasinId("godavari")}
              className={`py-2 px-3 rounded border text-center font-bold transition-colors ${
                basinId === "godavari"
                  ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              GODAVARI
            </button>
          </div>
        </div>

        {/* Scenario Filter */}
        <div className="space-y-2">
          <label className="text-slate-400 font-semibold block uppercase">DISASTER SCENARIO</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-bold focus:outline-none"
          >
            <option value="NORMAL">NORMAL MONSOON (Baseline)</option>
            <option value="MONSOON_SURGE">MONSOON SURGE (+25% Rain)</option>
            <option value="EXTREME_CYCLONE">EXTREME CYCLONE (Region B Shift)</option>
          </select>
        </div>

        {/* Risk Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-slate-400">
            <span className="font-semibold uppercase">RISK FILTER THRESHOLD:</span>
            <span className="text-cyan-400 font-bold">{riskThreshold}/100</span>
          </div>
          <input
            type="range"
            min="30"
            max="90"
            step="5"
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Layer Visibility Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-slate-400 font-semibold block uppercase">GEOSPATIAL LAYERS</label>

          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className="w-full flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Risk Intensity Zones
            </span>
            {showRiskZones ? (
              <Eye className="w-4 h-4 text-cyan-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => setShowCandidates(!showCandidates)}
            className="w-full flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Candidate Sensors (C-KR-*)
            </span>
            {showCandidates ? (
              <Eye className="w-4 h-4 text-cyan-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => setShowRelays(!showRelays)}
            className="w-full flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" /> Comm Relays (RL-KR-*)
            </span>
            {showRelays ? (
              <Eye className="w-4 h-4 text-purple-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        {/* Detailed Map Legend */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <label className="text-slate-400 font-semibold block uppercase">MAP LEGEND</label>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500/80 border border-red-400 inline-block" />{" "}
              Critical Risk (≥80)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500/80 border border-orange-400 inline-block" />{" "}
              High Risk (60-79)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400 inline-block" />{" "}
              Watch (40-59)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-500/80 border border-sky-400 inline-block" />{" "}
              Low Risk (&lt;40)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 border border-slate-100 inline-block" />{" "}
              Deployed Sensor
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 border border-slate-100 inline-block" />{" "}
              Comm Relay
            </div>
          </div>
        </div>
      </div>

      {/* Main Geospatial Intelligence Map */}
      <div className="flex-1 relative h-full">
        <CommandMap basinId={basinId} showRiskZones={showRiskZones} height="100%" />
      </div>
    </div>
  );
}
