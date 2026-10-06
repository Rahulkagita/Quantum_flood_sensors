import { motion, useSpring, useTransform } from "motion/react";
import { AlertTriangle, ArrowRight, Check, Cpu, Mail, MapPin, MessageCircle, MonitorDot, ShieldAlert, Eye } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CompareMaps } from "@/components/CompareMaps";
import { FloodScenarioSimulator } from "@/components/FloodScenarioSimulator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { summarizeNode, type Basin, type FloodDashboardData, type NetworkNode, type RiskLevel, type SensorDetail } from "@/lib/flood-intelligence";
import { mockAlertService, type AlertLevel } from "@/lib/alerts-service";
import type { FloodScenarioResult } from "@/lib/scenario-service";
import type { ResolvedTheme } from "@/lib/theme";
import { formatInr, strategyLabels, type OptimizationResult } from "@/lib/optimization-service";

const horizons = [6, 12, 24, 48] as const;

interface FloodDashboardProps {
  basin: Basin;
  data: FloodDashboardData;
  nodes: NetworkNode[];
  optimizedIds: string[];
  optimizationComplete: boolean;
  coverage: number;
  theme: ResolvedTheme;
  inspectedSensor: NetworkNode | undefined;
  onInspect: (node?: NetworkNode) => void;
  onLocate: (node: NetworkNode) => void;
  onOptimize: () => void;
  result: OptimizationResult | undefined;
  scenarioResult: FloodScenarioResult | undefined;
  onScenarioResult: (result: FloodScenarioResult) => void;
}

const levelOf = (score: number): RiskLevel => (score >= 85 ? "critical" : score >= 70 ? "high" : score >= 50 ? "medium" : "low");

