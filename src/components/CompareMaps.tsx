import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Basin, NetworkNode } from "@/lib/flood-intelligence";
import type { ResolvedTheme } from "@/lib/theme";
import { buildStyle, mapStyleById } from "@/lib/map-config";
import { basinView, circlePolygon, gridToLngLat, nodeCoordinates, riskGeoJSON, riversGeoJSON } from "@/lib/geo-data";

interface CompareMapsProps { basin: Basin; nodes: NetworkNode[]; optimizedIds: string[]; theme: ResolvedTheme; }

const risk = ["match", ["get", "risk"], "low", "#3fae6a", "medium", "#e0a93b", "high", "#e57a3a", "critical", "#d9483b", "#94a3b8"] as unknown as string;

/** Two real MapLibre maps (current vs optimized) with synchronized camera. */
export function CompareMaps({ basin, nodes, optimizedIds, theme }: CompareMapsProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const maps = useRef<MapLibreMap[]>([]);

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then((mod) => {
      const maplibregl = (mod as unknown as { default?: typeof mod }).default ?? mod;
      if (disposed || !leftRef.current || !rightRef.current) return;
      const view = basinView[basin.id];
      const coord = (node: NetworkNode) => nodeCoordinates[node.id] ?? gridToLngLat(basin.id, node.x, node.y);
      const build = (container: HTMLDivElement, optimized: boolean) => {
        const map = new maplibregl.Map({ container, style: buildStyle(mapStyleById[theme]), center: view.center, zoom: view.zoom - 0.3, attributionControl: false, cooperativeGestures: true, dragRotate: false });
        map.on("load", () => {
          const active = nodes.filter((node) => node.kind === "sensor" || (optimized && optimizedIds.includes(node.id)));
          map.addSource("risk", { type: "geojson", data: riskGeoJSON as GeoJSON.FeatureCollection });
          map.addSource("rivers", { type: "geojson", data: riversGeoJSON as GeoJSON.FeatureCollection });
          map.addSource("coverage", { type: "geojson", data: { type: "FeatureCollection", features: active.map((node) => circlePolygon(coord(node), node.kind === "candidate" ? 6.2 : 5, { optimized: node.kind === "candidate" })) } as GeoJSON.FeatureCollection });
          map.addSource("nodes", { type: "geojson", data: { type: "FeatureCollection", features: [...active, ...nodes.filter((n) => n.kind === "relay")].map((node) => ({ type: "Feature", properties: { kind: node.kind }, geometry: { type: "Point", coordinates: coord(node) } })) } as GeoJSON.FeatureCollection });
          map.addLayer({ id: "risk", type: "fill", source: "risk", paint: { "fill-color": risk, "fill-opacity": 0.28 } });
          map.addLayer({ id: "rivers", type: "line", source: "rivers", paint: { "line-color": "#4aa8d8", "line-width": 2 } });
          map.addLayer({ id: "cov", type: "fill", source: "coverage", paint: { "fill-color": "#2fa8a8", "fill-opacity": ["case", ["get", "optimized"], 0.22, 0.12] } });
          map.addLayer({ id: "cov-line", type: "line", source: "coverage", paint: { "line-color": "#2fa8a8", "line-width": 1 } });
          map.addLayer({ id: "nodes", type: "circle", source: "nodes", paint: { "circle-radius": ["match", ["get", "kind"], "candidate", 6, "relay", 5, 4.5], "circle-color": ["match", ["get", "kind"], "candidate", "#7fe0cf", "relay", "#e2e8f0", "#2fa8a8"], "circle-stroke-color": "#0b1220", "circle-stroke-width": 1.5 } });
        });
        return map;
      };
      const a = build(leftRef.current, false);
      const b = build(rightRef.current, true);
      let syncing = false;
      const sync = (from: MapLibreMap, to: MapLibreMap) => () => { if (syncing) return; syncing = true; to.jumpTo({ center: from.getCenter(), zoom: from.getZoom() }); syncing = false; };
      a.on("move", sync(a, b)); b.on("move", sync(b, a));
      maps.current = [a, b];
    });
    return () => { disposed = true; maps.current.forEach((map) => map.remove()); maps.current = []; };
  }, [basin.id, nodes, optimizedIds, theme]);

  return <div className="compare-maps">
    <figure><div ref={leftRef} className="compare-canvas"/><figcaption>Current network</figcaption></figure>
    <figure><div ref={rightRef} className="compare-canvas"/><figcaption>{optimizedIds.length ? "Optimized network" : "Optimized network · run optimization"}</figcaption></figure>
  </div>;
}
