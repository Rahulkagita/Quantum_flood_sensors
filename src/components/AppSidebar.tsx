import { AlertTriangle, BarChart3, Cpu, FlaskConical, LayoutGrid, Map as MapIcon, Monitor, Moon, Network, PanelLeftClose, PanelLeftOpen, Settings, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme, type ThemePreference } from "@/lib/theme";

export const navItems = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "forecast", label: "Forecast", icon: BarChart3 },
  { id: "network", label: "Network", icon: Network },
  { id: "optimization", label: "Optimization", icon: Cpu },
  { id: "scenarios", label: "Scenarios", icon: FlaskConical },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
] as const;

export const scrollToSection = (id: string) => {
  if (id === "overview") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** Tracks which section is in view so the rail can mark it. */
function useActiveSection() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const ids = navItems.map((item) => item.id).filter((id) => id !== "overview");
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id === "map" && window.scrollY < 40 ? "overview" : visible.target.id);
    }, { rootMargin: "-35% 0px -55% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return active;
}

const themeIcons: Record<ThemePreference, ReactNode> = { dark: <Moon/>, light: <Sun/>, system: <Monitor/> };

export function ThemeMenu({ trigger }: { trigger: ReactNode }) {
  const { preference, setPreference } = useTheme();
  return <DropdownMenu><DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
    <DropdownMenuContent side="right" align="end" className="w-40">
      <DropdownMenuRadioGroup value={preference} onValueChange={(v) => setPreference(v as ThemePreference)}>
        {(["dark", "light", "system"] as const).map((v) => <DropdownMenuRadioItem key={v} value={v} className="gap-2">{themeIcons[v]}{v[0]?.toUpperCase()}{v.slice(1)}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function SettingsSheet({ trigger }: { trigger: ReactNode }) {
  const { preference, setPreference } = useTheme();
  return <Sheet><SheetTrigger asChild>{trigger}</SheetTrigger>
    <SheetContent side="left" className="settings-sheet">
      <SheetHeader className="p-0"><SheetTitle>Settings</SheetTitle><SheetDescription>Preferences are saved in this browser.</SheetDescription></SheetHeader>
      <p className="label mt-6">Theme</p>
      <div className="segmented mt-2" role="group" aria-label="Theme">{(["dark", "light", "system"] as const).map((v) => <button key={v} type="button" data-active={preference === v} aria-pressed={preference === v} onClick={() => setPreference(v)}>{themeIcons[v]}{v[0]?.toUpperCase()}{v.slice(1)}</button>)}</div>
      <dl className="spec-list mt-6"><div><dt>Data source</dt><dd>Mock services</dd></div><div><dt>Optimization solver</dt><dd>Mock · QAOA-ready</dd></div><div><dt>Units</dt><dd>Metric</dd></div></dl>
    </SheetContent>
  </Sheet>;
}

export function AppSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const active = useActiveSection();
  const { resolved } = useTheme();
  return <>
    <nav className="rail" data-expanded={expanded} aria-label="Primary">
      <div className="rail-brand"><span className="rail-mark" aria-hidden>F//I</span>{expanded && <span>Flood Intelligence</span>}</div>
      <ul>{navItems.map(({ id, label, icon: Icon }) => <li key={id}>
        <button type="button" className="rail-item" data-active={active === id} aria-current={active === id ? "true" : undefined} title={label} onClick={() => scrollToSection(id)}><Icon/><span>{label}</span></button>
      </li>)}</ul>
      <div className="rail-bottom">
        <SettingsSheet trigger={<button type="button" className="rail-item" title="Settings"><Settings/><span>Settings</span></button>}/>
        <ThemeMenu trigger={<button type="button" className="rail-item" title="Theme">{resolved === "dark" ? <Moon/> : <Sun/>}<span>Theme</span></button>}/>
        <button type="button" className="rail-item" onClick={onToggle} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} title={expanded ? "Collapse" : "Expand"}>{expanded ? <PanelLeftClose/> : <PanelLeftOpen/>}<span>Collapse</span></button>
      </div>
    </nav>
    <nav className="bottom-nav" aria-label="Primary mobile">
      {navItems.filter((item) => item.id !== "overview").slice(0, 5).map(({ id, label, icon: Icon }) => <button key={id} type="button" data-active={active === id} onClick={() => scrollToSection(id)}><Icon/><span>{label}</span></button>)}
    </nav>
  </>;
}
