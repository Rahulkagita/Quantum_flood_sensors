import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, Cpu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultOptimizationConfig,
  strategyLabels,
  strategyWeights,
  type OptimizationConfig,
  type OptimizationStrategy,
  type OptimizationWeights,
} from "@/lib/optimization-service";

interface Props {
  config: OptimizationConfig;
  area: string;
  onChange: (config: OptimizationConfig) => void;
  onRun: () => void;
  onClose: () => void;
}
type NumKey =
  | "maxSensors"
  | "maxRelays"
  | "sensorRangeKm"
  | "communicationRangeKm"
  | "minimumSensorDistanceKm"
  | "sensorCost"
  | "relayCost"
  | "budget"
  | "minimumRiskCoverage";
const limits: Record<NumKey, [number, number, number]> = {
  maxSensors: [1, 20, 1],
  maxRelays: [0, 6, 1],
  sensorRangeKm: [1, 15, 0.5],
  communicationRangeKm: [2, 40, 1],
  minimumSensorDistanceKm: [0, 10, 0.5],
  sensorCost: [5000, 200000, 5000],
  relayCost: [10000, 300000, 5000],
  budget: [50000, 5000000, 10000],
  minimumRiskCoverage: [50, 98, 1],
};
const weightLabels: Record<keyof OptimizationWeights, string> = {
  riskCoverage: "Risk coverage",
  population: "Population protection",
  cost: "Cost",
  sensorCount: "Sensor count",
  connectivity: "Connectivity",
};

/** Compact optimization setup shown over the live map. */
export function OptimizationSetup({ config, area, onChange, onRun, onClose }: Props) {
  const [advanced, setAdvanced] = useState(Boolean(config.weights));
  const set = (patch: Partial<OptimizationConfig>) => onChange({ ...config, ...patch });
  const num = (key: NumKey, label: string, unit?: string) => {
    const [min, max, step] = limits[key];
    return (
      <label className="setup-field">
        <span>{label}</span>
        <div>
          <Input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={config[key]}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) set({ [key]: Math.min(max, Math.max(min, v)) });
            }}
          />
          {unit && <em>{unit}</em>}
        </div>
      </label>
    );
  };
  const weights = config.weights ?? strategyWeights[config.optimizationStrategy];
  const minCost = config.sensorCost + (config.maxRelays ? config.relayCost : 0);
  const invalid = config.budget < config.sensorCost;

  return (
    <motion.div
      className="opt-setup"
      role="dialog"
      aria-label="Optimization setup"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="opt-head">
        <span>Optimization setup · {area}</span>
        <button type="button" aria-label="Close setup" onClick={onClose}>
          <X />
        </button>
      </div>
      <p className="setup-objective">
        <b>Maximize</b> risk-weighted coverage, population and infrastructure protected,
        connectivity. <b>Minimize</b> sensors, cost, redundancy. Limits below are maximums — the
        optimizer may use fewer.
      </p>

      <p className="setup-group">Network constraints</p>
      <div className="setup-grid">
        {num("maxSensors", "Max sensors")}
        {num("maxRelays", "Max comm. nodes")}
        {num("sensorRangeKm", "Detection range", "km")}
        {num("communicationRangeKm", "Comm. range", "km")}
        {num("minimumSensorDistanceKm", "Min. sensor spacing", "km")}
      </div>
      <p className="setup-group">Deployment constraints</p>
      <div className="setup-grid">
        {num("sensorCost", "Sensor cost", "₹")}
        {num("relayCost", "Comm. node cost", "₹")}
        {num("budget", "Max budget", "₹")}
        {num("minimumRiskCoverage", "Min. risk coverage", "%")}
        <label className="setup-field">
          <span>Forecast horizon</span>
          <Select
            value={String(config.forecastHorizonHours)}
            onValueChange={(v) =>
              set({ forecastHorizonHours: Number(v) as OptimizationConfig["forecastHorizonHours"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 12, 24, 48].map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h} hours
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <p className="setup-group">Strategy</p>
      <Select
        value={config.optimizationStrategy}
        onValueChange={(v) =>
          set({
            optimizationStrategy: v as OptimizationStrategy,
            weights: advanced ? strategyWeights[v as OptimizationStrategy] : undefined,
          })
        }
      >
        <SelectTrigger aria-label="Optimization strategy">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(strategyLabels) as OptimizationStrategy[]).map((s) => (
            <SelectItem key={s} value={s}>
              {strategyLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Collapsible
        open={advanced}
        onOpenChange={(open) => {
          setAdvanced(open);
          set({ weights: open ? weights : undefined });
        }}
      >
        <CollapsibleTrigger className="setup-advanced">
          <ChevronDown data-open={advanced} /> Advanced weighting
        </CollapsibleTrigger>
        <CollapsibleContent className="setup-weights">
          {(Object.keys(weightLabels) as (keyof OptimizationWeights)[]).map((k) => (
            <label key={k}>
              <span>{weightLabels[k]}</span>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[weights[k]]}
                onValueChange={([v]) => set({ weights: { ...weights, [k]: v ?? 0 } })}
              />
              <em className="font-mono">{weights[k].toFixed(1)}</em>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {invalid && <p className="setup-error">Budget must cover at least one sensor.</p>}
      {!invalid && config.budget < minCost && (
        <p className="setup-note">Budget leaves no room for a communication node.</p>
      )}
      <div className="setup-actions">
        <Button variant="ghost" size="sm" onClick={() => onChange(defaultOptimizationConfig)}>
          Reset
        </Button>
        <Button size="sm" onClick={onRun} disabled={invalid}>
          <Cpu /> Run optimization
        </Button>
      </div>
      <p className="setup-note">
        Mock simulation · the frontend does not perform the optimization.
      </p>
    </motion.div>
  );
}
