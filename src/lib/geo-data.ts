import type { Basin, RiskLevel } from "@/lib/flood-intelligence";

/**
 * Mock geospatial layers in real WGS84 coordinates [lng, lat].
 * Shaped as GeoJSON so future GET /api/risk, /api/sensors and /api/network responses can replace them.
 */
export type LngLat = [number, number];

export const basinView: Record<Basin["id"], { center: LngLat; zoom: number }> = {
  krishna: { center: [80.82, 16.22], zoom: 8.6 },
  godavari: { center: [81.86, 16.82], zoom: 8.8 },
};

export const nodeCoordinates: Record<string, LngLat> = {
  "KR-PK-018": [80.605, 16.507], "KR-AV-011": [80.918, 16.021], "KR-IB-006": [80.52, 16.595], "KR-HA-022": [80.99, 15.8],
  "KR-KL-015": [80.795, 16.185], "RL-VJ-02": [80.648, 16.52], "C-31": [80.7, 16.4], "C-35": [80.8, 15.86], "C-39": [80.86, 16.1],
  "GD-DW-042": [81.784, 16.945], "GD-KM-014": [81.895, 16.72], "GD-AM-009": [82.006, 16.578], "RL-RJ-03": [81.8, 17.0],
  "C-17": [82.05, 16.82], "C-24": [82.1, 16.52], "C-08": [81.72, 16.5],
  "C-32": [80.63, 16.46], "C-33": [80.74, 16.3], "C-34": [80.9, 15.95], "C-36": [80.56, 16.55], "C-37": [80.83, 16.16], "C-38": [80.95, 15.84], "C-40": [80.68, 16.35],
  "C-09": [81.76, 16.62], "C-11": [81.95, 16.7], "C-12": [82.2, 16.72], "C-14": [81.86, 16.88], "C-19": [82.25, 16.62], "C-21": [81.7, 16.4], "C-26": [82.0, 16.95],
  "RL-KR-P1": [80.85, 16.14], "RL-KR-P2": [80.94, 15.9], "RL-KR-P3": [80.74, 16.34],
  "RL-GD-P1": [82.0, 16.68], "RL-GD-P2": [81.73, 16.52], "RL-GD-P3": [82.18, 16.66],
};

export const zoneCoordinates: Record<string, LngLat> = {
  "SC-KR-07": [80.68, 16.5], "SC-KR-11": [80.93, 16.04], "SC-KR-14": [80.98, 15.82],
};

const krishnaRiver: LngLat[] = [[78.87, 16.08], [79.12, 16.4], [79.31, 16.57], [79.7, 16.7], [80.06, 16.76], [80.3, 16.66], [80.36, 16.57], [80.52, 16.58], [80.605, 16.507], [80.7, 16.42], [80.79, 16.2], [80.86, 16.1], [80.92, 16.02], [80.95, 15.9], [80.99, 15.75]];
const krishnaBranch: LngLat[] = [[80.86, 16.1], [80.81, 15.97], [80.78, 15.8]];
const godavariRiver: LngLat[] = [[80.0, 18.6], [80.4, 18.1], [80.89, 17.67], [81.2, 17.5], [81.64, 17.25], [81.78, 17.0], [81.784, 16.945]];
const gautami: LngLat[] = [[81.784, 16.945], [81.9, 16.82], [82.05, 16.78], [82.21, 16.73], [82.3, 16.62]];
const vasishta: LngLat[] = [[81.784, 16.945], [81.76, 16.8], [81.73, 16.62], [81.7, 16.43], [81.72, 16.31]];

const line = (name: string, basin: string, coordinates: LngLat[], main = true) => ({ type: "Feature" as const, properties: { name, basin, main }, geometry: { type: "LineString" as const, coordinates } });
export const riversGeoJSON = { type: "FeatureCollection" as const, features: [line("Krishna River", "krishna", krishnaRiver), line("Krishna delta branch", "krishna", krishnaBranch, false), line("Godavari River", "godavari", godavariRiver), line("Gautami Godavari", "godavari", gautami, false), line("Vasishta Godavari", "godavari", vasishta, false)] };

const poly = (props: Record<string, unknown>, ring: LngLat[]) => ({ type: "Feature" as const, properties: props, geometry: { type: "Polygon" as const, coordinates: [[...ring, ring[0] as LngLat]] } });

export const basinsGeoJSON = { type: "FeatureCollection" as const, features: [
  poly({ name: "Lower Krishna Basin", basin: "krishna" }, [[79.9, 17.0], [80.5, 17.1], [81.0, 16.75], [81.35, 16.1], [81.3, 15.7], [80.7, 15.75], [80.1, 16.1], [79.7, 16.5]]),
  poly({ name: "Lower Godavari Basin", basin: "godavari" }, [[80.8, 17.9], [81.5, 17.75], [82.2, 17.3], [82.45, 16.7], [82.2, 16.3], [81.6, 16.2], [81.25, 16.6], [80.9, 17.2]]),
] };

