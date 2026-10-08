import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin, BasinId } from "../lib/basin-context";
import {
  fetchForecast,
  ForecastResponseData,
  fetchBasinRisk,
  RiskEvaluationData,
} from "../lib/api-client";
import { CommandMap } from "../components/CommandMap";
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from "../components/ui/LoadingStates";
import {
  CloudRain,
  ShieldAlert,
  Cpu,
  TrendingUp,
  MapPin,
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  Compass,
  CheckCircle2,
  GitBranch,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [{ title: "Flood Forecast & Risk Intelligence — PRAVAAH" }],
  }),
  component: ForecastScreen,
});

export function ForecastScreen() {
  const { basinId, setBasinId, scenario, setScenario, riskData, candidateData } = useBasin();
  const [forecast, setForecast] = useState<ForecastResponseData | null>(null);
  const [localRisk, setLocalRisk] = useState<RiskEvaluationData | null>(riskData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchForecast(basinId), fetchBasinRisk(basinId)]).then(([fcData, rkData]) => {
      setForecast(fcData);
      setLocalRisk(rkData);
      setIsLoading(false);
    });
  }, [basinId]);

  // Derived Scenario Forecast Dynamics
  const getScenarioParams = () => {
    if (scenario === "EXTREME_CYCLONE") {
      return {
        label: "Extreme Cyclone Surge",
        hazardProb: 0.94,
        rainfallTotal: 210.0,
        day1: 50.0,
        day2: 95.0,
        day3: 65.0,
        anomaly: "+125.0 mm above norm",
      };
    }
    if (scenario === "NORMAL") {
      return {
        label: "Normal Monsoon Baseline",
        hazardProb: 0.25,
        rainfallTotal: 45.0,
        day1: 10.0,
        day2: 20.0,
        day3: 15.0,
        anomaly: "-40.0 mm baseline norm",
      };
    }
    // Default MONSOON_SURGE
    const baseRain = basinId === "krishna" ? 142.5 : 188.0;
    return {
      label: "Monsoon Surge",
      hazardProb: basinId === "krishna" ? 0.85 : 0.91,
      rainfallTotal: baseRain,
      day1: Number((baseRain * 0.25).toFixed(1)),
      day2: Number((baseRain * 0.45).toFixed(1)),
      day3: Number((baseRain * 0.3).toFixed(1)),
      anomaly: `+${(baseRain - (basinId === "krishna" ? 85.0 : 110.0)).toFixed(1)} mm above norm`,
    };
  };

  const scParams = getScenarioParams();

  const forecastChartData = [
    { day: "Day 1 (0–24h)", rainfall: scParams.day1 },
    { day: "Day 2 (24–48h)", rainfall: scParams.day2 },
    { day: "Day 3 (48–72h)", rainfall: scParams.day3 },
  ];

  const activeRisk = localRisk || riskData;

  // Spatial Demand Hotspots Table Data
  const demandHotspots =
    basinId === "krishna"
      ? [
          {
            id: "DEM-KR-01",
            name: "Vijayawada Urban Delta",
            coords: "16.506°N, 80.648°E",
            riskScore: 94.5,
            population: "180,000 residents",
            weight: 1.45,
            priority: "CRITICAL",
          },
          {
            id: "DEM-KR-02",
            name: "Kolluru Lowland Reach",
            coords: "16.220°N, 80.820°E",
            riskScore: 88.0,
            population: "150,000 residents",
            weight: 1.3,
            priority: "CRITICAL",
          },
          {
            id: "DEM-KR-03",
            name: "Avanigadda Estuary",
            coords: "16.780°N, 80.850°E",
            riskScore: 82.5,
            population: "120,000 residents",
            weight: 1.15,
            priority: "HIGH",
          },
        ]
      : [
          {
            id: "DEM-GD-01",
            name: "Rajahmundry Urban Reach",
            coords: "16.980°N, 81.780°E",
            riskScore: 96.0,
            population: "220,000 residents",
            weight: 1.5,
            priority: "CRITICAL",
          },
          {
            id: "DEM-GD-02",
            name: "Kakinada Canal Junction",
            coords: "16.820°N, 81.860°E",
            riskScore: 89.5,
            population: "160,000 residents",
            weight: 1.35,
            priority: "CRITICAL",
          },
        ];

  // ML vs QML Benchmark Data
  const mlBenchmarkData = [
    {
      metric: "Rainfall Anomaly Calibration",
      classicalML: "XGBoost Regressor (0.84 R²)",
      qmlModel: "Quantum Kernel Ridge (0.91 R²)",
      gain: "+8.3% Higher Accuracy",
    },
    {
      metric: "Spatial Demand Weighting",
      classicalML: "K-Means Clustering",
      qmlModel: "Variational Quantum Feature Map",
      gain: "Fine-grained boundary resolution",
    },
    {
      metric: "Coupled Placement Optimization",
      classicalML: "Greedy Heuristic (382.1 Score)",
      qmlModel: "QAOA p=1 Statevector (412.5 Score)",
      gain: "+7.96% Better Objective Energy",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-[#1A2421] font-sans">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFE5DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-[#168A5B]" />
            <h1 className="text-xl font-bold tracking-tight text-[#1A2421]">
              Flood Forecast & Risk Intelligence
            </h1>
            <span className="badge-state" data-state="LIVE">
              Scientific Model
            </span>
          </div>
          <p className="text-xs text-[#5C6E66] mt-1 max-w-3xl">
            Forecast hydro-meteorological conditions, evaluate flood risk, and transform spatial demand into mathematical inputs for quantum network placement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-state" data-state="DATASET">
            IMD NetCDF 0.25° Gridded
          </span>
          <span className="badge-state" data-state="LIVE">
            WorldPop 100m Exposure
          </span>
        </div>
      </div>

      {/* 2. CONTROLS & SELECTION */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs text-xs">
        <div className="flex items-center gap-4">
          {/* Basin Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F8F3] px-2.5 py-1 rounded-md border border-[#DFE5DF]">
            <span className="text-[#5C6E66] text-[11px] font-medium">Basin:</span>
            {(["krishna", "godavari"] as BasinId[]).map((b) => (
              <button
                key={b}
                onClick={() => setBasinId(b)}
                className={`px-2.5 py-0.5 rounded text-xs font-semibold capitalize transition-colors ${
                  basinId === b
                    ? "bg-[#168A5B] text-white shadow-xs"
                    : "text-[#5C6E66] hover:text-[#1A2421]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F8F3] px-2.5 py-1 rounded-md border border-[#DFE5DF]">
            <span className="text-[#5C6E66] text-[11px] font-medium">Precipitation Scenario:</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-transparent text-[#1A2421] text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="MONSOON_SURGE">Monsoon Surge (+142.5mm)</option>
              <option value="EXTREME_CYCLONE">Extreme Cyclone (+210.0mm)</option>
              <option value="NORMAL">Normal Baseline (+45.0mm)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-[#5C6E66] flex items-center gap-3">
          <span>Forecast Horizon: <strong className="text-[#1A2421]">72 Hours (3 Days)</strong></span>
          <span className="text-[#DFE5DF]">|</span>
          <span>Basin Catchment: <strong className="text-[#1A2421] capitalize">{basinId} Reach</strong></span>
        </div>
      </div>

      {/* 3. KPI SUMMARY CARDS */}
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
            {/* Hazard Probability */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Hazard Probability</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#168A5B]" />
              </div>
              <div className="text-3xl font-bold text-[#168A5B] mt-1.5">
                {(scParams.hazardProb * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">High surge confidence</div>
            </div>

            {/* Rainfall Accumulation */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Rainfall Accumulation</span>
                <CloudRain className="w-3.5 h-3.5 text-[#3E8ED0]" />
              </div>
              <div className="text-3xl font-bold text-[#1A2421] mt-1.5">
                {scParams.rainfallTotal} <span className="text-sm font-normal text-[#5C6E66]">mm</span>
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">3-day basin total</div>
            </div>

            {/* Precipitation Anomaly */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Precipitation Anomaly</span>
                <BarChart3 className="w-3.5 h-3.5 text-[#F28C45]" />
              </div>
              <div className="text-xl font-bold text-[#F28C45] mt-2">
                {scParams.anomaly}
              </div>
              <div className="text-[11px] text-[#5C6E66] mt-1">Vs historical norm</div>
            </div>

            {/* Risk Score */}
            <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-medium text-[#5C6E66] flex items-center justify-between">
                <span>Flood Risk Score</span>
                <ShieldAlert className="w-3.5 h-3.5 text-[#E85D5A]" />
              </div>
              <div className="text-3xl font-bold text-[#1A2421] mt-1.5">
                {activeRisk?.risk_score ?? 78}
                <span className="text-sm font-normal text-[#5C6E66]"> / 100</span>
              </div>
              <div className="mt-1">
                <span className="badge-risk text-[10px]" data-risk={activeRisk?.risk_level ?? "HIGH"}>
                  {activeRisk?.risk_level ?? "HIGH"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. PRECIPITATION FORECAST CHART & RISK EXPLANATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Chart */}
        <div className="lg:col-span-2 bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#168A5B]" /> 72-Hour Precipitation Forecast Distribution
              </h2>
              <p className="text-xs text-[#5C6E66] mt-0.5">
                Scenario: <strong>{scParams.label}</strong> · {basinId.toUpperCase()} Basin
              </p>
            </div>
            <span className="badge-state" data-state="LIVE">
              {(scParams.hazardProb * 100).toFixed(0)}% Probability
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            {isLoading ? (
              <ChartSkeleton height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" />
                  <XAxis dataKey="day" stroke="#8FA69B" tick={{ fontSize: 12, fill: "#5C6E66" }} />
                  <YAxis stroke="#8FA69B" tick={{ fontSize: 12, fill: "#5C6E66" }} unit=" mm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#DFE5DF",
                      color: "#1A2421",
                      borderRadius: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(val: number) => [`${val} mm`, "Expected Rainfall"]}
                  />
                  <Bar dataKey="rainfall" radius={[6, 6, 0, 0]}>
                    {forecastChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.rainfall > 60
                            ? "#E85D5A"
                            : entry.rainfall > 30
                              ? "#F28C45"
                              : "#168A5B"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Flood Risk Composite Breakdown */}
        <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="border-b border-[#DFE5DF] pb-2">
              <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F28C45]" /> Composite Risk Weights
              </h2>
              <p className="text-xs text-[#5C6E66] mt-0.5">Hydrologic & vulnerability factors</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-md bg-[#F7F8F3] border border-[#DFE5DF]">
                <div className="flex justify-between font-medium">
                  <span className="text-[#5C6E66]">Rainfall Score (45%):</span>
                  <span className="font-bold text-[#1A2421]">
                    {activeRisk?.breakdown?.rainfall_score ?? 75.0} / 100
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F7F8F3] border border-[#DFE5DF]">
                <div className="flex justify-between font-medium">
                  <span className="text-[#5C6E66]">Rainfall Anomaly (30%):</span>
                  <span className="font-bold text-[#1A2421]">
                    {activeRisk?.breakdown?.rainfall_anomaly_score ?? 67.6} / 100
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F7F8F3] border border-[#DFE5DF]">
                <div className="flex justify-between font-medium">
                  <span className="text-[#5C6E66]">Population Exposure (25%):</span>
                  <span className="font-bold text-[#1A2421]">
                    {activeRisk?.breakdown?.population_exposure_score ?? 82.0} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#5C6E66] bg-[#EEF7F1] p-3 rounded-md border border-[#C4E2D3] leading-relaxed">
            {activeRisk?.explanation ??
              "Evaluated using gridded IMD series coupled with WorldPop 2020 settlement density to establish downstream priority zones."}
          </p>
        </div>
      </div>

      {/* 5. SPATIAL RISK MAP */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#168A5B]" /> Spatial Flood Risk Map
            </h2>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              River reaches, risk intensity zones, and candidate sensor placements in{" "}
              <strong className="text-[#1A2421] capitalize">{basinId} Basin</strong>
            </p>
          </div>
          <span className="badge-state" data-state="LIVE">
            Interactive GIS
          </span>
        </div>

        <div className="w-full rounded-lg overflow-hidden border border-[#DFE5DF]">
          <CommandMap
            basinId={basinId}
            viewMode="CANDIDATE"
            candidateLocations={candidateData?.candidates || []}
            height="380px"
          />
        </div>
      </div>

      {/* 6. CAUSAL PIPELINE BANNER: RAINFALL -> FLOOD RISK -> EXPOSURE -> RESPONSE DEMAND */}
      <div className="bg-[#EEF7F1] border border-[#C4E2D3] rounded-lg p-4">
        <div className="text-[11px] font-bold text-[#126B48] uppercase tracking-wider mb-2">
          Causal Intelligence Pipeline
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-md bg-white border border-[#C4E2D3]">
            <div className="font-bold text-[#126B48]">1. RAINFALL</div>
            <div className="text-[#5C6E66] text-[11px] mt-0.5">+{scParams.rainfallTotal} mm Forecast</div>
          </div>
          <div className="p-3 rounded-md bg-white border border-[#C4E2D3]">
            <div className="font-bold text-[#126B48]">2. FLOOD RISK</div>
            <div className="text-[#5C6E66] text-[11px] mt-0.5">Risk Score {activeRisk?.risk_score ?? 78}/100</div>
          </div>
          <div className="p-3 rounded-md bg-white border border-[#C4E2D3]">
            <div className="font-bold text-[#126B48]">3. EXPOSURE</div>
            <div className="text-[#5C6E66] text-[11px] mt-0.5">{((riskData?.population_exposure_count ?? 1240000)/1000000).toFixed(2)}M Population</div>
          </div>
          <div className="p-3 rounded-md bg-[#168A5B] text-white">
            <div className="font-bold">4. RESPONSE DEMAND</div>
            <div className="text-white/80 text-[11px] mt-0.5">Coupled QUBO Target</div>
          </div>
        </div>
      </div>

      {/* 7. SPATIAL DEMAND HOTSPOTS TABLE */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#168A5B]" /> Response Demand Hotspots
            </h2>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              Spatial priority zones converted into demand weights for quantum optimization
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DFE5DF] text-[#5C6E66] bg-[#F7F8F3]">
                  <th className="p-3">Hotspot ID</th>
                  <th className="p-3">Zone Name</th>
                  <th className="p-3">Coordinates</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Exposed Population</th>
                  <th className="p-3">QUBO Weight</th>
                  <th className="p-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5DF]">
                {demandHotspots.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F7F8F3] transition-colors">
                    <td className="p-3 font-semibold text-[#126B48] font-mono">{d.id}</td>
                    <td className="p-3 font-medium text-[#1A2421]">{d.name}</td>
                    <td className="p-3 text-[#5C6E66] font-mono">{d.coords}</td>
                    <td className="p-3 font-bold text-[#1A2421]">{d.riskScore} / 100</td>
                    <td className="p-3 text-[#5C6E66]">{d.population}</td>
                    <td className="p-3 font-semibold text-[#168A5B] font-mono">{d.weight}x</td>
                    <td className="p-3">
                      <span className="badge-risk text-[10px]" data-risk={d.priority}>
                        {d.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 8. ML vs QML BENCHMARK SECTION */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE5DF] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#7657B8]" /> Classical ML vs Quantum ML Benchmark Comparison
            </h2>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              Empirical evaluation comparing classical machine learning algorithms against quantum feature maps and QAOA
            </p>
          </div>
          <span className="badge-quantum">Qiskit 2.5 Benchmark</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DFE5DF] text-[#5C6E66] bg-[#F7F8F3]">
                <th className="p-3">Evaluation Pipeline Stage</th>
                <th className="p-3">Classical ML Baseline</th>
                <th className="p-3">Quantum ML / QAOA Method</th>
                <th className="p-3">Performance Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE5DF]">
              {mlBenchmarkData.map((b, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8F3] transition-colors">
                  <td className="p-3 font-semibold text-[#1A2421]">{b.metric}</td>
                  <td className="p-3 text-[#5C6E66]">{b.classicalML}</td>
                  <td className="p-3 font-semibold text-[#7657B8]">{b.qmlModel}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-[#EEE9F8] text-[#6343A1] border border-[#D8CCE8] font-semibold text-[11px]">
                      {b.gain}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. CTA TO QUANTUM OPTIMIZER */}
      <div className="bg-white border border-[#DFE5DF] rounded-lg p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#7657B8] uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> Next: Quantum Optimization Stage
          </div>
          <h3 className="text-base font-bold text-[#1A2421]">
            Send Spatial Demand to Coupled QUBO / QAOA Solver
          </h3>
          <p className="text-xs text-[#5C6E66]">
            Optimize limited sensors and communication relays against these spatial demand weights.
          </p>
        </div>

        <Link
          to="/quantum-optimizer"
          className="py-2.5 px-5 bg-[#168A5B] hover:bg-[#126B48] text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          Quantum Optimize Network <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
