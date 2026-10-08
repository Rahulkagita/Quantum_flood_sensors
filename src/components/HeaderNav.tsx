import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useBasin, BasinId } from "../lib/basin-context";
import { useTheme } from "../lib/theme";
import {
  Droplets,
  Compass,
  CloudRain,
  Cpu,
  Network,
  Bell,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";

export const HeaderNav: React.FC = () => {
  const { basinId, setBasinId, riskData } = useBasin();
  const { resolved, setPreference } = useTheme();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Nav items with exact route paths
  const navItems = [
    { label: "Overview", path: "/", icon: Compass },
    { label: "Forecast", path: "/forecast", icon: CloudRain },
    { label: "Quantum Optimize", path: "/quantum-optimizer", icon: Cpu, isQuantum: true },
    { label: "Network", path: "/network-optimization", altPath: "/response-network", icon: Network },
    { label: "Response", path: "/response", altPath: "/alerts", icon: Bell },
  ];

  return (
    <header className="app-header bg-white dark:bg-[#14221D] border-b border-[#DFE5DF] dark:border-[#273D34] transition-colors">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3 md:gap-4">
        <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#168A5B] flex items-center justify-center text-white shadow-xs shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[#1A2421] dark:text-[#F2F7F4]">
                PRAVAAH
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EEF7F1] dark:bg-[#1F332B] text-[#126B48] dark:text-[#B5E8D2] border border-[#C4E2D3] dark:border-[#273D34]">
                GIS Platform
              </span>
            </div>
            <p className="text-[11px] text-[#5C6E66] dark:text-[#8FA69B] leading-none mt-0.5 hidden sm:block">
              Flood Intelligence & Response Optimization
            </p>
          </div>
        </Link>

        {/* Basin Selector Context */}
        <div className="h-5 w-px bg-[#DFE5DF] dark:bg-[#273D34] hidden md:block" />

        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#F7F8F3] dark:bg-[#0E1714] border border-[#DFE5DF] dark:border-[#273D34] rounded-md px-2.5 py-1 text-xs">
            <span className="text-[#5C6E66] dark:text-[#8FA69B] text-[11px] font-medium">Basin:</span>
            <div className="relative flex items-center">
              <select
                value={basinId}
                onChange={(e) => setBasinId(e.target.value as BasinId)}
                className="bg-transparent font-semibold text-[#126B48] dark:text-[#1EAA71] focus:outline-none cursor-pointer text-xs pr-4 appearance-none"
              >
                <option value="krishna" className="bg-white dark:bg-[#14221D] text-[#1A2421] dark:text-[#F2F7F4]">
                  Krishna Basin (80.65°E, 16.50°N)
                </option>
                <option value="godavari" className="bg-white dark:bg-[#14221D] text-[#1A2421] dark:text-[#F2F7F4]">
                  Godavari Basin (81.78°E, 16.98°N)
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#126B48] dark:text-[#1EAA71] absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* Risk Level Badge */}
          {riskData && (
            <div className="badge-risk" data-risk={riskData.risk_level}>
              <ShieldAlert className="w-3.5 h-3.5" />
              {riskData.risk_level} ({riskData.risk_score}/100)
            </div>
          )}

          {/* Data State Indicators */}
          <div className="hidden xl:flex items-center gap-1.5">
            <span
              className="badge-state"
              data-state="DATASET"
              title="IMD Rainfall NetCDF & WorldPop 2020 GeoTIFF"
            >
              IMD NetCDF + WorldPop
            </span>
            <span className="badge-quantum" title="Qiskit 2.5 Statevector Simulator">
              Qiskit 2.5 Simulation
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Navigation & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Desktop 5-Stage Navigation */}
        <nav className="nav-rail hidden lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              (item.altPath && currentPath === item.altPath) ||
              (item.path === "/" && (currentPath === "" || currentPath === "/overview"));
            return (
              <Link
                key={item.path}
                to={item.path}
                className="nav-item"
                data-active={isActive}
                data-quantum={item.isQuantum ? "true" : "false"}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? item.isQuantum
                        ? "text-[#7657B8] dark:text-[#9A7FD1]"
                        : "text-[#168A5B] dark:text-[#1EAA71]"
                      : "text-[#5C6E66] dark:text-[#8FA69B]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
          title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          className="p-2 rounded-md bg-[#F7F8F3] dark:bg-[#0E1714] border border-[#DFE5DF] dark:border-[#273D34] text-[#5C6E66] dark:text-[#8FA69B] hover:text-[#1A2421] dark:hover:text-[#F2F7F4] transition-colors"
        >
          {resolved === "dark" ? <Sun className="w-4 h-4 text-[#F2C14E]" /> : <Moon className="w-4 h-4 text-[#7657B8]" />}
        </button>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          className="p-2 rounded-md bg-[#F7F8F3] dark:bg-[#0E1714] border border-[#DFE5DF] dark:border-[#273D34] text-[#1A2421] dark:text-[#F2F7F4] lg:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-[#14221D] border-b border-[#DFE5DF] dark:border-[#273D34] shadow-lg p-4 space-y-4 lg:hidden animate-in slide-in-from-top-2">
          {/* Mobile Basin Selector */}
          <div className="flex items-center justify-between p-2.5 bg-[#F7F8F3] dark:bg-[#0E1714] rounded-md border border-[#DFE5DF] dark:border-[#273D34]">
            <span className="text-xs font-medium text-[#5C6E66] dark:text-[#8FA69B]">Basin Selection:</span>
            <select
              value={basinId}
              onChange={(e) => setBasinId(e.target.value as BasinId)}
              className="bg-white dark:bg-[#14221D] border border-[#DFE5DF] dark:border-[#273D34] px-2 py-1 rounded font-semibold text-[#126B48] dark:text-[#1EAA71] text-xs outline-none"
            >
              <option value="krishna">Krishna Basin</option>
              <option value="godavari">Godavari Basin</option>
            </select>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.altPath && currentPath === item.altPath) ||
                (item.path === "/" && (currentPath === "" || currentPath === "/overview"));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? item.isQuantum
                        ? "bg-[#EEE9F8] dark:bg-[#1F332B] text-[#6343A1] dark:text-[#9A7FD1] border border-[#D8CCE8] dark:border-[#273D34]"
                        : "bg-[#EEF7F1] dark:bg-[#1F332B] text-[#126B48] dark:text-[#1EAA71] border border-[#C4E2D3] dark:border-[#273D34]"
                      : "text-[#5C6E66] dark:text-[#8FA69B] hover:bg-[#F7F8F3] dark:hover:bg-[#0E1714]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Data Badges */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DFE5DF] dark:border-[#273D34]">
            <span className="badge-state" data-state="DATASET">
              IMD NetCDF + WorldPop
            </span>
            <span className="badge-quantum">
              Qiskit 2.5 Simulation
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