const riskZone = (name: string, risk: RiskLevel, basin: string, ring: LngLat[]) => poly({ name, risk, basin }, ring);
export const riskGeoJSON = { type: "FeatureCollection" as const, features: [
  riskZone("Krishna upper reach", "medium", "krishna", [[80.2, 16.8], [80.5, 16.72], [80.55, 16.6], [80.35, 16.52], [80.15, 16.62]]),
  riskZone("Vijayawada urban reach", "critical", "krishna", [[80.53, 16.6], [80.7, 16.6], [80.76, 16.46], [80.62, 16.42], [80.52, 16.5]]),
  riskZone("Kolluru–Repalle floodplain", "high", "krishna", [[80.66, 16.42], [80.85, 16.36], [80.9, 16.12], [80.76, 16.08], [80.68, 16.25]]),
  riskZone("Avanigadda delta", "critical", "krishna", [[80.84, 16.12], [81.02, 16.1], [81.08, 15.96], [80.94, 15.92], [80.84, 16.0]]),
  riskZone("Hamsaladeevi coast", "high", "krishna", [[80.88, 15.92], [81.05, 15.9], [81.06, 15.72], [80.9, 15.72]]),
  riskZone("Machilipatnam fringe", "low", "krishna", [[81.05, 16.25], [81.2, 16.24], [81.2, 16.1], [81.06, 16.1]]),
  riskZone("Polavaram reach", "medium", "godavari", [[81.5, 17.35], [81.75, 17.3], [81.82, 17.1], [81.6, 17.12]]),
  riskZone("Rajamahendravaram", "high", "godavari", [[81.7, 17.08], [81.86, 17.06], [81.86, 16.92], [81.72, 16.9]]),
  riskZone("Konaseema delta", "critical", "godavari", [[81.8, 16.9], [82.1, 16.84], [82.15, 16.6], [81.9, 16.55], [81.78, 16.7]]),
  riskZone("Amalapuram coast", "high", "godavari", [[81.92, 16.6], [82.2, 16.62], [82.25, 16.45], [81.98, 16.42]]),
  riskZone("Narsapur fringe", "medium", "godavari", [[81.6, 16.6], [81.76, 16.6], [81.78, 16.4], [81.62, 16.38]]),
] };

export const historicalExtentGeoJSON = { type: "FeatureCollection" as const, features: [
  poly({ name: "2009 Krishna flood extent" }, [[80.5, 16.62], [80.78, 16.55], [80.95, 16.2], [81.15, 16.0], [81.2, 15.8], [80.95, 15.85], [80.75, 16.1], [80.58, 16.4]]),
  poly({ name: "2022 Godavari flood extent" }, [[81.68, 17.12], [81.9, 17.05], [82.2, 16.8], [82.28, 16.5], [81.95, 16.4], [81.7, 16.45], [81.72, 16.85]]),
] };

export const rainfallGeoJSON = { type: "FeatureCollection" as const, features: [
  { center: [80.5, 16.7] as LngLat, km: 28, mm: 96 }, { center: [80.95, 16.15] as LngLat, km: 22, mm: 132 }, { center: [81.9, 16.85] as LngLat, km: 30, mm: 118 }, { center: [81.5, 17.3] as LngLat, km: 24, mm: 84 },
].map((r) => circlePolygon(r.center, r.km, { mm: r.mm })) };

export const placesGeoJSON = { type: "FeatureCollection" as const, features: [
  ["Vijayawada", 80.648, 16.506, 1480000], ["Rajamahendravaram", 81.804, 17.0, 480000], ["Machilipatnam", 81.135, 16.187, 170000], ["Guntur", 80.436, 16.306, 740000],
  ["Amalapuram", 82.006, 16.578, 55000], ["Avanigadda", 80.918, 16.021, 40000], ["Kakinada", 82.247, 16.989, 440000], ["Eluru", 81.095, 16.711, 250000],
].map(([name, lng, lat, population]) => ({ type: "Feature" as const, properties: { name, population }, geometry: { type: "Point" as const, coordinates: [lng, lat] as LngLat } })) };

export const infrastructureGeoJSON = { type: "FeatureCollection" as const, features: [
  ["Prakasam Barrage", 80.605, 16.507], ["Dowleswaram Barrage", 81.784, 16.945], ["Vijayawada Junction", 80.62, 16.518], ["Machilipatnam Port", 81.15, 16.17], ["Polavaram Dam", 81.64, 17.25], ["Kakinada Port", 82.27, 16.95],
].map(([name, lng, lat]) => ({ type: "Feature" as const, properties: { name }, geometry: { type: "Point" as const, coordinates: [lng, lat] as LngLat } })) };

export const riverGauges = { type: "FeatureCollection" as const, features: [
  ["Prakasam Barrage · 12.1 m", 80.605, 16.507, "critical"], ["Pulichintala · 9.4 m", 80.06, 16.76, "medium"], ["Dowleswaram · 14.9 m", 81.784, 16.945, "critical"], ["Bhadrachalam · 48.2 m", 80.89, 17.67, "high"],
].map(([name, lng, lat, risk]) => ({ type: "Feature" as const, properties: { name, risk }, geometry: { type: "Point" as const, coordinates: [lng, lat] as LngLat } })) };

/** Geodesic-ish circle polygon (adequate at these latitudes). */
export function circlePolygon(center: LngLat, radiusKm: number, properties: Record<string, unknown> = {}, steps = 64) {
  const [lng, lat] = center;
  const ring: LngLat[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (radiusKm / 110.57) * Math.sin(a)]);
  }
  return { type: "Feature" as const, properties, geometry: { type: "Polygon" as const, coordinates: [ring] } };
}

/** Fallback for mock records that only carry 0–100 grid positions. */
export function gridToLngLat(basinId: Basin["id"], x: number, y: number): LngLat {
  const b = basinId === "krishna" ? { w: 80.2, e: 81.3, n: 16.8, s: 15.8 } : { w: 81.4, e: 82.4, n: 17.2, s: 16.3 };
  return [b.w + (x / 100) * (b.e - b.w), b.n - (y / 100) * (b.n - b.s)];
}
