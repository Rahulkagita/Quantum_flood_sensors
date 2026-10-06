import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { Check, Crosshair, Layers3, Map as MapIcon, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { summarizeNode, type Basin, type NetworkNode } from "@/lib/flood-intelligence";
import type { ResolvedTheme } from "@/lib/theme";
import type { OptimizationStageId } from "@/lib/optimization-service";
import type { FloodScenarioResult } from "@/lib/scenario-service";
import { buildStyle, hillshadeProvider, mapStyleById, mapStyles, type BasemapId } from "@/lib/map-config";
import { basinView, basinsGeoJSON, circlePolygon, gridToLngLat, historicalExtentGeoJSON, infrastructureGeoJSON, nodeCoordinates, placesGeoJSON, rainfallGeoJSON, riskGeoJSON, riverGauges, riversGeoJSON, zoneCoordinates, type LngLat } from "@/lib/geo-data";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapLayer = "Flood Risk" | "Rainfall" | "River Level" | "Historical Flood Extent" | "Elevation" | "Population" | "Critical Infrastructure" | "River Network" | "Existing Sensors" | "Candidate Sensors" | "Optimized Sensors" | "Communication Nodes" | "Coverage" | "Network Links";

interface FloodMapProps {
  basin: Basin;
  nodes: NetworkNode[];
  selectedId: string | undefined;
  onSelect: (node?: NetworkNode) => void;
  optimizedIds: string[];
  focusSignal: number;
  optimizationStage: OptimizationStageId | undefined;
  /** Detection radius drawn for optimized sensors. */
  sensorRangeKm?: number;
  scenarioResult: FloodScenarioResult | undefined;
  theme: ResolvedTheme;
  /** HUD slots — laid out in a grid so they never overlap the control rail. */
  left?: ReactNode;
  status?: ReactNode;
  center?: ReactNode;
}

const layerGroups: { label: string; items: MapLayer[] }[] = [
  { label: "Analytical", items: ["Flood Risk", "Rainfall", "River Level", "Historical Flood Extent", "Elevation", "Population", "Critical Infrastructure"] },
  { label: "Network", items: ["River Network", "Existing Sensors", "Candidate Sensors", "Optimized Sensors", "Communication Nodes", "Coverage", "Network Links"] },
];

/** MapLayer → MapLibre layer ids it controls. */
const layerIds: Record<MapLayer, string[]> = {
  "Flood Risk": ["risk-fill", "risk-line"],
  Rainfall: ["rain-fill"],
  "River Level": ["gauge-circle", "gauge-label"],
  "Historical Flood Extent": ["hist-fill", "hist-line"],
  Elevation: ["hillshade"],
  Population: ["pop-circle"],
  "Critical Infrastructure": ["infra-circle", "infra-label"],
  "River Network": ["river-casing", "river-line", "river-label"],
  "Existing Sensors": ["sensor-circle"],
  "Candidate Sensors": ["candidate-circle"],
  "Optimized Sensors": ["optimized-halo", "optimized-circle"],
  "Communication Nodes": ["relay-symbol"],
  Coverage: ["coverage-fill", "coverage-line"],
  "Network Links": ["link-line"],
};

const defaultLayers: MapLayer[] = ["Flood Risk", "River Network", "Existing Sensors", "Optimized Sensors", "Communication Nodes", "Coverage", "Network Links"];
const C = { cyan: "#2fc4c4", mint: "#c9f5ea", water: "#4aa8d8", low: "#3fae6a", medium: "#e0a93b", high: "#e57a3a", critical: "#d9483b", ink: "#0b1220", slate: "#94a3b8" };
const riskColor = ["match", ["get", "risk"], "low", C.low, "medium", C.medium, "high", C.high, "critical", C.critical, C.slate] as unknown as string;
const empty = { type: "FeatureCollection" as const, features: [] as unknown[] };

const coordOf = (basinId: Basin["id"], node: NetworkNode): LngLat => nodeCoordinates[node.id] ?? gridToLngLat(basinId, node.x, node.y);

export function FloodMap({ basin, nodes, selectedId, onSelect, optimizedIds, focusSignal, optimizationStage, sensorRangeKm = 5, scenarioResult, theme, left, status, center }: FloodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | undefined>(undefined);
  const nodesRef = useRef(nodes);
  const onSelectRef = useRef(onSelect);
  nodesRef.current = nodes;
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>(theme);
  const [popupAt, setPopupAt] = useState<{ x: number; y: number }>();
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const [layers, setLayers] = useState<Set<MapLayer>>(() => new Set(defaultLayers));
  const isMobile = useIsMobile();

  // Create the map once, client-side only.
  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    void import("maplibre-gl").then((mod) => {
      const maplibregl = (mod as unknown as { default?: typeof mod }).default ?? mod;
      if (disposed || !containerRef.current) return;
      const view = basinView[basin.id];
      const style = buildStyle(mapStyleById[basemap]);
      style.glyphs = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";
      const map = new maplibregl.Map({ container: containerRef.current, style, center: view.center, zoom: view.zoom, minZoom: 5, maxZoom: 15, attributionControl: { compact: true }, cooperativeGestures: true, dragRotate: false, pitchWithRotate: false });
      map.touchZoomRotate.disableRotation();
      map.scrollZoom.setWheelZoomRate(1 / 600);
      mapRef.current = map;
      // Sidebar collapse/expand changes the container width without a window
      // resize, so observe the container and keep the canvas in sync.
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      map.on("load", () => { addOverlays(map); setReady(true); });
      const clickable = ["sensor-circle", "candidate-circle", "optimized-circle", "relay-symbol"];
      map.on("click", (event) => {
        const hit = map.queryRenderedFeatures(event.point, { layers: clickable.filter((id) => map.getLayer(id)) })[0];
        const id = hit?.properties?.['id'] as string | undefined;
        onSelectRef.current(id ? nodesRef.current.find((node) => node.id === id) : undefined);
      });
      clickable.forEach((id) => {
        map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
      });
    });
    return () => { disposed = true; resizeObserver?.disconnect(); mapRef.current?.remove(); mapRef.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap switching swaps the underlying raster sources; overlays stay intact.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const style = map.getStyle();
    style.layers.filter((layer) => layer.id.startsWith("base-")).forEach((layer) => map.removeLayer(layer.id));
    Object.keys(style.sources).filter((id) => !id.startsWith("ov-")).forEach((id) => map.removeSource(id));
    const firstOverlay = map.getStyle().layers[0]?.id;
    mapStyleById[basemap].providers.forEach((provider) => {
      map.addSource(provider.id, { type: "raster", tiles: provider.tiles, tileSize: provider.tileSize, maxzoom: provider.maxzoom, attribution: provider.attribution });
      map.addLayer({ id: `base-${provider.id}`, type: "raster", source: provider.id }, firstOverlay);
    });
    const light = mapStyleById[basemap].tone === "light";
    map.setPaintProperty("basin-line", "line-color", light ? "#334155" : "#cbd5e1");
    ["river-label", "infra-label", "gauge-label"].forEach((id) => { map.setPaintProperty(id, "text-color", light ? "#0f172a" : "#e2e8f0"); map.setPaintProperty(id, "text-halo-color", light ? "#ffffff" : C.ink); });
  }, [basemap, ready]);

  // Layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const candidateStage = !!optimizationStage && ["candidates", "matrix", "qubo", "qaoa", "evaluation"].includes(optimizationStage);
    (Object.keys(layerIds) as MapLayer[]).forEach((layer) => {
      const on = layer === "Candidate Sensors" ? layers.has(layer) || candidateStage : layers.has(layer);
      layerIds[layer].forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", on ? "visible" : "none"));
    });
  }, [layers, ready, optimizationStage]);

  // Network data: nodes, links, coverage (animated for newly optimized sensors).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const features = nodes.map((node) => ({ type: "Feature" as const, properties: { id: node.id, kind: node.kind, label: node.label, optimized: optimizedIds.includes(node.id), selected: node.id === selectedId }, geometry: { type: "Point" as const, coordinates: coordOf(basin.id, node) } }));
    (map.getSource("ov-nodes") as GeoJSONSource).setData({ type: "FeatureCollection", features });
    const relayPoints = nodes.filter((node) => node.kind === "relay").map((node) => coordOf(basin.id, node));
    const nearestRelay = (p: LngLat) => relayPoints.reduce<LngLat | undefined>((best, r) => (!best || (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2 < (best[0] - p[0]) ** 2 + (best[1] - p[1]) ** 2 ? r : best), undefined);
    const active = nodes.filter((node) => node.kind === "sensor" || (node.kind === "candidate" && optimizedIds.includes(node.id)));
    const startedAt = performance.now();
    let frame = 0;
    const draw = () => {
      const t = Math.min(1, (performance.now() - startedAt) / 700);
      const ease = 1 - (1 - t) ** 3;
      const isNew = (node: NetworkNode) => node.kind === "candidate" && node.id === optimizedIds[optimizedIds.length - 1];
      const links = relayPoints.length ? active.map((node) => {
        const from = coordOf(basin.id, node);
        const relayAt = nearestRelay(from) as LngLat;
        const k = isNew(node) ? ease : 1;
        return { type: "Feature" as const, properties: { optimized: node.kind === "candidate" }, geometry: { type: "LineString" as const, coordinates: [relayAt, [relayAt[0] + (from[0] - relayAt[0]) * k, relayAt[1] + (from[1] - relayAt[1]) * k]] } };
      }) : [];
      const coverage = active.map((node) => circlePolygon(coordOf(basin.id, node), (node.kind === "candidate" ? sensorRangeKm : 5) * (isNew(node) ? ease : 1), { optimized: node.kind === "candidate" }));
      (map.getSource("ov-links") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: links });
      (map.getSource("ov-coverage") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: coverage });
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [nodes, optimizedIds, selectedId, basin.id, ready, sensorRangeKm]);

  // Scenario critical zones.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const zones = scenarioResult?.criticalZones.map((zone, index) => circlePolygon(zoneCoordinates[zone.id] ?? gridToLngLat(basin.id, zone.x, zone.y), 7 + index, { label: zone.label })) ?? [];
    (map.getSource("ov-scenario") as GeoJSONSource).setData({ type: "FeatureCollection", features: zones });
  }, [scenarioResult, basin.id, ready]);

  // Theme-following basemap: only Dark/Light follow the app theme; explicit choices stay.
  useEffect(() => { setBasemap((current) => (current === "dark" || current === "light" ? theme : current)); }, [theme]);

  // Anchor the node popover to the selected marker as the map moves.
  const selectedNode = nodes.find((node) => node.id === selectedId);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedNode) { setPopupAt(undefined); return; }
    const update = () => { const p = map.project(coordOf(basin.id, selectedNode)); setPopupAt({ x: p.x, y: p.y }); };
    update();
    map.on("move", update);
    return () => { map.off("move", update); };
  }, [selectedNode, ready, basin.id]);

  useEffect(() => {
    const onChange = () => { setFullscreen(document.fullscreenElement === frameRef.current); window.setTimeout(() => mapRef.current?.resize(), 50); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void frameRef.current?.requestFullscreen?.(); };

  const focus = () => { const view = basinView[basin.id]; mapRef.current?.flyTo({ center: view.center, zoom: view.zoom, duration: 1200, essential: true }); };
  useEffect(() => { if (ready) focus(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basin.id, focusSignal, ready]);

  const toggleLayer = (layer: MapLayer) => setLayers((current) => { const next = new Set(current); if (next.has(layer)) next.delete(layer); else next.add(layer); return next; });

  const basemapPanel = <BasemapPicker basemap={basemap} setBasemap={setBasemap}/>;
  const layerPanel = <LayerPicker layers={layers} toggleLayer={toggleLayer}/>;

  return (
    <section ref={frameRef} className="map-frame" aria-label={`${basin.name} basin interactive flood map`}>
      <div ref={containerRef} className="map-canvas"/>
      <div className="map-hud">
        <div className="hud-left">{left}</div>
        <div className="hud-rail" role="toolbar" aria-label="Map controls">
          <Button variant="map" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Plus/></Button>
          <Button variant="map" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => mapRef.current?.zoomOut()}><Minus/></Button>
          <Button variant="map" size="icon" aria-label="Recenter on basin" title="Locate basin" onClick={focus}><Crosshair/></Button>
          <Button variant="map" size="icon" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen map"} title="Fullscreen" onClick={toggleFullscreen}>{fullscreen ? <Minimize2/> : <Maximize2/>}</Button>
          <span className="rail-divider"/>
          <RailMenu mobile={isMobile} label="Map layers" icon={<Layers3/>} title="Layers">{layerPanel}</RailMenu>
          <RailMenu mobile={isMobile} label="Basemap" icon={<MapIcon/>} title="Basemap">{basemapPanel}</RailMenu>
        </div>
        <div className="hud-bottom">
          <Legend/>
          {status}
        </div>
      </div>
      {selectedNode && popupAt && <NodePopover x={popupAt.x} y={popupAt.y} node={selectedNode} nodes={nodes} optimized={optimizedIds.includes(selectedNode.id)} onClose={() => onSelect(undefined)}/>}
      {center}
    </section>
  );
}

function RailMenu({ mobile, label, icon, title, children }: { mobile: boolean; label: string; icon: ReactNode; title: string; children: ReactNode }) {
  const trigger = <Button variant="map" size="icon" aria-label={label} title={title}>{icon}</Button>;
  if (mobile) return <Sheet><SheetTrigger asChild>{trigger}</SheetTrigger><SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-lg p-5"><SheetHeader className="p-0"><SheetTitle className="text-left">{title}</SheetTitle></SheetHeader>{children}</SheetContent></Sheet>;
  return <Popover><PopoverTrigger asChild>{trigger}</PopoverTrigger><PopoverContent side="left" align="start" sideOffset={10} className="map-popover">{children}</PopoverContent></Popover>;
}

function BasemapPicker({ basemap, setBasemap }: { basemap: BasemapId; setBasemap: (id: BasemapId) => void }) {
  return <div><p className="hud-meta">Basemap</p><div className="basemap-grid">{mapStyles.map((style) => <button key={style.id} type="button" className="basemap-option" data-active={basemap === style.id} onClick={() => setBasemap(style.id)}><img src={style.thumbnail} alt="" loading="lazy"/><span>{style.label}</span></button>)}</div><p className="mt-3 text-xs leading-snug text-muted-foreground">Public development tiles. Dark and Light follow the app theme.</p></div>;
}

function LayerPicker({ layers, toggleLayer }: { layers: Set<MapLayer>; toggleLayer: (layer: MapLayer) => void }) {
  return <div className="space-y-4">{layerGroups.map((group) => <section key={group.label}><p className="hud-meta">{group.label}</p><div className="mt-1.5 grid gap-0.5">{group.items.map((item) => { const active = layers.has(item); return <button key={item} type="button" className="layer-option" data-active={active} onClick={() => toggleLayer(item)}><span className="layer-check">{active && <Check/>}</span>{item}</button>; })}</div></section>)}</div>;
}

function Legend() {
  return <div className="map-legend" aria-label="Map legend">
    <div className="legend-risk">{(["low", "medium", "high", "critical"] as const).map((r) => <span key={r}><i data-risk={r}/>{r[0]?.toUpperCase()}{r.slice(1)}</span>)}</div>
    <div className="legend-keys"><span><b className="key-sensor"/>Sensor</span><span><b className="key-candidate"/>Candidate</span><span><b className="key-optimized"/>Optimized</span><span><b className="key-relay"/>Relay</span></div>
  </div>;
}

function NodePopover({ x, y, node, nodes, optimized, onClose }: { x: number; y: number; node: NetworkNode; nodes: NetworkNode[]; optimized: boolean; onClose: () => void }) {
  const s = summarizeNode(node, nodes, optimized);
  const rows: [string, string][] = [["Type", s.type], ["Status", s.status], ["Battery", s.battery], ["Coverage", `${s.coverageKm} km`], ["Risk served", s.riskServed], ["Link", s.link]];
  return <div className="node-popover" role="dialog" aria-label={`Sensor ${s.id}`} style={{ left: x, top: y }}>
    <header><div><strong className="font-mono">{s.id}</strong><span>{s.location}</span></div><button type="button" aria-label="Close" onClick={onClose}><X/></button></header>
    <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
  </div>;
}

function makeIcon(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 40) {
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size);
  return ctx?.getImageData(0, 0, size, size);
}