export function FloodDashboard(props: FloodDashboardProps) {
  const { basin, data, nodes, optimizedIds, optimizationComplete, coverage, theme, inspectedSensor, onInspect, onLocate, onOptimize, result, scenarioResult, onScenarioResult } = props;
  const [horizon, setHorizon] = useState<(typeof horizons)[number]>(12);
  const forecast = useMemo(() => data.forecast.filter((point) => point.hour <= horizon), [data.forecast, horizon]);
  const sensors = nodes.filter((node) => node.kind === "sensor");
  const peak = forecast.reduce((max, point) => (point.risk > max.risk ? point : max), forecast[0] ?? { hour: 0, risk: 0, rainfall: 0, riverLevel: 0 });
  const tableNodes = nodes.filter((node) => node.kind !== "candidate" || optimizedIds.includes(node.id));
  const k = (v: number) => `${Math.round(v / 1000)}K`;
  const pts = (a: number, b: number) => `${b - a >= 0 ? "+" : ""}${(b - a).toFixed(1).replace(/\.0$/, "")} pts`;

  return <div className="workspace">
    {/* 02 — Forecast + risk */}
    <section id="forecast" className="ws-section" aria-labelledby="forecast-title">
      <SectionHeader index="02" title="Forecast and risk" id="forecast-title" meta={`${basin.station} · mock ensemble`}
        action={<div className="segmented" role="group" aria-label="Forecast horizon">{horizons.map((h) => <button key={h} type="button" data-active={horizon === h} onClick={() => setHorizon(h)}>{h}H</button>)}</div>}/>
      <div className="forecast-layout">
        <div>
          <div className="inline-metrics">
            <Metric label="Peak risk" value={<><Num value={peak.risk}/><small>/100</small></>} sub={<RiskTag level={levelOf(peak.risk)}/>}/>
            <Metric label="Peak in" value={<span className="font-mono">+{peak.hour}h</span>}/>
            <Metric label="River level" value={<><Num value={peak.riverLevel} decimals={1}/><small>m</small></>}/>
            <Metric label="High-risk area" value={<><Num value={data.highRiskArea}/><small>%</small></>} sub={<span className="text-muted-foreground">{data.uncoveredHighRiskArea}% uncovered</span>}/>
          </div>
          <div className="chart-legend"><Key tone="risk" label="Flood risk (0–100)"/><Key tone="rain" label="Rainfall (mm)"/><Key tone="river" label="River level (m)"/></div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={forecast} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs><linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--risk-critical)" stopOpacity=".22"/><stop offset="1" stopColor="var(--risk-critical)" stopOpacity="0"/></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5"/>
              <XAxis dataKey="hour" tickFormatter={(v) => `+${v}h`} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="a" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="b" orientation="right" domain={[6, 18]} hide/>
              <Tooltip content={<ChartTooltip/>} cursor={{ stroke: "var(--border)" }}/>
              <Area yAxisId="a" type="monotone" dataKey="risk" name="Flood risk" stroke="var(--risk-critical)" strokeWidth={2} fill="url(#riskFill)"/>
              <Line yAxisId="a" type="monotone" dataKey="rainfall" name="Rainfall" stroke="var(--water)" strokeWidth={1.75} dot={false}/>
              <Line yAxisId="b" type="monotone" dataKey="riverLevel" name="River level" stroke="var(--primary)" strokeWidth={1.75} dot={false} strokeDasharray="4 3"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <aside aria-label="Risk by zone">
          <p className="label">Predicted risk by zone</p>
          <ul className="zone-list">{[...data.zones].sort((a, b) => b.predicted - a.predicted).map((zone) => <li key={zone.zone}>
            <span>{zone.zone}</span>
            <div className="zone-bar" aria-hidden><i style={{ width: `${zone.historical}%` }} className="hist"/><i style={{ width: `${zone.predicted}%` }} data-risk={levelOf(zone.predicted)}/></div>
            <strong className="font-mono">{zone.predicted}</strong>
            <RiskTag level={levelOf(zone.predicted)} compact/>
          </li>)}</ul>
          <p className="footnote">Faint bar shows historical peak for the same zone.</p>
        </aside>
      </div>
    </section>

    {/* 03 — Sensor network */}
    <section id="network" className="ws-section" aria-labelledby="network-title">
      <SectionHeader index="03" title="Sensor network" id="network-title" meta="Locate any node on the map"/>
      <div className="inline-metrics five">
        <Metric label="Existing sensors" value={<Num value={sensors.length}/>}/>
        <Metric label="Candidate sites" value={<Num value={data.network.candidates}/>}/>
        <Metric label="Selected sensors" value={<Num value={optimizedIds.length}/>} sub={!optimizationComplete && <span className="text-muted-foreground">Pending optimization</span>}/>
        <Metric label="Risk coverage" value={<><Num value={coverage} decimals={coverage % 1 ? 1 : 0}/><small>%</small></>}/>
        <Metric label="Population covered" value={<><Num value={Math.round((result?.populationAfter ?? (basin.id === "krishna" ? 118000 : 124000)) / 1000)}/><small>K</small></>}/>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Node</th><th>Type</th><th>Location</th><th>Status</th><th className="num">Battery</th><th className="num">Coverage</th><th className="num">Risk served</th><th aria-label="Actions"/></tr></thead>
          <tbody>{tableNodes.map((node) => { const optimized = optimizedIds.includes(node.id); const s = summarizeNode(node, nodes, optimized); return <tr key={node.id} data-optimized={optimized}>
            <td className="font-mono"><NodeGlyph kind={node.kind} optimized={optimized}/>{s.id}</td><td>{s.type}</td><td>{s.location}</td>
            <td><span className="status" data-status={node.status}>{s.status}</span></td><td className="num font-mono">{s.battery}</td><td className="num font-mono">{s.coverageKm} km</td><td className="num font-mono">{s.riskServed}</td>
            <td className="actions"><Button variant="ghost" size="sm" onClick={() => onLocate(node)}><MapPin/> Locate</Button>{optimized && <Button variant="ghost" size="sm" onClick={() => onInspect(node)}>Details</Button>}</td>
          </tr>; })}</tbody>
        </table>
      </div>
    </section>

    {/* 04 — Quantum optimization */}
    <section id="optimization" className="ws-section" aria-labelledby="quantum-title">
      <SectionHeader index="04" title="Quantum optimization" id="quantum-title" meta="Quantum optimization simulation · QAOA-ready mock"
        action={<Button onClick={onOptimize}><Cpu/> {result ? "Reconfigure" : "Configure optimization"}</Button>}/>
      {result ? <div className="quantum-body">
        <div>
          <p className="label">Why these locations?</p>
          <p className="lede">The optimization selected locations that provide high risk-weighted coverage while satisfying sensor count, cost, range, spacing and connectivity constraints.</p>
          <p className="footnote">Strategy: {strategyLabels[result.request.optimizationStrategy]} · {result.request.sensorRangeKm} km detection · {result.request.communicationRangeKm} km links · {result.request.minimumSensorDistanceKm} km spacing · {result.request.forecastHorizonHours}h horizon.{!result.meetsMinimumCoverage && ` Minimum coverage of ${result.request.minimumRiskCoverage}% was not reached within these limits.`}</p>
          <p className="footnote font-mono">{[...result.recommendedSensors, ...result.recommendedRelays].join(" · ") || "No sites selected"}</p>
        </div>
        <dl className="spec-list">
          <Row label="Candidate locations" value={String(result.candidateCount)}/>
          <Row label="Selected sensors" value={`${result.recommendedSensors.length} of max ${result.request.maxSensors}`}/>
          <Row label="Communication nodes" value={`${result.recommendedRelays.length} of max ${result.request.maxRelays}`}/>
          <Row label="Risk-weighted coverage" value={`${result.coverageAfter}%`} strong/>
          <Row label="Population protected" value={`+${k(result.populationAfter - result.populationBefore)}`}/>
          <Row label="Deployment cost" value={`${formatInr(result.cost)} of ${formatInr(result.request.budget)}`}/>
          <Row label="Classical baseline (greedy)" value={`${result.baselineCoverage}%`}/>
          <Row label="QAOA-ready mock result" value={`${result.coverageAfter}%`}/>
        </dl>
      </div> : <p className="footnote">No optimization has been run for this area yet. Configure sensor, relay, budget and coverage limits to generate a network.</p>}
    </section>

    {/* 05 — Before / after */}
    <section id="impact" className="ws-section" aria-labelledby="impact-title">
      <SectionHeader index="05" title="Before and after" id="impact-title" meta="Synchronized maps · pan either side"/>
      <CompareMaps basin={basin} nodes={nodes} optimizedIds={result ? optimizedIds : []} theme={theme}/>
      <div className="impact-table" role="table" aria-label="Network impact comparison">
        <div role="row" className="head"><span role="columnheader">Metric</span><span role="columnheader">Current</span><span role="columnheader">Optimized</span><span role="columnheader">Change</span></div>
        {(() => { const r = result; const d = (v: string) => (r ? v : ""); const o = (v: string) => (r ? v : "—"); return <>
          <ImpactRow label="Sensor count" before={String(r?.sensorsBefore ?? sensors.length)} after={o(String((r?.sensorsBefore ?? 0) + (r?.recommendedSensors.length ?? 0)))} delta={d(`+${r?.recommendedSensors.length ?? 0}`)}/>
          <ImpactRow label="Risk-weighted coverage" before={`${r?.coverageBefore ?? data.network.coverage}%`} after={o(`${r?.coverageAfter}%`)} delta={d(r ? pts(r.coverageBefore, r.coverageAfter) : "")}/>
          <ImpactRow label="Population protected" before={k(r?.populationBefore ?? (basin.id === "krishna" ? 118000 : 124000))} after={o(k(r?.populationAfter ?? 0))} delta={d(`+${k((r?.populationAfter ?? 0) - (r?.populationBefore ?? 0))}`)}/>
          <ImpactRow label="Critical infrastructure" before={`${r?.infrastructureBefore ?? 53}%`} after={o(`${r?.infrastructureAfter}%`)} delta={d(r ? pts(r.infrastructureBefore, r.infrastructureAfter) : "")}/>
          <ImpactRow label="Deployment cost" before="—" after={o(formatInr(r?.cost ?? 0))} delta=""/>
          <ImpactRow label="Connectivity" before={`${r?.connectivityBefore ?? data.network.connectivity}%`} after={o(`${r?.connectivityAfter}%`)} delta={d(r ? pts(r.connectivityBefore, r.connectivityAfter) : "")}/>
          <ImpactRow label="Warning-time improvement" before="—" after={o(`+${r?.warningGainMinutes} min`)} delta=""/>
        </>; })()}
      </div>
      {!result && <p className="footnote">Run the optimization to populate the optimized network.</p>}
    </section>

    {/* 06 — Scenario + alerts */}
    <section id="scenarios" className="ws-section" aria-labelledby="scenario-title">
      <SectionHeader index="06" title="Scenarios and alerts" id="scenario-title" meta="Mock projection · ready for POST /api/scenario"/>
      <FloodScenarioSimulator basin={basin} currentCoverage={coverage} existingSensors={sensors.length} existingCommunicationNodes={nodes.filter((n) => n.kind === "relay").length} result={scenarioResult} onResult={onScenarioResult}/>
      <Alerts basinId={basin.id}/>
    </section>

    <footer className="ws-footer"><span>FLOOD//INTELLIGENCE</span><span>Frontend demonstration · all data is mock</span></footer>
    <SensorInspector sensor={inspectedSensor} detail={inspectedSensor ? data.sensorDetails[inspectedSensor.id] : undefined} onClose={() => onInspect(undefined)}/>
  </div>;
}

