import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useBasin } from "../lib/basin-context";
import {
  LayoutDashboard,
  Activity,
  Map,
  Cpu,
  Network,
  GitFork,
  Bell,
  ShieldAlert,
  Radio,
  Layers
} from "lucide-react";

export const HeaderNav: React.FC = () => {
  const { basinId, setBasinId, riskData } = useBasin();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { label: "OVERVIEW", path: "/", icon: LayoutDashboard },
    { label: "FORECAST", path: "/forecast", icon: Activity },
    { label: "RISK MAP", path: "/risk-map", icon: Map },
    { label: "QUANTUM OPTIMIZER", path: "/quantum-optimizer", icon: Cpu, isQuantum: true },
    { label: "RESPONSE NETWORK", path: "/response-network", icon: Network },
    { label: "SCENARIOS", path: "/scenarios", icon: GitFork },
    { label: "ALERTS", path: "/alerts", icon: Bell },
  ];

  return (
    <header className="app-header">
      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs tracking-wider">
            UC067
          </div>
          <div>
            <h1 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              QUANTUM FLOOD RESPONSE COMMAND CENTER
            </h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Krishna & Godavari Basins · Disaster-Response Optimization
            </p>
          </div>
        </div>

        {/* Basin Selector Context */}
        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-mono">BASIN:</span>
            <select
              value={basinId}
              onChange={(e) => setBasinId(e.target.value as any)}
              className="bg-transparent font-mono font-semibold text-cyan-400 focus:outline-none cursor-pointer uppercase"
            >
              <option value="krishna" className="bg-slate-900 text-slate-100">
                KRISHNA BASIN (80.65°E, 16.50°N)
              </option>
              <option value="godavari" className="bg-slate-900 text-slate-100">
                GODAVARI BASIN (81.78°E, 16.98°N)
              </option>
            </select>
          </div>

          {/* Risk Level Badge */}
          {riskData && (
            <div
              className="badge-risk"
              data-risk={riskData.risk_level}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {riskData.risk_level} ({riskData.risk_score}/100)
            </div>
          )}

          {/* Data State Indicators */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="badge-state" data-state="DATASET" title="IMD Rainfall & WorldPop GeoTIFF">
              RAINFALL: DATASET
            </span>
            <span className="badge-state" data-state="SIMULATED" title="Qiskit 2.5 Statevector Simulation">
              QAOA: SIMULATED
            </span>
            <span className="badge-state" data-state="UNAVAILABLE" title="River discharge gauge telemetry unavailable">
              RIVER TELEMETRY: UNAVAILABLE
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <nav className="nav-rail">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === "/" && (currentPath === "" || currentPath === "/overview"));
          return (
            <Link
              key={item.path}
              to={item.path as any}
              className={`nav-item ${item.isQuantum ? "hover:border-purple-500/50" : ""}`}
              data-active={isActive}
            >
              <Icon className={`w-4 h-4 ${isActive ? (item.isQuantum ? "text-purple-400" : "text-cyan-400") : "text-slate-400"}`} />
              <span className={item.isQuantum ? "text-purple-300 font-semibold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
