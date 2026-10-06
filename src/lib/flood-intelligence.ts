export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Basin {
  id: "godavari" | "krishna";
  name: string;
  station: string;
  area: string;
  risk: RiskLevel;
  riskScore: number;
  waterLevel: number;
  warningLevel: number;
  discharge: string;
  rainfall: number;
  trend: number;
}

export interface NetworkNode {
  id: string;
  kind: "sensor" | "relay" | "candidate";
  x: number;
  y: number;
  label: string;
  status: "online" | "degraded" | "proposed";
  battery?: number;
  signal?: number;
  priority?: number;
}

/** Optimization contracts live in optimization-service.ts (OptimizationRequest / OptimizationResult). */

export interface FloodIntelligenceService {
  getBasins(): Promise<Basin[]>;
  getNetwork(basinId: Basin["id"]): Promise<NetworkNode[]>;
  getDashboard(basinId: Basin["id"]): Promise<FloodDashboardData>;
}

export interface ForecastPoint {
  hour: number;
  rainfall: number;
  riverLevel: number;
  risk: number;
}

export interface ZoneRisk {
  zone: string;
  historical: number;
  predicted: number;
}

export interface SensorDetail {
  location: string;
  riskScore: number;
  populationExposure: number;
  riverDistanceKm: number;
  coverageRadiusKm: number;
  riskCaptured: number;
  relay: string;
}

export interface FloodDashboardData {
  forecast: ForecastPoint[];
  zones: ZoneRisk[];
  highRiskArea: number;
  uncoveredHighRiskArea: number;
  historicalSimilarity: "High";
  network: { candidates: number; recommended: number; relays: number; coverage: number; connectivity: number };
  sensorDetails: Record<string, SensorDetail>;
}

export const areasByBasin: Record<Basin["id"], string[]> = {
  krishna: ["Vijayawada urban reach", "Prakasam Barrage", "Avanigadda delta"],
  godavari: ["Konaseema delta", "Dowleswaram Barrage", "Amalapuram coast"],
};

export const basins: Basin[] = [
  {
    id: "godavari",
    name: "Godavari",
    station: "Dowleswaram Barrage",
    area: "Konaseema delta",
    risk: "critical",
    riskScore: 82,
    waterLevel: 14.85,
    warningLevel: 13.75,
    discharge: "9,45,000",
    rainfall: 22,
    trend: 0.38,
  },
  {
    id: "krishna",
    name: "Krishna",
    station: "Prakasam Barrage",
    area: "Vijayawada urban reach",
    risk: "high",
    riskScore: 87,
    waterLevel: 12.1,
    warningLevel: 12.0,
    discharge: "2,10,000",
    rainfall: 31,
    trend: 0.42,
  },
];

export const basinById: Record<Basin["id"], Basin> = {
  godavari: basins.find((basin) => basin.id === "godavari") ?? {
    id: "godavari", name: "Godavari", station: "Dowleswaram Barrage", area: "Konaseema delta", risk: "critical", riskScore: 82, waterLevel: 14.85, warningLevel: 13.75, discharge: "9,45,000", rainfall: 22, trend: 0.38,
  },
  krishna: basins.find((basin) => basin.id === "krishna") ?? {
    id: "krishna", name: "Krishna", station: "Prakasam Barrage", area: "Vijayawada urban reach", risk: "high", riskScore: 87, waterLevel: 12.1, warningLevel: 12, discharge: "2,10,000", rainfall: 31, trend: 0.42,
  },
};

