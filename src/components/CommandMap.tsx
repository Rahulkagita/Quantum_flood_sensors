import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyles, buildStyle, BasemapId } from "../lib/map-config";
import { basinsGeoJSON, riversGeoJSON, riskGeoJSON, circlePolygon, LngLat } from "../lib/geo-data";
import { Eye, EyeOff, Layers } from "lucide-react";

export interface CommandMapProps {
  basinId: "krishna" | "godavari";
  selectedSensors?: string[];
  selectedRelays?: string[];
  viewMode?: "CANDIDATE" | "OPTIMIZED";
  candidateLocations?: {
    id: string;
    latitude: number;
    longitude: number;
    risk_score: number;
    priority: string;
  }[];
  commNodes?: { id: string; latitude: number; longitude: number; name?: string }[];
  onSelectNode?: (id: string, type: "sensor" | "relay" | "demand") => void;
  height?: string;
  showRiskZones?: boolean;
}

export const CommandMap: React.FC<CommandMapProps> = ({
  basinId,
  selectedSensors = ["C-KR-001", "C-KR-002", "C-KR-003"],
  selectedRelays = ["RL-KR-P1", "RL-KR-P2"],
  viewMode = "OPTIMIZED",
  candidateLocations = [],
  commNodes = [],
  onSelectNode,
  height = "calc(100vh - 7rem)",
  showRiskZones = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("light");

  // PRAVAAH Layer Visibility Controls
  const [layers, setLayers] = useState({
    risk: true,
    floodZones: true,
    rivers: true,
    demand: true,
    candidates: true,
    activeSensors: true,
    relays: true,
    links: true,
    coverage: true,
  });

  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const center: LngLat = basinId === "krishna" ? [80.75, 16.35] : [81.85, 16.85];

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Basemaps: Light, Streets, Satellite, Terrain
    const fallbackStyle = mapStyles[0]!;
    const currentStyleObj = mapStyles.find((s) => s.id === activeBasemap) || fallbackStyle;
    const style = buildStyle(currentStyleObj);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: style as unknown as maplibregl.StyleSpecification,
      center,
      zoom: 8.6,
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // 1. Basin Boundaries
      map.addSource("basins", {
        type: "geojson",
        data: basinsGeoJSON as unknown as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: "basins-line",
        type: "line",
        source: "basins",
        paint: {
          "line-color": "#168A5B",
          "line-width": 2,
          "line-dasharray": [4, 2],
        },
      });

      // 2. River Reach Network
      map.addSource("rivers", {
        type: "geojson",
        data: riversGeoJSON as unknown as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: "rivers-line",
        type: "line",
        source: "rivers",
        paint: {
          "line-color": "#3E8ED0",
          "line-width": ["case", ["get", "main"], 3.5, 1.8],
          "line-opacity": 0.85,
        },
        layout: {
          visibility: layers.rivers ? "visible" : "none",
        },
      });

      // 3. Flood Risk & Flood Zones Polygons
      map.addSource("risk-zones", {
        type: "geojson",
        data: riskGeoJSON as unknown as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: "risk-zones-fill",
        type: "fill",
        source: "risk-zones",
        filter: ["==", ["get", "basin"], basinId],
        paint: {
          "fill-color": [
            "match",
            ["get", "risk"],
            "critical",
            "#E85D5A",
            "high",
            "#F28C45",
            "medium",
            "#F2C14E",
            "low",
            "#55B878",
            "#3E8ED0",
          ],
          "fill-opacity": 0.35,
        },
        layout: {
          visibility: layers.risk && showRiskZones ? "visible" : "none",
        },
      });

      // 4. Response Demand Hotspots
      const demandPoints = (
        basinId === "krishna"
          ? [
              {
                id: "DEM-KR-01",
                name: "Vijayawada Urban Delta",
                coords: [80.648, 16.506],
                score: 94.5,
                exp: "180k residents",
              },
              {
                id: "DEM-KR-02",
                name: "Kolluru Lowland Reach",
                coords: [80.82, 16.22],
                score: 88.0,
                exp: "150k residents",
              },
              {
                id: "DEM-KR-03",
                name: "Avanigadda Estuary",
                coords: [80.85, 16.78],
                score: 82.5,
                exp: "120k residents",
              },
            ]
          : [
              {
                id: "DEM-GD-01",
                name: "Rajahmundry Urban Reach",
                coords: [81.78, 16.98],
                score: 96.0,
                exp: "220k residents",
              },
              {
                id: "DEM-GD-02",
                name: "Kakinada Canal Junction",
                coords: [81.86, 16.82],
                score: 89.5,
                exp: "160k residents",
              },
            ]
      ).map((d) => ({
        type: "Feature" as const,
        properties: {
          id: d.id,
          name: d.name,
          demand_score: d.score,
          population_exposure: d.exp,
        },
        geometry: {
          type: "Point" as const,
          coordinates: d.coords as LngLat,
        },
      }));

      map.addSource("demand-hotspots", {
        type: "geojson",
        data: { type: "FeatureCollection", features: demandPoints } as unknown as GeoJSON.GeoJSON,
      });

      map.addLayer({
        id: "demand-circles",
        type: "circle",
        source: "demand-hotspots",
        paint: {
          "circle-radius": 13,
          "circle-color": "#E85D5A",
          "circle-opacity": 0.22,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#E85D5A",
        },
        layout: {
          visibility: layers.demand ? "visible" : "none",
        },
      });

      // 5. Candidate Sensors & Active Selected Sensors (Pravaah Green #168A5B)
      const rawCandidates =
        candidateLocations.length > 0
          ? candidateLocations
          : basinId === "krishna"
            ? [
                {
                  id: "C-KR-001",
                  latitude: 16.506,
                  longitude: 80.648,
                  risk_score: 92,
                  priority: "CRITICAL",
                },
                {
                  id: "C-KR-002",
                  latitude: 16.22,
                  longitude: 80.82,
                  risk_score: 87,
                  priority: "CRITICAL",
                },
                {
                  id: "C-KR-003",
                  latitude: 16.78,
                  longitude: 80.85,
                  risk_score: 82,
                  priority: "HIGH",
                },
                {
                  id: "C-KR-004",
                  latitude: 16.45,
                  longitude: 80.55,
                  risk_score: 74,
                  priority: "HIGH",
                },
                {
                  id: "C-KR-005",
                  latitude: 16.12,
                  longitude: 81.05,
                  risk_score: 65,
                  priority: "MODERATE",
                },
              ]
            : [
                {
                  id: "C-GD-001",
                  latitude: 16.98,
                  longitude: 81.78,
                  risk_score: 95,
                  priority: "CRITICAL",
                },
                {
                  id: "C-GD-002",
                  latitude: 16.82,
                  longitude: 81.86,
                  risk_score: 88,
                  priority: "CRITICAL",
                },
                {
                  id: "C-GD-003",
                  latitude: 16.65,
                  longitude: 82.02,
                  risk_score: 81,
                  priority: "HIGH",
                },
                {
                  id: "C-GD-004",
                  latitude: 17.15,
                  longitude: 81.65,
                  risk_score: 72,
                  priority: "MODERATE",
                },
                {
                  id: "C-GD-005",
                  latitude: 16.5,
                  longitude: 82.15,
                  risk_score: 63,
                  priority: "LOW",
                },
              ];

      const candidateFeatures = rawCandidates.map((c) => {
        const isSelected = selectedSensors.includes(c.id);
        return {
          type: "Feature" as const,
          properties: {
            id: c.id,
            risk_score: c.risk_score,
            priority: c.priority,
            isSelected: isSelected && viewMode === "OPTIMIZED",
            range_km: 10.0,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [c.longitude, c.latitude] as LngLat,
          },
        };
      });

      map.addSource("candidates", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: candidateFeatures,
        } as unknown as GeoJSON.GeoJSON,
      });

      map.addLayer({
        id: "candidates-circle",
        type: "circle",
        source: "candidates",
        paint: {
          "circle-radius": ["case", ["get", "isSelected"], 8, 5.5],
          "circle-color": ["case", ["get", "isSelected"], "#168A5B", "#94A69B"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
        layout: {
          visibility: layers.candidates ? "visible" : "none",
        },
      });

      // 6. Communication Relays (Violet #7657B8)
      const rawRelays =
        commNodes.length > 0
          ? commNodes
          : basinId === "krishna"
            ? [
                {
                  id: "RL-KR-P1",
                  name: "Prakasam Barrage Tower",
                  latitude: 16.512,
                  longitude: 80.615,
                },
                {
                  id: "RL-KR-P2",
                  name: "Avanigadda Delta Relay",
                  latitude: 16.425,
                  longitude: 80.915,
                },
                {
                  id: "RL-KR-P3",
                  name: "Kolluru High Mast",
                  latitude: 16.295,
                  longitude: 80.755,
                },
              ]
            : [
                {
                  id: "RL-GD-P1",
                  name: "Dowleswaram Barrage Tower",
                  latitude: 16.945,
                  longitude: 81.775,
                },
                {
                  id: "RL-GD-P2",
                  name: "Kakinada Coastal Relay",
                  latitude: 16.895,
                  longitude: 81.985,
                },
                {
                  id: "RL-GD-P3",
                  name: "Yanam Reach Relay",
                  latitude: 16.735,
                  longitude: 82.125,
                },
              ];

      const relayFeatures = rawRelays.map((r) => {
        const isSelected = selectedRelays.includes(r.id);
        return {
          type: "Feature" as const,
          properties: {
            id: r.id,
            name: "name" in r && r.name ? r.name : r.id,
            isSelected: isSelected && viewMode === "OPTIMIZED",
            range_km: 15.0,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [r.longitude, r.latitude] as LngLat,
          },
        };
      });

      map.addSource("relays", {
        type: "geojson",
        data: { type: "FeatureCollection", features: relayFeatures } as unknown as GeoJSON.GeoJSON,
      });

      map.addLayer({
        id: "relays-circle",
        type: "circle",
        source: "relays",
        paint: {
          "circle-radius": ["case", ["get", "isSelected"], 8.5, 5],
          "circle-color": ["case", ["get", "isSelected"], "#7657B8", "#7A8C84"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
        layout: {
          visibility: layers.relays ? "visible" : "none",
        },
      });

      // 7. Sensor-Relay Communication Links
      if (viewMode === "OPTIMIZED") {
        const activeSensorsList = rawCandidates.filter((c) => selectedSensors.includes(c.id));
        const activeRelaysList = rawRelays.filter((r) => selectedRelays.includes(r.id));

        const linkLines = activeSensorsList
          .map((s) => {
            const firstR = activeRelaysList[0];
            if (!firstR) return null;
            let closestR = firstR;
            let minDist = Infinity;
            activeRelaysList.forEach((r) => {
              const d = Math.hypot(s.longitude - r.longitude, s.latitude - r.latitude);
              if (d < minDist) {
                minDist = d;
                closestR = r;
              }
            });
            return {
              type: "Feature" as const,
              properties: { sensor: s.id, relay: closestR.id },
              geometry: {
                type: "LineString" as const,
                coordinates: [
                  [s.longitude, s.latitude],
                  [closestR.longitude, closestR.latitude],
                ],
              },
            };
          })
          .filter((l): l is NonNullable<typeof l> => l !== null);

        map.addSource("sensor-links", {
          type: "geojson",
          data: { type: "FeatureCollection", features: linkLines } as unknown as GeoJSON.GeoJSON,
        });

        map.addLayer({
          id: "sensor-links-line",
          type: "line",
          source: "sensor-links",
          paint: {
            "line-color": "#168A5B",
            "line-width": 2,
            "line-dasharray": [3, 2],
          },
          layout: {
            visibility: layers.links ? "visible" : "none",
          },
        });
      }

      // 8. Coverage Circles
      if (viewMode === "OPTIMIZED") {
        const activeSensorsList = rawCandidates.filter((c) => selectedSensors.includes(c.id));
        const activeRelaysList = rawRelays.filter((r) => selectedRelays.includes(r.id));

        const sensorPolygons = activeSensorsList.map((s) =>
          circlePolygon([s.longitude, s.latitude], 10.0),
        );
        const relayPolygons = activeRelaysList.map((r) =>
          circlePolygon([r.longitude, r.latitude], 15.0),
        );

        const coverageCircles = [...sensorPolygons, ...relayPolygons];

        map.addSource("coverage-polygons", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: coverageCircles,
          } as unknown as GeoJSON.GeoJSON,
        });

        map.addLayer({
          id: "coverage-polygons-fill",
          type: "fill",
          source: "coverage-polygons",
          paint: {
            "fill-color": "#168A5B",
            "fill-opacity": 0.08,
          },
          layout: {
            visibility: layers.coverage ? "visible" : "none",
          },
        });

        map.addLayer({
          id: "coverage-polygons-line",
          type: "line",
          source: "coverage-polygons",
          paint: {
            "line-color": "#168A5B",
            "line-width": 1.2,
            "line-opacity": 0.5,
          },
          layout: {
            visibility: layers.coverage ? "visible" : "none",
          },
        });
      }

      // Popups
      map.on("click", "candidates-circle", (e) => {
        if (!e.features || !e.features[0]) return;
        const feat = e.features[0];
        const props = (feat.properties || {}) as unknown as {
          id: string;
          risk_score?: number;
          priority?: string;
          isSelected?: boolean;
        };
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(
            `<div style="color:#1A2421; background:#FFFFFF; padding:10px; border:1px solid #DFE5DF; border-radius:6px; font-size:12px; font-family:sans-serif;">
              <div style="color:#126B48; font-weight:700; font-size:13px;">Sensor: ${props.id}</div>
              <div style="margin-top:4px;">Status: <b style="color:${props.isSelected ? "#168A5B" : "#5C6E66"}">${props.isSelected ? "Selected (Active)" : "Candidate"}</b></div>
              <div>Local Risk: <b>${props.risk_score}/100</b></div>
              <div>Priority: <b>${props.priority}</b></div>
              <div>Coverage Radius: <b>10.0 km</b></div>
            </div>`,
          )
          .addTo(map);

        if (onSelectNode) onSelectNode(String(props.id), "sensor");
      });

      map.on("click", "relays-circle", (e) => {
        if (!e.features || !e.features[0]) return;
        const feat = e.features[0];
        const props = (feat.properties || {}) as unknown as {
          id: string;
          name?: string;
          isSelected?: boolean;
        };
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(
            `<div style="color:#1A2421; background:#FFFFFF; padding:10px; border:1px solid #DFE5DF; border-radius:6px; font-size:12px; font-family:sans-serif;">
              <div style="color:#7657B8; font-weight:700; font-size:13px;">Relay Mast: ${props.id}</div>
              <div style="margin-top:4px;">Node: <b>${props.name || "Relay Tower"}</b></div>
              <div>Status: <b style="color:${props.isSelected ? "#7657B8" : "#5C6E66"}">${props.isSelected ? "Selected (Active)" : "Candidate"}</b></div>
              <div>Comm Range: <b>15.0 km</b></div>
            </div>`,
          )
          .addTo(map);

        if (onSelectNode) onSelectNode(String(props.id), "relay");
      });

      map.on("click", "demand-circles", (e) => {
        if (!e.features || !e.features[0]) return;
        const feat = e.features[0];
        const props = (feat.properties || {}) as unknown as {
          id: string;
          name?: string;
          demand_score?: number;
          population_exposure?: string | number;
        };
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(
            `<div style="color:#1A2421; background:#FFFFFF; padding:10px; border:1px solid #DFE5DF; border-radius:6px; font-size:12px; font-family:sans-serif;">
              <div style="color:#E85D5A; font-weight:700; font-size:13px;">Demand Hotspot: ${props.id}</div>
              <div style="margin-top:4px;">Zone: <b>${props.name}</b></div>
              <div>Demand Score: <b style="color:#E85D5A;">${props.demand_score}/100</b></div>
              <div>Exposed Population: <b>${props.population_exposure}</b></div>
            </div>`,
          )
          .addTo(map);

        if (onSelectNode) onSelectNode(String(props.id), "demand");
      });

      map.on("mouseenter", "candidates-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "candidates-circle", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "relays-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "relays-circle", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [
    basinId,
    activeBasemap,
    candidateLocations,
    commNodes,
    onSelectNode,
    selectedRelays,
    selectedSensors,
    viewMode,
    layers,
    showRiskZones,
  ]);

  // Smooth flyTo on basin switch
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center, zoom: 8.6, duration: 1200 });
    }
  }, [basinId, center]);

  const basemapOptions: { id: BasemapId; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "streets", label: "Streets" },
    { id: "satellite", label: "Satellite" },
    { id: "terrain", label: "Terrain" },
  ];

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-[#EBF0EB]" />

      {/* Floating Basemap & Layer Control Widget */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 border border-[#DFE5DF] backdrop-blur-md rounded-lg p-1.5 flex items-center gap-1 shadow-sm">
          {basemapOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveBasemap(s.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                activeBasemap === s.id
                  ? "bg-[#EEF7F1] text-[#126B48] border border-[#C4E2D3] font-semibold"
                  : "text-[#5C6E66] hover:text-[#1A2421]"
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="h-4 w-px bg-[#DFE5DF] mx-1" />
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 border transition-colors ${
              showLayerMenu
                ? "bg-[#168A5B] border-[#168A5B] text-white font-medium"
                : "bg-white border-[#DFE5DF] text-[#1A2421] hover:bg-[#F7F8F3]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Layers
          </button>
        </div>

        {/* Clean Layer Visibility Menu */}
        {showLayerMenu && (
          <div className="bg-white/95 border border-[#DFE5DF] backdrop-blur-md rounded-lg p-3 text-xs space-y-2 w-56 shadow-lg">
            <div className="text-[11px] text-[#5C6E66] font-semibold uppercase tracking-wider border-b border-[#DFE5DF] pb-1.5">
              GIS Layer Controls
            </div>
            <div className="space-y-1.5 pt-1">
              {(
                [
                  { key: "risk", label: "Risk Zones" },
                  { key: "rivers", label: "River Reach Network" },
                  { key: "demand", label: "Response Demand" },
                  { key: "candidates", label: "Candidate Sensors" },
                  { key: "relays", label: "Relay Nodes" },
                  { key: "links", label: "Communication Links" },
                  { key: "coverage", label: "Network Coverage" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-[#EEF7F1] transition-colors"
                >
                  <span className={layers[key] ? "text-[#1A2421] font-medium" : "text-[#8FA69B]"}>
                    {label}
                  </span>
                  {layers[key] ? (
                    <Eye className="w-3.5 h-3.5 text-[#168A5B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-[#B3C0B8]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