const levelIcon: Record<AlertLevel, ReactNode> = { watch: <Eye/>, warning: <AlertTriangle/>, critical: <ShieldAlert/> };
function Alerts({ basinId }: { basinId: Basin["id"] }) {
  const [channels, setChannels] = useState(() => mockAlertService.channels());
  const icons = { dashboard: <MonitorDot/>, email: <Mail/>, whatsapp: <MessageCircle/> };
  return <div id="alerts" className="alerts">
    <div>
      <p className="label">Active alerts</p>
      <ul className="alert-list">{mockAlertService.list(basinId).map((alert) => <li key={alert.id} data-level={alert.level}>
        <span className="alert-level">{levelIcon[alert.level]}{alert.level[0]?.toUpperCase()}{alert.level.slice(1)}</span>
        <div><strong>{alert.title}</strong><span>{alert.area} · {alert.source}</span></div>
        <time className="font-mono">{alert.issuedAt}</time>
      </li>)}</ul>
    </div>
    <div>
      <p className="label">Delivery channels</p>
      <ul className="channel-list">{channels.map((c) => <li key={c.channel}>
        {icons[c.channel]}<div><strong>{c.label}</strong><span>{c.connected ? "Active" : "Delivery not connected yet"}</span></div>
        <Switch checked={c.enabled} disabled={!c.connected} aria-label={`${c.label} alerts`} onCheckedChange={(enabled) => setChannels((all) => all.map((x) => (x.channel === c.channel ? { ...x, enabled } : x)))}/>
      </li>)}</ul>
    </div>
  </div>;
}

