import {
  dashboardByBasin,
  networkByBasin,
  relayCandidatesByBasin,
  type Basin,
  type NetworkNode,
} from "@/lib/flood-intelligence";
import { gridToLngLat, nodeCoordinates, type LngLat } from "@/lib/geo-data";

export type OptimizationStrategy = "balanced" | "risk" | "coverage" | "cost" | "sensors";
export const strategyLabels: Record<OptimizationStrategy, string> = {
  balanced: "Balanced",
  risk: "Maximum risk reduction",
  coverage: "Maximum coverage",
  cost: "Minimum cost",
  sensors: "Minimum sensors",
};
export interface OptimizationWeights {
  riskCoverage: number;
  population: number;
  cost: number;
  sensorCount: number;
  connectivity: number;
}

/** User-configured optimization inputs. "max" values are limits, not exact counts. */
export interface OptimizationConfig {
  maxSensors: number;
  maxRelays: number;
  sensorRangeKm: number;
  communicationRangeKm: number;
  minimumSensorDistanceKm: number;
  sensorCost: number;
  relayCost: number;
  budget: number;
  minimumRiskCoverage: number;
  forecastHorizonHours: 6 | 12 | 24 | 48;
  optimizationStrategy: OptimizationStrategy;
  /** Only set when the user opens advanced weighting. */
  weights?: OptimizationWeights | undefined;
}
/** Body for future POST /api/optimization. */
export interface OptimizationRequest extends OptimizationConfig {
  basinId: Basin["id"];
  areaId: string;
}

export interface OptimizationResult {
  id: string;
  status: "complete";
  solver: "QAOA-ready mock";
  request: OptimizationRequest;
  candidateCount: number;
  recommendedSensors: string[];
  recommendedRelays: string[];
  coverageBefore: number;
  coverageAfter: number;
  baselineCoverage: number;
  populationBefore: number;
  populationAfter: number;
  infrastructureBefore: number;
  infrastructureAfter: number;
  connectivityBefore: number;
  connectivityAfter: number;
  sensorsBefore: number;
  cost: number;
  warningGainMinutes: number;
  objectiveScore: number;
  meetsMinimumCoverage: boolean;
}

export const defaultOptimizationConfig: OptimizationConfig = {
  maxSensors: 10,
  maxRelays: 3,
  sensorRangeKm: 5,
  communicationRangeKm: 10,
  minimumSensorDistanceKm: 2,
  sensorCost: 40000,
  relayCost: 75000,
  budget: 500000,
  minimumRiskCoverage: 85,
  forecastHorizonHours: 12,
  optimizationStrategy: "balanced",
};
export const strategyWeights: Record<OptimizationStrategy, OptimizationWeights> = {
  balanced: { riskCoverage: 1, population: 0.6, cost: 0.5, sensorCount: 0.4, connectivity: 0.6 },
  risk: { riskCoverage: 1.4, population: 0.5, cost: 0.2, sensorCount: 0.2, connectivity: 0.5 },
  coverage: { riskCoverage: 1, population: 1, cost: 0.1, sensorCount: 0.1, connectivity: 0.4 },
  cost: { riskCoverage: 0.8, population: 0.4, cost: 1.4, sensorCount: 0.6, connectivity: 0.4 },
  sensors: { riskCoverage: 0.8, population: 0.4, cost: 0.6, sensorCount: 1.4, connectivity: 0.4 },
};

export const formatInr = (value: number) =>
  value >= 100000
    ? `₹${(value / 100000).toFixed(value % 100000 ? 1 : 0)}L`
    : `₹${Math.round(value / 1000)}K`;

const coordOf = (basinId: Basin["id"], node: NetworkNode): LngLat =>
  nodeCoordinates[node.id] ?? gridToLngLat(basinId, node.x, node.y);