function addOverlays(map: MapLibreMap) {
  const relay = makeIcon((ctx, s) => { ctx.translate(s / 2, s / 2); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#e2e8f0"; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.fillRect(-9, -9, 18, 18); ctx.strokeRect(-9, -9, 18, 18); });
  if (relay) map.addImage("relay-icon", relay, { pixelRatio: 2 });
  const src = (id: string, data: unknown) => map.addSource(`ov-${id}`, { type: "geojson", data: data as GeoJSON.FeatureCollection });
  src("basins", basinsGeoJSON); src("risk", riskGeoJSON); src("hist", historicalExtentGeoJSON); src("rain", rainfallGeoJSON); src("rivers", riversGeoJSON);
  src("places", placesGeoJSON); src("infra", infrastructureGeoJSON); src("gauges", riverGauges); src("nodes", empty); src("links", empty); src("coverage", empty); src("scenario", empty);
  map.addSource("ov-hillshade", { type: "raster", tiles: hillshadeProvider.tiles, tileSize: 256, maxzoom: hillshadeProvider.maxzoom, attribution: hillshadeProvider.attribution });
  const font = ["Noto Sans Regular"];
  const L = map.addLayer.bind(map);
  L({ id: "hillshade", type: "raster", source: "ov-hillshade", paint: { "raster-opacity": 0.4 }, layout: { visibility: "none" } });
  L({ id: "basin-line", type: "line", source: "ov-basins", paint: { "line-color": "#cbd5e1", "line-width": 1, "line-opacity": 0.45, "line-dasharray": [4, 3] } });
  L({ id: "hist-fill", type: "fill", source: "ov-hist", paint: { "fill-color": C.water, "fill-opacity": 0.12 } });
  L({ id: "hist-line", type: "line", source: "ov-hist", paint: { "line-color": C.water, "line-width": 1.2, "line-dasharray": [2, 2] } });
  L({ id: "risk-fill", type: "fill", source: "ov-risk", paint: { "fill-color": riskColor, "fill-opacity": 0.3 } });
  L({ id: "risk-line", type: "line", source: "ov-risk", paint: { "line-color": riskColor, "line-width": 1, "line-opacity": 0.8 } });
  L({ id: "rain-fill", type: "fill", source: "ov-rain", paint: { "fill-color": "#5b8def", "fill-opacity": ["interpolate", ["linear"], ["get", "mm"], 60, 0.12, 140, 0.3] } });
  L({ id: "river-casing", type: "line", source: "ov-rivers", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": C.water, "line-opacity": 0.25, "line-width": ["interpolate", ["linear"], ["zoom"], 6, 4, 11, 14] } });
  L({ id: "river-line", type: "line", source: "ov-rivers", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": C.water, "line-width": ["interpolate", ["linear"], ["zoom"], 6, ["case", ["get", "main"], 1.8, 1], 11, ["case", ["get", "main"], 4, 2.5]] } });
  L({ id: "river-label", type: "symbol", source: "ov-rivers", filter: ["get", "main"], layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-font": font, "text-size": 12, "text-letter-spacing": 0.08 }, paint: { "text-color": "#e2e8f0", "text-halo-color": C.ink, "text-halo-width": 1.4 } });
  L({ id: "scenario-fill", type: "fill", source: "ov-scenario", paint: { "fill-color": C.critical, "fill-opacity": 0.18 } });
  L({ id: "scenario-line", type: "line", source: "ov-scenario", paint: { "line-color": C.critical, "line-width": 1.6, "line-dasharray": [3, 2] } });
  L({ id: "pop-circle", type: "circle", source: "ov-places", layout: { visibility: "none" }, paint: { "circle-color": "#e2e8f0", "circle-opacity": 0.18, "circle-stroke-color": "#e2e8f0", "circle-stroke-width": 1, "circle-stroke-opacity": 0.5, "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "population"]], 150, 6, 1200, 26] } });
  L({ id: "coverage-fill", type: "fill", source: "ov-coverage", paint: { "fill-color": ["case", ["get", "optimized"], C.mint, C.cyan], "fill-opacity": ["case", ["get", "optimized"], 0.16, 0.08] } });
  L({ id: "coverage-line", type: "line", source: "ov-coverage", paint: { "line-color": ["case", ["get", "optimized"], C.mint, C.cyan], "line-width": 1, "line-opacity": 0.6 } });
  L({ id: "link-line", type: "line", source: "ov-links", layout: { "line-cap": "round" }, paint: { "line-color": ["case", ["get", "optimized"], C.mint, "#cbd5e1"], "line-width": 1.4, "line-opacity": 0.75, "line-dasharray": [2, 1.5] } });
  L({ id: "infra-circle", type: "circle", source: "ov-infra", layout: { visibility: "none" }, paint: { "circle-radius": 4.5, "circle-color": "#f8fafc", "circle-stroke-color": C.ink, "circle-stroke-width": 2 } });
  L({ id: "infra-label", type: "symbol", source: "ov-infra", layout: { visibility: "none", "text-field": ["get", "name"], "text-font": font, "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top" }, paint: { "text-color": "#e2e8f0", "text-halo-color": C.ink, "text-halo-width": 1.2 } });
  L({ id: "gauge-circle", type: "circle", source: "ov-gauges", layout: { visibility: "none" }, paint: { "circle-radius": 6, "circle-color": riskColor, "circle-stroke-color": "#f8fafc", "circle-stroke-width": 1.5 } });
  L({ id: "gauge-label", type: "symbol", source: "ov-gauges", layout: { visibility: "none", "text-field": ["get", "name"], "text-font": font, "text-size": 11, "text-offset": [0.9, 0], "text-anchor": "left" }, paint: { "text-color": "#e2e8f0", "text-halo-color": C.ink, "text-halo-width": 1.2 } });
  L({ id: "candidate-circle", type: "circle", source: "ov-nodes", filter: ["all", ["==", ["get", "kind"], "candidate"], ["!", ["get", "optimized"]]], layout: { visibility: "none" }, paint: { "circle-radius": 5.5, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": C.mint, "circle-stroke-width": 1.6 } });
  L({ id: "sensor-circle", type: "circle", source: "ov-nodes", filter: ["==", ["get", "kind"], "sensor"], paint: { "circle-radius": ["case", ["get", "selected"], 7.5, 5.5], "circle-color": C.cyan, "circle-stroke-color": C.ink, "circle-stroke-width": 2 } });
  L({ id: "optimized-halo", type: "circle", source: "ov-nodes", filter: ["get", "optimized"], paint: { "circle-radius": 12, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": C.mint, "circle-stroke-width": 1.2, "circle-stroke-opacity": 0.7 } });
  L({ id: "optimized-circle", type: "circle", source: "ov-nodes", filter: ["get", "optimized"], paint: { "circle-radius": ["case", ["get", "selected"], 8, 6.5], "circle-color": C.mint, "circle-stroke-color": C.ink, "circle-stroke-width": 2 } });
  L({ id: "relay-symbol", type: "symbol", source: "ov-nodes", filter: ["==", ["get", "kind"], "relay"], layout: { "icon-image": "relay-icon", "icon-allow-overlap": true } });
}