export const networkByBasin: Record<Basin["id"], NetworkNode[]> = {
  godavari: [
    { id: "GD-DW-042", kind: "sensor", x: 63, y: 42, label: "Dowleswaram", status: "online", battery: 92, signal: -68 },
    { id: "GD-KM-014", kind: "sensor", x: 71, y: 58, label: "Kothapeta", status: "online", battery: 76, signal: -74 },
    { id: "GD-AM-009", kind: "sensor", x: 83, y: 48, label: "Amalapuram", status: "degraded", battery: 41, signal: -91 },
    { id: "RL-RJ-03", kind: "relay", x: 56, y: 34, label: "Rajamahendravaram relay", status: "online", battery: 88, signal: -61 },
    { id: "C-17", kind: "candidate", x: 76, y: 38, label: "Candidate 17 · canal junction", status: "proposed", priority: 96 },
    { id: "C-24", kind: "candidate", x: 88, y: 65, label: "Candidate 24 · low-lying village", status: "proposed", priority: 91 },
    { id: "C-08", kind: "candidate", x: 66, y: 71, label: "Candidate 08 · embankment gap", status: "proposed", priority: 86 },
    { id: "C-09", kind: "candidate", x: 62, y: 60, label: "Candidate 09 · Vasishta bank", status: "proposed", priority: 80 },
    { id: "C-11", kind: "candidate", x: 74, y: 52, label: "Candidate 11 · Gautami bend", status: "proposed", priority: 83 },
    { id: "C-12", kind: "candidate", x: 86, y: 50, label: "Candidate 12 · Yanam approach", status: "proposed", priority: 79 },
    { id: "C-14", kind: "candidate", x: 68, y: 40, label: "Candidate 14 · Alamuru channel", status: "proposed", priority: 75 },
    { id: "C-19", kind: "candidate", x: 90, y: 60, label: "Candidate 19 · tidal creek", status: "proposed", priority: 81 },
    { id: "C-21", kind: "candidate", x: 60, y: 78, label: "Candidate 21 · Narsapur outfall", status: "proposed", priority: 71 },
    { id: "C-26", kind: "candidate", x: 78, y: 32, label: "Candidate 26 · upland drain", status: "proposed", priority: 73 },
  ],
  krishna: [
    { id: "KR-PK-018", kind: "sensor", x: 42, y: 49, label: "Prakasam Barrage", status: "degraded", battery: 45, signal: -72 },
    { id: "KR-AV-011", kind: "sensor", x: 56, y: 61, label: "Avanigadda", status: "online", battery: 83, signal: -67 },
    { id: "KR-IB-006", kind: "sensor", x: 28, y: 38, label: "Ibrahimpatnam", status: "online", battery: 91, signal: -63 },
    { id: "KR-HA-022", kind: "sensor", x: 69, y: 55, label: "Hamsaladeevi", status: "online", battery: 78, signal: -70 },
    { id: "KR-KL-015", kind: "sensor", x: 48, y: 67, label: "Kolluru", status: "online", battery: 86, signal: -66 },
    { id: "RL-VJ-02", kind: "relay", x: 35, y: 41, label: "Vijayawada relay", status: "online", battery: 90, signal: -58 },
    { id: "C-31", kind: "candidate", x: 50, y: 40, label: "Candidate 31 · river island", status: "proposed", priority: 94 },
    { id: "C-35", kind: "candidate", x: 63, y: 70, label: "Candidate 35 · coastal outlet", status: "proposed", priority: 89 },
    { id: "C-39", kind: "candidate", x: 72, y: 46, label: "Candidate 39 · delta settlement", status: "proposed", priority: 87 },
    { id: "C-32", kind: "candidate", x: 40, y: 44, label: "Candidate 32 · Kanuru bund", status: "proposed", priority: 82 },
    { id: "C-33", kind: "candidate", x: 52, y: 50, label: "Candidate 33 · Penamaluru floodplain", status: "proposed", priority: 80 },
    { id: "C-34", kind: "candidate", x: 66, y: 64, label: "Candidate 34 · Nagayalanka bank", status: "proposed", priority: 84 },
    { id: "C-36", kind: "candidate", x: 32, y: 36, label: "Candidate 36 · Gollapudi ghat", status: "proposed", priority: 72 },
    { id: "C-37", kind: "candidate", x: 58, y: 56, label: "Candidate 37 · Challapalli low ground", status: "proposed", priority: 78 },
    { id: "C-38", kind: "candidate", x: 70, y: 72, label: "Candidate 38 · Lanka outfall", status: "proposed", priority: 76 },
    { id: "C-40", kind: "candidate", x: 46, y: 47, label: "Candidate 40 · Thotlavalluru island", status: "proposed", priority: 70 },
  ],
};

