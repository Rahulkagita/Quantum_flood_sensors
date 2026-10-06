import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap architecture.
 * A BasemapProvider describes where tiles come from; a MapStyle turns one provider into a
 * MapLibre style. Production providers (MapTiler, Mapbox, self-hosted PMTiles…) can be added
 * here without touching the map component. Keys are read from VITE_ env vars only.
 */
export type BasemapId = "satellite" | "streets" | "terrain" | "dark" | "light" | "topographic";

export interface BasemapProvider {
  id: string;
  kind: "raster";
  tiles: string[];
  tileSize: 256 | 512;
  maxzoom: number;
  attribution: string;
}

export interface MapStyle {
  id: BasemapId;
  label: string;
  /** Overlay tone: light basemaps need darker overlay strokes. */
  tone: "dark" | "light";
  providers: BasemapProvider[];
  thumbnail: string;
}

/** Optional production key — never hardcoded. When present, MapTiler styles can be swapped in. */
export const MAP_PROVIDER_KEY = import.meta.env['VITE_MAP_PROVIDER_KEY'] as string | undefined;

const esri = (service: string, maxzoom = 18): BasemapProvider => ({
  id: `esri-${service}`,
  kind: "raster",
  tiles: [`https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`],
  tileSize: 256,
  maxzoom,
  attribution: "Tiles © Esri and contributors",
});

// Development-grade public basemaps. Replace with a production provider before launch.
export const mapStyles: MapStyle[] = [
  { id: "satellite", label: "Satellite", tone: "dark", providers: [esri("World_Imagery"), esri("Reference/World_Boundaries_and_Places")], thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/7/58/92" },
  { id: "streets", label: "Streets", tone: "light", providers: [{ id: "osm", kind: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: "© OpenStreetMap contributors" }], thumbnail: "https://tile.openstreetmap.org/7/92/58.png" },
  { id: "terrain", label: "Terrain", tone: "light", providers: [esri("World_Terrain_Base", 13), esri("Reference/World_Reference_Overlay", 13)], thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/7/58/92" },
  { id: "dark", label: "Dark", tone: "dark", providers: [esri("Canvas/World_Dark_Gray_Base", 16), esri("Canvas/World_Dark_Gray_Reference", 16)], thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/7/58/92" },
  { id: "light", label: "Light", tone: "light", providers: [esri("Canvas/World_Light_Gray_Base", 16), esri("Canvas/World_Light_Gray_Reference", 16)], thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/7/58/92" },
  { id: "topographic", label: "Topographic", tone: "light", providers: [{ id: "opentopomap", kind: "raster", tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png", "https://b.tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 17, attribution: "© OpenTopoMap (CC-BY-SA) © OpenStreetMap contributors" }], thumbnail: "https://a.tile.opentopomap.org/7/92/58.png" },
];

export const mapStyleById = Object.fromEntries(mapStyles.map((s) => [s.id, s])) as Record<BasemapId, MapStyle>;

export function buildStyle(style: MapStyle): StyleSpecification {
  const sources: StyleSpecification["sources"] = {};
  const layers: StyleSpecification["layers"] = [];
  style.providers.forEach((provider) => {
    sources[provider.id] = { type: "raster", tiles: provider.tiles, tileSize: provider.tileSize, maxzoom: provider.maxzoom, attribution: provider.attribution };
    layers.push({ id: `base-${provider.id}`, type: "raster", source: provider.id });
  });
  return { version: 8, sources, layers };
}

/** Analytical hillshade used by the "Elevation" analytical layer. */
export const hillshadeProvider = esri("Elevation/World_Hillshade", 16);
