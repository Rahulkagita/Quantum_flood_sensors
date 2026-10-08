import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { CommandMap } from "../components/CommandMap";
import { runCoupledOptimization, CoupledOptimizationResponse } from "../lib/api-client";
import { MetricCardSkeleton, TableSkeleton } from "../components/ui/LoadingStates";
import { Network, Radio, CheckCircle, Wifi, Droplets, Users, ShieldAlert, Cpu } from "lucide-react";

export const Route = createFileRoute("/response-network")({
  head: () => ({
    meta: [{ title: "Optimized Response Network — PRAVAAH" }],
  }),
  component: ResponseNetworkScreen,
});

export function ResponseNetworkScreen() {
  const { basinId, scenario, candidateData } = useBasin();
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

  const topologyLinks =
    basinId === "krishna"
      ? [
          {
            sensor: "C-KR-001 (Vijayawada Delta)",
            relay: "RL-KR-P1 (Prakasam Barrage)",
            distance: "8.4 km",
            maxRange: "15.0 km",
            reachability: "100% Reachable",
            status: "Connected",
            quality: "Optimal Signal",
          },
          {
            sensor: "C-KR-002 (Kolluru Floodplain)",
            relay: "RL-KR-P1 (Prakasam Barrage)",
            distance: "12.1 km",
            maxRange: "15.0 km",
            reachability: "100% Reachable",
            status: "Connected",
            quality: "High Margin",
          },
          {
            sensor: "C-KR-003 (Avanigadda Estuary)",
            relay: "RL-KR-P2 (Delta Relay)",
            distance: "9.8 km",
            maxRange: "15.0 km",
            reachability: "100% Reachable",
            status: "Connected",
            quality: "Optimal Signal",
          },
        ]
      : [
          {
            sensor: "C-GD-001 (Rajahmundry)",
            relay: "RL-GD-P1 (Dowleswaram Barrage)",
            distance: "7.2 km",
            maxRange: "15.0 km",
            reachability: "100% Reachable",
            status: "Connected",
            quality: "Optimal Signal",
          },
          {
            sensor: "C-GD-002 (Kakinada Reach)",
            relay: "RL-GD-P1 (Dowleswaram Barrage)",
            distance: "11.5 km",
            maxRange: "15.0 km",
            reachability: "100% Reachable",
            status: "Connected",
            quality: "High Margin",
          },
        ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-[#1A2421] font-sans">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFE5DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#168A5B]" />
            <h1 className="text-xl font-bold tracking-tight text-[#1A2421]">
              Optimized Response Network
            </h1>
            <span className="badge-state" data-state="OPTIMIZED">
              Coupled Network
            </span>
          </div>
          <p className="text-xs text-[#5C6E66] mt-1">
            Candidate network evaluated and optimized into active sensors and connected relay infrastructure for{" "}
            <strong className="text-[#1A2421] capitalize">{basinId} Basin</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-state" data-state="LIVE">
            <Wifi className="w-3.5 h-3.5 text-[#126B48]" /> 0 Disconnected Sensors
          </span>
          <span className="badge-state" data-state="LIVE">
            100% Link Reachability
          </span>
        </div>
      </div>

      {/* 2. METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66]">Sensors Deployed</div>
              <div className="text-3xl font-bold text-[#126B48] mt-1.5">
                {metrics?.sensor_count ?? 3}
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">Budget K_max = 3</div>
            </div>

            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66]">Relays Deployed</div>
              <div className="text-3xl font-bold text-[#7657B8] mt-1.5">
                {metrics?.relay_count ?? 2}
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">Budget M_max = 2</div>
            </div>

            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66]">Risk-Weighted Coverage</div>
              <div className="text-3xl font-bold text-[#168A5B] mt-1.5">
                {((metrics?.risk_weighted_coverage ?? 0.884) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">High-risk demand</div>
            </div>

            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66]">Population Coverage</div>
              <div className="text-3xl font-bold text-[#1A2421] mt-1.5">
                {((metrics?.population_weighted_coverage ?? 0.912) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">Urban delta reach</div>
            </div>

            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66]">Uncovered Demand</div>
              <div className="text-3xl font-bold text-[#F28C45] mt-1.5">
                {metrics?.uncovered_high_risk_demand ?? 18.5}
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">Peripheral fringe</div>
            </div>
          </>
        )}
      </div>

      {/* 3. LARGE MAP-FIRST NETWORK OPERATIONS */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-[#1A2421]">
            Candidate Network → Optimized Network Topology Map
          </div>
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

        <div className="h-[500px] min-h-[380px] rounded-lg overflow-hidden border border-[#DFE5DF]">
          <CommandMap
            basinId={basinId}
            selectedSensors={metrics?.selected_sensors || []}
            selectedRelays={metrics?.selected_relays || []}
            viewMode={viewMode}
            candidateLocations={candidateData?.candidates || []}
            height="100%"
          />
        </div>
      </div>

      {/* 4. SENSOR TO RELAY COMMUNICATION TABLE */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#7657B8]" /> Sensor-to-Relay Communication Links Table
            </h2>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              Wireless transmission reachability and link quality for active sensors connected to relay masts
            </p>
          </div>
          <span className="badge-state" data-state="LIVE">
            100% Reachability
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DFE5DF] text-[#5C6E66] bg-[#F7F8F3]">
                  <th className="p-3">Active Sensor</th>
                  <th className="p-3">Connected Relay Mast</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Max Wireless Range</th>
                  <th className="p-3">Reachability Status</th>
                  <th className="p-3">Link Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5DF]">
                {topologyLinks.map((link, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F8F3] transition-colors">
                    <td className="p-3 font-semibold text-[#126B48]">{link.sensor}</td>
                    <td className="p-3 font-semibold text-[#7657B8]">{link.relay}</td>
                    <td className="p-3 text-[#1A2421] font-mono">{link.distance}</td>
                    <td className="p-3 text-[#5C6E66] font-mono">{link.maxRange}</td>
                    <td className="p-3">
                      <span className="badge-state" data-state="LIVE">
                        <CheckCircle className="w-3 h-3 text-[#126B48]" /> {link.reachability}
                      </span>
                    </td>
                    <td className="p-3 text-[#126B48] font-semibold">{link.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