/** Proposed communication-node sites. Only shown on the map once an optimization selects them. */
export const relayCandidatesByBasin: Record<Basin["id"], NetworkNode[]> = {
  krishna: [
    { id: "RL-KR-P1", kind: "relay", x: 60, y: 54, label: "Proposed relay · Challapalli mast", status: "proposed" },
    { id: "RL-KR-P2", kind: "relay", x: 68, y: 66, label: "Proposed relay · Nagayalanka mast", status: "proposed" },
    { id: "RL-KR-P3", kind: "relay", x: 50, y: 48, label: "Proposed relay · Vuyyuru mast", status: "proposed" },
  ],
  godavari: [
    { id: "RL-GD-P1", kind: "relay", x: 76, y: 52, label: "Proposed relay · Mummidivaram mast", status: "proposed" },
    { id: "RL-GD-P2", kind: "relay", x: 62, y: 64, label: "Proposed relay · Palakollu mast", status: "proposed" },
    { id: "RL-GD-P3", kind: "relay", x: 86, y: 54, label: "Proposed relay · Yanam mast", status: "proposed" },
  ],
};

const forecastSeries: ForecastPoint[] = Array.from({ length: 17 }, (_, index) => {
  const hour = index * 3;
  return {
    hour,
    rainfall: Math.round(14 + Math.sin(index / 2.2) * 7 + index * 1.25),
    riverLevel: Number((10.9 + index * 0.13 + Math.sin(index / 3) * 0.22).toFixed(1)),
    risk: Math.min(96, Math.round(58 + index * 2.25 + Math.sin(index / 2) * 4)),
  };
});

const sensorDetails: Record<string, SensorDetail> = {
  "C-31": { location: "River island, Vijayawada reach", riskScore: 94, populationExposure: 28600, riverDistanceKm: 0.3, coverageRadiusKm: 6.2, riskCaptured: 91, relay: "RL-VJ-02 · Vijayawada" },
  "C-35": { location: "Coastal outlet, Krishna delta", riskScore: 89, populationExposure: 21400, riverDistanceKm: 0.7, coverageRadiusKm: 5.8, riskCaptured: 87, relay: "RL-VJ-02 · Vijayawada" },
  "C-39": { location: "Delta settlement, Hamsaladeevi", riskScore: 87, populationExposure: 33700, riverDistanceKm: 0.5, coverageRadiusKm: 6.4, riskCaptured: 89, relay: "RL-VJ-02 · Vijayawada" },
  "C-17": { location: "Canal junction, Konaseema", riskScore: 96, populationExposure: 30100, riverDistanceKm: 0.2, coverageRadiusKm: 6.1, riskCaptured: 93, relay: "RL-RJ-03 · Rajamahendravaram" },
  "C-24": { location: "Low-lying village, Amalapuram", riskScore: 91, populationExposure: 27400, riverDistanceKm: 0.6, coverageRadiusKm: 5.9, riskCaptured: 88, relay: "RL-RJ-03 · Rajamahendravaram" },
  "C-08": { location: "Embankment gap, Konaseema", riskScore: 86, populationExposure: 19600, riverDistanceKm: 0.4, coverageRadiusKm: 5.6, riskCaptured: 84, relay: "RL-RJ-03 · Rajamahendravaram" },
};
/* Derived mock details for the remaining candidate sites. */
for (const basinId of ["krishna", "godavari"] as const) {
  const hub = networkByBasin[basinId].find((node) => node.kind === "relay");
  for (const node of networkByBasin[basinId]) {
    if (node.kind !== "candidate" || sensorDetails[node.id]) continue;
    const p = node.priority ?? 70;
    sensorDetails[node.id] = { location: node.label.split(" · ")[1] ?? node.label, riskScore: p, populationExposure: Math.round(p * 260), riverDistanceKm: Number((1.2 - p / 100).toFixed(1)), coverageRadiusKm: 5, riskCaptured: Math.round(p * 0.95), relay: hub ? `${hub.id} · ${hub.label.replace(" relay", "")}` : "—" };
  }
}