const km = ([a, b]: LngLat, [c, d]: LngLat) => {
  const r = Math.PI / 180,
    dLat = (d - b) * r,
    dLng = (c - a) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(b * r) * Math.cos(d * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Deterministic mock of the optimizer. NOT a QUBO/QAOA solve — a greedy heuristic that reacts
 * consistently to the inputs so the UI can be exercised until the backend exists.
 */
export function mockOptimize(request: OptimizationRequest): OptimizationResult {
  const { basinId } = request;
  const network = networkByBasin[basinId];
  const existing = network.filter((n) => n.kind === "sensor");
  const hubs = network.filter((n) => n.kind === "relay");
  const candidates = network.filter((n) => n.kind === "candidate");
  const details = dashboardByBasin[basinId].sensorDetails;
  const w = request.weights ?? strategyWeights[request.optimizationStrategy];
  const before = dashboardByBasin[basinId].network.coverage;
  const connBefore = dashboardByBasin[basinId].network.connectivity;
  const popBefore = basinId === "krishna" ? 118000 : 124000;
  const rangeFactor = Math.min(1.8, Math.max(0.4, (request.sensorRangeKm / 5) ** 0.7));
  const stopAtTarget =
    request.optimizationStrategy === "cost" || request.optimizationStrategy === "sensors";

  const selected: { node: NetworkNode; at: LngLat; gain: number; pop: number }[] = [];
  let coverage = before;
  let spend = 0;
  const reserve = Math.min(request.maxRelays, 1) * request.relayCost; // keep room for at least one relay
  while (selected.length < request.maxSensors) {
    let best: ((typeof selected)[number] & { score: number }) | undefined;
    for (const node of candidates) {
      if (selected.some((s) => s.node.id === node.id)) continue;
      const at = coordOf(basinId, node);
      const tooClose = [
        ...existing.map((e) => coordOf(basinId, e)),
        ...selected.map((s) => s.at),
      ].some((p) => km(p, at) < request.minimumSensorDistanceKm);
      if (tooClose) continue;
      const overlap = selected.filter((s) => km(s.at, at) < request.sensorRangeKm * 2).length;
      const gain =
        (100 - coverage) * 0.26 * ((node.priority ?? 70) / 100) * rangeFactor * 0.82 ** overlap;
      const pop = (details[node.id]?.populationExposure ?? 18000) * rangeFactor * 0.82 ** overlap;
      const score =
        w.riskCoverage * gain +
        w.population * (pop / 10000) -
        w.cost * (request.sensorCost / 100000) * 2 -
        w.sensorCount * 1.2 -
        w.connectivity * overlap * 0.3;
      if (!best || score > best.score) best = { node, at, gain, pop, score };
    }
    if (!best || best.score <= 0) break;
    if (spend + request.sensorCost + (spend === 0 ? reserve : 0) > request.budget) break;
    if (
      coverage >= request.minimumRiskCoverage &&
      (stopAtTarget || (request.optimizationStrategy === "balanced" && best.gain < 1.5))
    )
      break;
    selected.push(best);
    spend += request.sensorCost;
    coverage += best.gain;
  }

  // Connectivity: a sensor is linked if a hub, chosen relay or deployed sensor (mesh hop) is within communication range.
  const linkPoints = () => [
    ...hubs.map((h) => coordOf(basinId, h)),
    ...existing.map((e) => coordOf(basinId, e)),
    ...relays.map((r) => coordOf(basinId, r)),
  ];
  const relays: NetworkNode[] = [];
  const unlinked = () =>
    selected.filter((s) => !linkPoints().some((p) => km(p, s.at) <= request.communicationRangeKm));
  for (const site of relayCandidatesByBasin[basinId]) {
    if (relays.length >= request.maxRelays || spend + request.relayCost > request.budget) break;
    const open = unlinked();
    if (!open.length) break;
    if (open.some((s) => km(coordOf(basinId, site), s.at) <= request.communicationRangeKm * 1.6)) {
      relays.push(site);
      spend += request.relayCost;
    }
  }
  const orphans = unlinked();
  const coverageAfter = round1(
    Math.min(98.5, coverage - orphans.reduce((sum, s) => sum + s.gain * 0.5, 0)),
  );
  const linkedShare = selected.length ? 1 - orphans.length / selected.length : 0;
  const connectivityAfter = Math.round(
    Math.min(99, connBefore + (100 - connBefore) * linkedShare * 0.7 + relays.length * 3),
  );
  const popGain =
    selected.reduce((sum, s) => sum + s.pop * (orphans.includes(s) ? 0.5 : 1), 0) * 0.55;
  const horizonBonus = { 6: -4, 12: 0, 24: 4, 48: 7 }[request.forecastHorizonHours];
  const delta = coverageAfter - before;

  return {
    id: `OPT-${(basinId === "krishna" ? 1 : 2) * 1000 + selected.length * 37 + relays.length * 11 + Math.round(coverageAfter)}`,
    status: "complete",
    solver: "QAOA-ready mock",
    request,
    candidateCount: candidates.length,
    recommendedSensors: selected.map((s) => s.node.id),
    recommendedRelays: relays.map((r) => r.id),
    coverageBefore: before,
    coverageAfter,
    baselineCoverage: round1(
      Math.max(before, coverageAfter - (selected.length ? 1.4 + selected.length * 0.55 : 0)),
    ),
    populationBefore: popBefore,
    populationAfter: Math.round((popBefore + popGain) / 1000) * 1000,
    infrastructureBefore: 53,
    infrastructureAfter: Math.round(Math.min(97, 53 + delta * 0.85)),
    connectivityBefore: connBefore,
    connectivityAfter,
    sensorsBefore: existing.length,
    cost: spend,
    warningGainMinutes: Math.max(0, Math.round(delta * 0.9 + (delta > 0 ? horizonBonus : 0))),
    objectiveScore: Number(
      (coverageAfter / 100 - (spend / Math.max(request.budget, 1)) * 0.05).toFixed(3),
    ),
    meetsMinimumCoverage: coverageAfter >= request.minimumRiskCoverage,
  };
}

export const optimizationStages = [
  {
    id: "risk",
    label: "Analyzing flood risk",
    description: "Scoring forecast risk across basin grid cells and flood-prone zones.",
    durationMs: 850,
  },
  {
    id: "candidates",
    label: "Generating candidate locations",
    description:
      "Filtering feasible sensor sites by access, elevation, river proximity and minimum spacing.",
    durationMs: 900,
  },
  {
    id: "matrix",
    label: "Building coverage matrix",
    description:
      "Mapping which risk cells each candidate site can observe within the detection range.",
    durationMs: 900,
  },
  {
    id: "qubo",
    label: "Formulating QUBO",
    description:
      "Encoding objectives and constraints: sensor and relay limits, budget, coverage target, spacing, links.",
    durationMs: 1000,
  },
  {
    id: "qaoa",
    label: "Running QAOA",
    description:
      "Quantum optimization simulation — no circuit is executed in this frontend demonstration.",
    durationMs: 1200,
  },
  {
    id: "evaluation",
    label: "Comparing classical baseline",
    description: "QAOA-ready mock vs. classical greedy baseline on risk-weighted coverage.",
    durationMs: 900,
  },
  { id: "complete", label: "Optimal network found", description: "", durationMs: 800 },
] as const;

export type OptimizationStageId = (typeof optimizationStages)[number]["id"];
export interface OptimizationStageEvent {
  stage: OptimizationStageId;
  stageIndex: number;
  progress: number;
}
export interface OptimizationRun {
  result: OptimizationResult;
  events: AsyncGenerator<OptimizationStageEvent>;
  skip: () => void;
  cancel: () => void;
  shouldReveal: () => boolean;
}
/** request → stage events → result. A REST adapter for POST /api/optimization can implement the same shape. */
export interface OptimizationWorkflowService {
  start(input: OptimizationRequest): OptimizationRun;
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const mockOptimizationWorkflowService: OptimizationWorkflowService = {
  start(input) {
    const controller = new AbortController();
    let skipped = false;
    let cancelled = false;
    const result = mockOptimize(input);
    const scale = prefersReducedMotion() ? 0.25 : 1;
    async function* events() {
      for (let index = 0; index < optimizationStages.length; index += 1) {
        const item = optimizationStages[index];
        if (!item || controller.signal.aborted) return;
        yield {
          stage: item.id,
          stageIndex: index,
          progress: Math.round((index / optimizationStages.length) * 100),
        };
        if (!skipped) await wait(item.durationMs * scale, controller.signal);
      }
    }
    return {
      result,
      events: events(),
      skip: () => {
        skipped = true;
        controller.abort();
      },
      cancel: () => {
        cancelled = true;
        controller.abort();
      },
      shouldReveal: () => !cancelled,
    };
  },
};
