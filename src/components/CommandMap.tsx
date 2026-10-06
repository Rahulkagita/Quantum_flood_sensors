import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyles, buildStyle, BasemapId } from "../lib/map-config";
import {
  basinsGeoJSON,
  riversGeoJSON,
  riskGeoJSON,
  circlePolygon,
  nodeCoordinates,
  LngLat
} from "../lib/geo-data";

interface CommandMapProps {
  basinId: "krishna" | "godavari";
  selectedSensors?: string[];
  selectedRelays?: string[];
  candidateLocations?: { id: string; latitude: number; longitude: number; risk_score: number; priority: string }[];
  commNodes?: { id: string; latitude: number; longitude: number }[];
  showRiskZones?: boolean;
  showCoverage?: boolean;
  showConnectivity?: boolean;
  onSelectNode?: (id: string, type: "sensor" | "relay") => void;
  height?: string;
}

export const CommandMap: React.FC<CommandMapProps> = ({
  basinId,
  selectedSensors = ["C-KR-001", "C-KR-002", "C-KR-003"],
  selectedRelays = ["RL-KR-P1", "RL-KR-P2"],
  candidateLocations = [],
  commNodes = [],
  showRiskZones = true,
  showCoverage = true,
  showConnectivity = true,
  onSelectNode,
  height = "calc(100vh - 3.5rem)"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("dark");

  const center: LngLat = basinId === "krishna" ? [80.75, 16.35] : [81.85, 16.85];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const style = buildStyle(mapStyles.find((s) => s.id === activeBasemap) || mapStyles[3]);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: style as any,
      center,
      zoom: 8.6,
      cooperativeGestures: true
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // 1. Basin Boundaries
      map.addSource("basins", { type: "geojson", data: basinsGeoJSON as any });
      map.addLayer({
        id: "basins-line",
        type: "line",
        source: "basins",
        paint: {
          "line-color": "#06B6D4",
          "line-width": 2,
          "line-dasharray": [3, 2]
        }
      });

      // 2. River Network
      map.addSource("rivers", { type: "geojson", data: riversGeoJSON as any });
      map.addLayer({
        id: "rivers-line",
        type: "line",
        source: "rivers",
        paint: {
          "line-color": "#38BDF8",
          "line-width": ["case", ["get", "main"], 3, 1.5],
          "line-opacity": 0.85
        }
      });

      // 3. Flood Risk Zones
      map.addSource("risk-zones", { type: "geojson", data: riskGeoJSON as any });
      map.addLayer({
        id: "risk-zones-fill",
        type: "fill",
        source: "risk-zones",
        filter: ["==", ["get", "basin"], basinId],
        paint: {
          "fill-color": [
            "match",
            ["get", "risk"],
            "critical", "#EF4444",
            "high", "#F97316",
            "medium", "#F59E0B",
            "low", "#38BDF8",
            "#0284C7"
          ],
          "fill-opacity": 0.35
        },
        layout: {
          visibility: showRiskZones ? "visible" : "none"
        }
      });

      // 4. Candidate Locations & Sensors
      const candFeatures = (candidateLocations.length > 0
        ? candidateLocations
        : [
            { id: "C-KR-001", latitude: 16.506, longitude: 80.648, risk_score: 92, priority: "CRITICAL" },
            { id: "C-KR-002", latitude: 16.220, longitude: 80.820, risk_score: 87, priority: "CRITICAL" },
            { id: "C-KR-003", latitude: 16.780, longitude: 80.850, risk_score: 82, priority: "HIGH" },
            { id: "C-KR-004", latitude: 16.450, longitude: 80.320, risk_score: 75, priority: "HIGH" },
            { id: "C-KR-005", latitude: 16.150, longitude: 80.450, risk_score: 68, priority: "MODERATE" },
            { id: "C-GD-001", latitude: 16.980, longitude: 81.780, risk_score: 95, priority: "CRITICAL" },
            { id: "C-GD-002", latitude: 16.820, longitude: 81.860, risk_score: 89, priority: "CRITICAL" },
            { id: "C-GD-003", latitude: 16.550, longitude: 81.950, risk_score: 81, priority: "HIGH" }
          ]
      ).map((c) => ({
        type: "Feature" as const,
        properties: {
          id: c.id,
          risk_score: c.risk_score,
          priority: c.priority,
          isSelected: selectedSensors.includes(c.id)
        },
        geometry: {
          type: "Point" as const,
          coordinates: [c.longitude, c.latitude] as LngLat
        }
      }));

      map.addSource("candidates", {
        type: "geojson",
        data: { type: "FeatureCollection", features: candFeatures as any }
      });

      map.addLayer({
        id: "candidates-circle",
        type: "circle",
        source: "candidates",
        paint: {
          "circle-radius": ["case", ["get", "isSelected"], 10, 6],
          "circle-color": ["case", ["get", "isSelected"], "#06B6D4", "#64748B"],
          "circle-stroke-width": ["case", ["get", "isSelected"], 3, 1.5],
          "circle-stroke-color": ["case", ["get", "isSelected"], "#F8FAFC", "#1E2B4D"]
        }
      });

      // 5. Relays Source
      const relayFeatures = (commNodes.length > 0
        ? commNodes
        : [
            { id: "RL-KR-P1", latitude: 16.14, longitude: 80.85 },
            { id: "RL-KR-P2", latitude: 15.90, longitude: 80.94 },
            { id: "RL-KR-P3", latitude: 16.34, longitude: 80.74 },
            { id: "RL-GD-P1", latitude: 16.68, longitude: 82.00 },
            { id: "RL-GD-P2", latitude: 16.52, longitude: 81.73 }
          ]
      ).map((r) => ({
        type: "Feature" as const,
        properties: {
          id: r.id,
          isSelected: selectedRelays.includes(r.id)
        },
        geometry: {
          type: "Point" as const,
          coordinates: [r.longitude, r.latitude] as LngLat
        }
      }));

      map.addSource("relays", {
        type: "geojson",
        data: { type: "FeatureCollection", features: relayFeatures as any }
      });

      map.addLayer({
        id: "relays-circle",
        type: "circle",
        source: "relays",
        paint: {
          "circle-radius": ["case", ["get", "isSelected"], 9, 5],
          "circle-color": ["case", ["get", "isSelected"], "#8B5CF6", "#475569"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F8FAFC"
        }
      });

      // Click Tooltips
      map.on("click", "candidates-circle", (e) => {
        if (!e.features || !e.features[0]) return;
        const feat = e.features[0];
        const props = feat.properties as any;
        const coords = (feat.geometry as any).coordinates.slice();

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <div style="color:#050B14; font-family:sans-serif; padding:4px;">
              <strong style="color:#0284C7;">SENSOR: ${props.id}</strong><br/>
              <span style="font-size:12px;">Risk Score: <b>${props.risk_score}/100</b></span><br/>
              <span style="font-size:12px;">Priority: <b>${props.priority}</b></span>
            </div>
          `)
          .addTo(map);

        if (onSelectNode) onSelectNode(props.id, "sensor");
      });

      map.on("mouseenter", "candidates-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "candidates-circle", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [basinId, activeBasemap]);

  // Update center when basin changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center, zoom: 8.6, duration: 1200 });
    }
  }, [basinId]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-slate-950" />

      {/* Basemap Switcher Floating Control */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-slate-700/80 backdrop-blur rounded p-1.5 flex items-center gap-1">
        {mapStyles.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveBasemap(s.id)}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
              activeBasemap === s.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};