export const dashboardByBasin: Record<Basin["id"], FloodDashboardData> = {
  krishna: {
    forecast: forecastSeries,
    zones: [
      { zone: "Vijayawada", historical: 64, predicted: 92 },
      { zone: "Barrage", historical: 72, predicted: 88 },
      { zone: "Avanigadda", historical: 58, predicted: 81 },
      { zone: "Kolluru", historical: 46, predicted: 73 },
      { zone: "Coastal", historical: 55, predicted: 84 },
    ],
    highRiskArea: 38,
    uncoveredHighRiskArea: 46,
    historicalSimilarity: "High",
    network: { candidates: 10, recommended: 8, relays: 3, coverage: 54, connectivity: 63 },
    sensorDetails,
  },
  godavari: {
    forecast: forecastSeries.map((point) => ({ ...point, rainfall: point.rainfall - 4, riverLevel: Number((point.riverLevel + 1.6).toFixed(1)), risk: Math.max(50, point.risk - 5) })),
    zones: [
      { zone: "Dowleswaram", historical: 69, predicted: 89 },
      { zone: "Konaseema", historical: 76, predicted: 94 },
      { zone: "Kothapeta", historical: 54, predicted: 78 },
      { zone: "Amalapuram", historical: 63, predicted: 86 },
      { zone: "Coastal", historical: 59, predicted: 82 },
    ],
    highRiskArea: 35,
    uncoveredHighRiskArea: 43,
    historicalSimilarity: "High",
    network: { candidates: 10, recommended: 8, relays: 3, coverage: 57, connectivity: 66 },
    sensorDetails,
  },
};

export const mockFloodService: FloodIntelligenceService = {
  async getBasins() { return basins; },
  async getNetwork(basinId) { return networkByBasin[basinId]; },
  async getDashboard(basinId) { return dashboardByBasin[basinId]; },
};
/* Domain aliases for future backend contracts. */
export type Sensor = NetworkNode & { kind: "sensor" };
export type CandidateSensor = NetworkNode & { kind: "candidate" };
export type OptimizedSensor = CandidateSensor;
export type CommunicationNode = NetworkNode & { kind: "relay" };
export type FloodRiskData = ZoneRisk;
export type RainfallData = Pick<ForecastPoint, "hour" | "rainfall">;
export type RiverLevelData = Pick<ForecastPoint, "hour" | "riverLevel">;
export interface CoverageZone { nodeId: string; radiusKm: number; optimized: boolean; }

export interface NodeSummary { id: string; type: string; status: string; battery: string; coverageKm: number; riskServed: string; link: string; location: string; }

/** Compact popover/table data for any network node. Values are mock. */
export function summarizeNode(node: NetworkNode, nodes: NetworkNode[], optimized: boolean): NodeSummary {
  const relay = nodes.find((item) => item.kind === "relay");
  const detail = sensorDetails[node.id];
  const type = node.kind === "relay" ? "Communication node" : node.kind === "sensor" ? "River-level sensor" : optimized ? "Optimized sensor" : "Candidate site";
  return {
    id: node.id,
    type,
    location: detail?.location ?? node.label,
    status: node.kind === "candidate" || node.status === "proposed" ? (optimized ? "Recommended" : "Candidate") : node.status === "online" ? "Online" : "Degraded",
    battery: node.battery ? `${node.battery}%` : "—",
    coverageKm: node.kind === "relay" ? 18 : detail?.coverageRadiusKm ?? (node.kind === "candidate" ? 6.2 : 5),
    riskServed: detail ? `${detail.riskCaptured}%` : node.kind === "relay" ? "Backhaul" : `${Math.round((node.priority ?? 60) * 0.12)}%`,
    link: node.kind === "relay" ? "Control centre" : relay?.id ?? "—",
  };
}
