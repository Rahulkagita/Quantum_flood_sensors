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
    <header className="app-header bg-[var(--surface-primary)] border-b border-[var(--border)] transition-colors">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3 md:gap-4">
        <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-green)] flex items-center justify-center text-white shadow-xs shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                PRAVAAH
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--soft-green)] text-[var(--primary-green)] border border-[var(--border)] font-mono">
                GIS Platform
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-none mt-0.5 hidden sm:block">
              Flood Intelligence & Response Optimization
            </p>
          </div>
        </Link>

        {/* Basin Selector Context */}
        <div className="h-5 w-px bg-[var(--border)] hidden md:block" />

        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs">
            <span className="text-[var(--text-secondary)] text-[11px] font-medium">Basin:</span>
            <div className="relative flex items-center">
              <select
                value={basinId}
                onChange={(e) => setBasinId(e.target.value as BasinId)}
                className="bg-transparent font-semibold text-[var(--primary-green)] focus:outline-none cursor-pointer text-xs pr-4 appearance-none"
              >
                <option value="krishna" className="bg-[var(--surface-primary)] text-[var(--text-primary)]">
                  Krishna Basin (80.65°E, 16.50°N)
                </option>
                <option value="godavari" className="bg-[var(--surface-primary)] text-[var(--text-primary)]">
                  Godavari Basin (81.78°E, 16.98°N)
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-[var(--primary-green)] absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* Risk Level Badge */}
          {riskData && (
            <div className="badge-risk" data-risk={riskData.risk_level}>
              <ShieldAlert className="w-3.5 h-3.5" />
              {riskData.risk_level} ({riskData.risk_score}/100)
            </div>
          )}
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
                        ? "text-[var(--quantum-violet)]"
                        : "text-[var(--primary-green)]"
                      : "text-[var(--text-secondary)]"
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
          className="p-2 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {resolved === "dark" ? <Sun className="w-4 h-4 text-[#E4BD4F]" /> : <Moon className="w-4 h-4 text-[var(--quantum-violet)]" />}
        </button>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          className="p-2 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] lg:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[var(--surface-primary)] border-b border-[var(--border)] shadow-lg p-4 space-y-4 lg:hidden animate-in slide-in-from-top-2">
          {/* Mobile Basin Selector */}
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-secondary)] rounded-md border border-[var(--border)]">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Basin Selection:</span>
            <select
              value={basinId}
              onChange={(e) => setBasinId(e.target.value as BasinId)}
              className="bg-[var(--surface-primary)] border border-[var(--border)] px-2 py-1 rounded font-semibold text-[var(--primary-green)] text-xs outline-none"
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
                        ? "bg-[var(--quantum-surface)] text-[var(--quantum-violet)] border border-[var(--quantum-border)]"
                        : "bg-[var(--soft-green)] text-[var(--primary-green)] border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