function SectionHeader({ index, title, id, meta, action }: { index: string; title: string; id: string; meta?: string; action?: ReactNode }) {
  return <header className="section-header"><span className="font-mono">{index}</span><div><h2 id={id}>{title}</h2>{meta && <p>{meta}</p>}</div>{action}</header>;
}
function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) { return <div className="metric"><p>{label}</p><strong>{value}</strong>{sub && <div className="metric-sub">{sub}</div>}</div>; }
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div><dt>{label}</dt><dd className="font-mono" data-strong={strong}>{value}</dd></div>; }
function ImpactRow({ label, before, after, delta }: { label: string; before: string; after: string; delta: string }) { return <div role="row"><span role="cell">{label}</span><span role="cell" className="font-mono">{before}</span><span role="cell" className="font-mono strong">{after}</span><span role="cell" className="font-mono delta">{delta}</span></div>; }
function Key({ tone, label }: { tone: string; label: string }) { return <span><i data-tone={tone}/>{label}</span>; }
export function RiskTag({ level, compact }: { level: RiskLevel; compact?: boolean }) { return <span className="risk-tag" data-risk={level}>{level === "critical" || level === "high" ? <AlertTriangle/> : <Check/>}{compact ? null : level[0]?.toUpperCase() + level.slice(1)}{compact && <span className="sr-only">{level}</span>}</span>; }
function NodeGlyph({ kind, optimized }: { kind: NetworkNode["kind"]; optimized: boolean }) { return <i className="node-glyph" data-kind={kind} data-optimized={optimized} aria-hidden/>; }
function Num({ value, decimals = 0 }: { value: number; decimals?: number }) { const spring = useSpring(value, { stiffness: 120, damping: 24 }); const out = useTransform(spring, (v) => v.toFixed(decimals)); useEffect(() => spring.set(value), [spring, value]); return <motion.span>{out}</motion.span>; }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><p className="font-mono">+{label} h</p>{payload.map((item) => <div key={item.name}><i style={{ background: item.color }}/><span>{item.name}</span><strong className="font-mono">{item.value}{item.name === "River level" ? " m" : item.name === "Rainfall" ? " mm" : ""}</strong></div>)}</div>;
}

function SensorInspector({ sensor, detail, onClose }: { sensor: NetworkNode | undefined; detail: SensorDetail | undefined; onClose: () => void }) {
  return <Sheet open={Boolean(sensor && detail)} onOpenChange={(open) => !open && onClose()}>
    <SheetContent side="right" className="inspector">
      <SheetHeader className="p-0"><p className="label">Optimized sensor · mock</p><SheetTitle className="font-mono text-2xl">{sensor?.id}</SheetTitle><SheetDescription>{detail?.location}</SheetDescription></SheetHeader>
      {detail && <>
        <dl className="spec-list">
          <Row label="Risk score" value={`${detail.riskScore} / 100`} strong/><Row label="Population exposure" value={detail.populationExposure.toLocaleString()}/>
          <Row label="Distance from river" value={`${detail.riverDistanceKm} km`}/><Row label="Coverage radius" value={`${detail.coverageRadiusKm} km`}/>
          <Row label="Risk captured" value={`${detail.riskCaptured}%`}/><Row label="Connected node" value={detail.relay}/>
        </dl>
        <p className="label mt-6">Why this location</p>
        <ul className="reasons">{["High forecast flood risk", "Gap in existing coverage", "High population exposure", "Reliable link to relay"].map((r) => <li key={r}><Check/>{r}</li>)}</ul>
        <Button variant="outline" className="mt-6 w-full" onClick={onClose}>Close <ArrowRight/></Button>
      </>}
    </SheetContent>
  </Sheet>;
}
