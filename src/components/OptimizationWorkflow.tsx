import { AnimatePresence, motion } from "motion/react";
import { FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  optimizationStages,
  type OptimizationResult,
  type OptimizationStageId,
} from "@/lib/optimization-service";

interface OptimizationWorkflowProps {
  open: boolean;
  stage: OptimizationStageId | undefined;
  result: OptimizationResult | undefined;
  onSkip: () => void;
}

/** Compact progress panel shown over the live map. Driven purely by stage events. */
export function OptimizationWorkflow({ open, stage, result, onSkip }: OptimizationWorkflowProps) {
  const index = Math.max(
    0,
    optimizationStages.findIndex((item) => item.id === stage),
  );
  const current = optimizationStages[index] ?? optimizationStages[0];
  const description =
    current.id === "complete" && result
      ? `${result.recommendedSensors.length} of max ${result.request.maxSensors} sensors and ${result.recommendedRelays.length} of max ${result.request.maxRelays} communication nodes selected.`
      : current.id === "candidates" && result
        ? `${result.candidateCount} feasible candidate sites. ${current.description}`
        : current.description;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="opt-panel"
          role="status"
          aria-live="polite"
          aria-label="Network optimization in progress"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <div className="opt-head">
            <span>Quantum optimization simulation · mock</span>
            <span>
              {index + 1} / {optimizationStages.length}
            </span>
          </div>
          <div className="opt-track">
            {optimizationStages.map((item, i) => (
              <i
                key={item.id}
                data-state={i < index ? "done" : i === index ? "active" : "pending"}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h2>{current.label}</h2>
              <p>{description}</p>
              {current.id === "qubo" && (
                <div className="opt-qubo">
                  max&nbsp; Risk&nbsp;Coverage + Connectivity + Population − Cost − Redundancy
                </div>
              )}
              {current.id === "evaluation" && result && (
                <div className="opt-compare">
                  <span>
                    QAOA-ready mock <b>{result.coverageAfter}%</b>
                  </span>
                  <span>
                    Classical baseline <b>{result.baselineCoverage}%</b>
                  </span>
                </div>
              )}
              <div className="opt-progress">
                <motion.span
                  key={current.id}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: current.durationMs / 1000, ease: "linear" }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          <Button variant="ghost" size="sm" className="opt-skip" onClick={onSkip}>
            <FastForward /> Skip animation
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
