import type { Basin } from "@/lib/flood-intelligence";

export type RainfallIntensity = "normal" | "heavy" | "severe" | "extreme";
export type RiverRise = 0 | 0.5 | 1 | 1.5 | 2;
export type ScenarioDuration = 1 | 6 | 12 | 24;
export type SensorFailureRate = 0 | 10 | 25 | 50;
export type CommunicationFailureRate = 0 | 10 | 25;

export interface FloodScenarioRequest {
  basinId: Basin["id"];
  currentRisk: number;
  currentCoverage: number;
  existingSensors: number;
  existingCommunicationNodes: number;
  rainfallIntensity: RainfallIntensity;
  riverRiseMeters: RiverRise;
  durationHours: ScenarioDuration;
  sensorFailurePercent: SensorFailureRate;
  communicationFailurePercent: CommunicationFailureRate;
}

export interface ScenarioCriticalZone {
  id: string;
  label: string;
  x: number;
  y: number;
  severity: number;
}

export interface FloodScenarioResult {
  id: string;
  status: "complete";
  generatedAt: string;
  currentRisk: number;
  predictedRisk: number;
  currentCoverage: number;
  requiredCoverage: number;
  existingSensors: number;
  requiredSensors: number;
  existingCommunicationNodes: number;
  requiredCommunicationNodes: number;
  additionalSensors: number;
  additionalCommunicationNodes: number;
  criticalZones: ScenarioCriticalZone[];
  recommendations: string[];
}

export interface FloodScenarioService {
  simulate(input: FloodScenarioRequest): Promise<FloodScenarioResult>;
}

const rainfallWeight: Record<RainfallIntensity, number> = {
  normal: 0,
  heavy: 5,
  severe: 10,
  extreme: 15,
};
const durationWeight: Record<ScenarioDuration, number> = { 1: 0, 6: 3, 12: 6, 24: 10 };

const zonesByBasin: Record<Basin["id"], ScenarioCriticalZone[]> = {
  krishna: [
    { id: "SC-KR-07", label: "Vijayawada east bank", x: 52, y: 51, severity: 96 },
    { id: "SC-KR-11", label: "Avanigadda floodplain", x: 64, y: 67, severity: 92 },
    { id: "SC-KR-14", label: "Hamsaladeevi outlet", x: 75, y: 56, severity: 89 },
  ],
  godavari: [
    { id: "SC-GD-07", label: "Konaseema central delta", x: 73, y: 49, severity: 97 },
    { id: "SC-GD-11", label: "Amalapuram lowlands", x: 84, y: 58, severity: 93 },
    { id: "SC-GD-14", label: "Kothapeta canal reach", x: 67, y: 64, severity: 88 },
  ],
};

export const mockFloodScenarioService: FloodScenarioService = {
  async simulate(input) {
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    const stress =
      rainfallWeight[input.rainfallIntensity] +
      input.riverRiseMeters * 8 +
      durationWeight[input.durationHours] +
      input.sensorFailurePercent * 0.16 +
      input.communicationFailurePercent * 0.12;
    const predictedRisk = Math.min(99, Math.round(input.currentRisk + stress * 0.68));
    const additionalSensors = Math.max(1, Math.min(6, Math.ceil(stress / 11)));
    const additionalCommunicationNodes = Math.max(
      0,
      Math.min(
        3,
        Math.ceil(
          (input.communicationFailurePercent +
            input.sensorFailurePercent * 0.3 +
            input.riverRiseMeters * 5) /
            18,
        ),
      ),
    );
    const requiredCoverage = Math.min(
      98,
      Math.round(input.currentCoverage + Math.max(6, stress * 0.36)),
    );
    const criticalZoneCount = Math.max(1, Math.min(3, Math.ceil(stress / 12)));

    return {
      id: `SCN-${Date.now().toString().slice(-6)}`,
      status: "complete",
      generatedAt: new Date().toISOString(),
      currentRisk: input.currentRisk,
      predictedRisk,
      currentCoverage: input.currentCoverage,
      requiredCoverage,
      existingSensors: input.existingSensors,
      requiredSensors: input.existingSensors + additionalSensors,
      existingCommunicationNodes: input.existingCommunicationNodes,
      requiredCommunicationNodes: input.existingCommunicationNodes + additionalCommunicationNodes,
      additionalSensors,
      additionalCommunicationNodes,
      criticalZones: zonesByBasin[input.basinId].slice(0, criticalZoneCount),
      recommendations: [
        ...["S07", "S11", "S14", "S18", "S22", "S26"]
          .slice(0, additionalSensors)
          .map((id) => `Deploy Sensor ${id}`),
        ...["C03", "C05", "C08"]
          .slice(0, additionalCommunicationNodes)
          .map((id) => `Activate Communication Node ${id}`),
      ],
    };
  },
};
