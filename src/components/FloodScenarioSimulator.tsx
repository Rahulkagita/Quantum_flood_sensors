import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, Check, CloudRain, RadioTower, Waves } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Basin } from "@/lib/flood-intelligence";
import {
  mockFloodScenarioService,
  type CommunicationFailureRate,
  type FloodScenarioResult,
  type RainfallIntensity,
  type RiverRise,
  type ScenarioDuration,
  type SensorFailureRate,
} from "@/lib/scenario-service";

interface FloodScenarioSimulatorProps {
  basin: Basin;
  currentCoverage: number;
  existingSensors: number;
  existingCommunicationNodes: number;
  result: FloodScenarioResult | undefined;
  onResult: (result: FloodScenarioResult) => void;
}

const rainfallOptions: { value: RainfallIntensity; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "heavy", label: "Heavy" },
  { value: "severe", label: "Severe" },
  { value: "extreme", label: "Extreme" },
];
const riverOptions: RiverRise[] = [0, 0.5, 1, 1.5, 2];
const durationOptions: ScenarioDuration[] = [1, 6, 12, 24];
const sensorFailureOptions: SensorFailureRate[] = [0, 10, 25, 50];
const communicationFailureOptions: CommunicationFailureRate[] = [0, 10, 25];

export function FloodScenarioSimulator({
  basin,
  currentCoverage,
  existingSensors,
  existingCommunicationNodes,
  result,
  onResult,
}: FloodScenarioSimulatorProps) {
  const [rainfallIntensity, setRainfallIntensity] = useState<RainfallIntensity>("extreme");
  const [riverRiseMeters, setRiverRiseMeters] = useState<RiverRise>(1);
  const [durationHours, setDurationHours] = useState<ScenarioDuration>(12);
  const [sensorFailurePercent, setSensorFailurePercent] = useState<SensorFailureRate>(10);
  const [communicationFailurePercent, setCommunicationFailurePercent] =
    useState<CommunicationFailureRate>(10);
  const [running, setRunning] = useState(false);

  const simulate = async () => {
    setRunning(true);
    const next = await mockFloodScenarioService.simulate({
      basinId: basin.id,
      currentRisk: basin.riskScore,
      currentCoverage,
      existingSensors,
      existingCommunicationNodes,
      rainfallIntensity,
      riverRiseMeters,
      durationHours,
      sensorFailurePercent,
      communicationFailurePercent,
    });
    onResult(next);
    setRunning(false);
  };

  return (
    <div className="scenario-layout">
      <div className="scenario-controls">
        <ScenarioControl label="Rainfall intensity" icon={<CloudRain />}>
          <Segmented
            options={rainfallOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={rainfallIntensity}
            onChange={(value) => setRainfallIntensity(value as RainfallIntensity)}
          />
        </ScenarioControl>
        <ScenarioControl label="River level" icon={<Waves />}>
          <Segmented
            options={riverOptions.map((value) => ({
              value: String(value),
              label: value === 0 ? "Current" : `+${value}m`,
            }))}
            value={String(riverRiseMeters)}
            onChange={(value) => setRiverRiseMeters(Number(value) as RiverRise)}
          />
        </ScenarioControl>
        <ScenarioControl label="Duration">
          <Segmented
            options={durationOptions.map((value) => ({ value: String(value), label: `${value}h` }))}
            value={String(durationHours)}
            onChange={(value) => setDurationHours(Number(value) as ScenarioDuration)}
          />
        </ScenarioControl>
        <ScenarioControl label="Existing sensor failures">
          <Segmented
            options={sensorFailureOptions.map((value) => ({
              value: String(value),
              label: `${value}%`,
            }))}
            value={String(sensorFailurePercent)}
            onChange={(value) => setSensorFailurePercent(Number(value) as SensorFailureRate)}
          />
        </ScenarioControl>
        <ScenarioControl label="Communication node failures" icon={<RadioTower />}>
          <Segmented
            options={communicationFailureOptions.map((value) => ({
              value: String(value),
              label: `${value}%`,
            }))}
            value={String(communicationFailurePercent)}
            onChange={(value) =>
              setCommunicationFailurePercent(Number(value) as CommunicationFailureRate)
            }
          />
        </ScenarioControl>
        <Button className="scenario-submit" onClick={() => void simulate()} disabled={running}>
          <AlertTriangle />
          {running ? "Simulating scenario…" : "Simulate scenario"}
          <ArrowRight />
        </Button>
        <p className="footnote">Mock projection. Results update the map.</p>
      </div>

      <div className="scenario-output" aria-live="polite">
        {!result && (
          <div className="scenario-empty">
            <AlertTriangle />
            <strong>No active scenario</strong>
            <p>Configure stress conditions to project risk and network requirements.</p>
          </div>
        )}
        {result && (
          <motion.div key={result.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="scenario-result-head">
              <div>
                <i /> Scenario active on map
              </div>
              <span>{result.criticalZones.length} newly critical zones</span>
            </div>
            <div className="scenario-metrics">
              <ScenarioComparison
                label="Risk"
                current={result.currentRisk}
                projected={result.predictedRisk}
                tone="critical"
              />
              <ScenarioComparison
                label="Coverage"
                current={result.currentCoverage}
                projected={result.requiredCoverage}
                suffix="%"
              />
              <ScenarioComparison
                label="Sensor network"
                current={result.existingSensors}
                projected={result.requiredSensors}
              />
              <ScenarioComparison
                label="Communication nodes"
                current={result.existingCommunicationNodes}
                projected={result.requiredCommunicationNodes}
              />
            </div>
            <div className="scenario-additions">
              <span>
                <strong>+{result.additionalSensors}</strong> sensors required
              </span>
              <span>
                <strong>+{result.additionalCommunicationNodes}</strong> communication nodes required
              </span>
            </div>
            <section className="recommended-response">
              <p className="label">Recommended response</p>
              {result.recommendations.map((recommendation) => (
                <div key={recommendation}>
                  <Check />
                  {recommendation}
                </div>
              ))}
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ScenarioControl({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="scenario-control">
      <div className="scenario-control-label">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented" role="group">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          data-active={option.value === value}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
function ScenarioComparison({
  label,
  current,
  projected,
  suffix = "",
  tone,
}: {
  label: string;
  current: number;
  projected: number;
  suffix?: string;
  tone?: "critical";
}) {
  return (
    <div className="scenario-comparison">
      <p>{label}</p>
      <div>
        <span>
          <small>Current</small>
          {current}
          {suffix}
        </span>
        <ArrowRight />
        <strong data-tone={tone}>
          <small>{label === "Risk" ? "Predicted" : "Required"}</small>
          {projected}
          {suffix}
        </strong>
      </div>
    </div>
  );
}
