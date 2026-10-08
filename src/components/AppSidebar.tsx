import {
  AlertTriangle,
  BarChart3,
  Cpu,
  LayoutGrid,
  Monitor,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme, type ThemePreference } from "@/lib/theme";

export interface NavItem {
  readonly id: "overview" | "forecast" | "optimization" | "network" | "alerts";
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly isQuantum?: boolean;
}

export const navItems = [
  { id: "overview", label: "1. Command Center", icon: LayoutGrid, isQuantum: false },
  { id: "forecast", label: "2. Forecast & Risk", icon: BarChart3, isQuantum: false },
  { id: "optimization", label: "3. Quantum Optimization", icon: Cpu, isQuantum: true },
  { id: "network", label: "4. Network Optimization", icon: Network, isQuantum: false },
  { id: "alerts", label: "5. Response & Alerts", icon: AlertTriangle, isQuantum: false },
] as const;

export const scrollToSection = (id: string) => {
  if (id === "overview") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** Tracks which section is in view so the rail can mark it. */
function useActiveSection() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const ids = navItems.map((item) => item.id).filter((id) => id !== "overview");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

const themeIcons: Record<ThemePreference, ReactNode> = {
  dark: <Moon className="w-4 h-4" />,
  light: <Sun className="w-4 h-4" />,
  system: <Monitor className="w-4 h-4" />,
};

export function ThemeMenu({ trigger }: { trigger: ReactNode }) {
  const { preference, setPreference } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        className="w-40 bg-slate-900 border-slate-800 text-slate-200"
      >
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(v) => setPreference(v as ThemePreference)}
        >
          {(["dark", "light", "system"] as const).map((v) => (
            <DropdownMenuRadioItem key={v} value={v} className="gap-2 text-xs font-mono">
              {themeIcons[v]}
              {v[0]?.toUpperCase()}
              {v.slice(1)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsSheet({ trigger }: { trigger: ReactNode }) {
  const { preference, setPreference } = useTheme();
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="left"
        className="bg-slate-950 border-slate-800 text-slate-100 font-mono text-xs"
      >
        <SheetHeader className="p-0">
          <SheetTitle className="text-slate-100 text-sm font-bold">EOC SETTINGS</SheetTitle>
          <SheetDescription className="text-slate-400 text-xs">
            System configuration & display preferences.
          </SheetDescription>
        </SheetHeader>
        <p className="text-slate-400 mt-6 font-bold uppercase">Color Theme</p>
        <div className="flex gap-2 mt-2" role="group" aria-label="Theme">
          {(["dark", "light", "system"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 ${preference === v ? "bg-cyan-950 border-cyan-500 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-400"}`}
              onClick={() => setPreference(v)}
            >
              {themeIcons[v]}
              {v[0]?.toUpperCase()}
              {v.slice(1)}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-xs border-t border-slate-800 pt-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Precipitation Grid:</span>
            <span className="text-cyan-400">IMD 0.25° NetCDF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Population Grid:</span>
            <span className="text-cyan-400">WorldPop 100m GeoTIFF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Quantum Backend:</span>
            <span className="text-purple-400">Qiskit 2.5 Statevector</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Primary Forecaster:</span>
            <span className="text-emerald-400">Logistic Regression</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const active = useActiveSection();
  const { resolved } = useTheme();
  return (
    <>
      <nav className="rail" data-expanded={expanded} aria-label="Primary">
        <div className="rail-brand font-mono font-bold text-xs tracking-wider text-cyan-400">
          <span className="rail-mark" aria-hidden>
            EOC
          </span>
          {expanded && <span className="ml-2 text-slate-200 uppercase">Disaster Command</span>}
        </div>
        <ul className="space-y-1 mt-4">
          {navItems.map(({ id, label, icon: Icon, isQuantum }) => (
            <li key={id}>
              <button
                type="button"
                className={`rail-item ${isQuantum ? "hover:text-purple-300" : ""}`}
                data-active={active === id}
                aria-current={active === id ? "true" : undefined}
                title={label}
                onClick={() => scrollToSection(id)}
              >
                <Icon className={isQuantum ? "text-purple-400" : ""} />
                <span className={isQuantum ? "text-purple-300 font-semibold" : ""}>{label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="rail-bottom mt-auto border-t border-slate-800 pt-2 space-y-1">
          <SettingsSheet
            trigger={
              <button type="button" className="rail-item" title="Settings">
                <Settings />
                <span>Settings</span>
              </button>
            }
          />
          <ThemeMenu
            trigger={
              <button type="button" className="rail-item" title="Theme">
                {resolved === "dark" ? <Moon /> : <Sun />}
                <span>Theme</span>
              </button>
            }
          />
          <button
            type="button"
            className="rail-item"
            onClick={onToggle}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            <span>Collapse</span>
          </button>
        </div>
      </nav>
      <nav
        className="bottom-nav border-t border-slate-800 bg-slate-950/95"
        aria-label="Primary mobile"
      >
        {navItems.map(({ id, label, icon: Icon, isQuantum }) => (
          <button
            key={id}
            type="button"
            data-active={active === id}
            onClick={() => scrollToSection(id)}
            className="flex flex-col items-center gap-1 p-2 text-[10px] font-mono"
          >
            <Icon className={`w-4 h-4 ${isQuantum ? "text-purple-400" : "text-cyan-400"}`} />
            <span className={isQuantum ? "text-purple-300" : "text-slate-300"}>
              {label.split(". ")[1]}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
