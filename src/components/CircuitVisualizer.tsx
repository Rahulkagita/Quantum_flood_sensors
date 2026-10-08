import React from "react";
import { Cpu, Zap, Layers } from "lucide-react";

interface CircuitVisualizerProps {
  numQubits?: number;
  depthP?: number;
}

export const CircuitVisualizer: React.FC<CircuitVisualizerProps> = ({
  numQubits = 8,
  depthP = 1,
}) => {
  const sensorCount = 5;
  const relayCount = 3;

  return (
    <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE5DF] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#1A2421] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#7657B8]" /> QAOA Quantum Circuit Ansatz Visualizer
          </h2>
          <p className="text-xs text-[#5C6E66] mt-0.5">
            8-qubit register initialized to |+⟩^⊗8, followed by p={depthP} layer(s) of U_C(γ) and U_B(β) gates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-quantum">Depth p={depthP}</span>
          <span className="badge-state" data-state="LIVE">Statevector Vector</span>
        </div>
      </div>

      {/* Quantum Circuit Wire Canvas */}
      <div className="overflow-x-auto bg-[#F7F8F3] p-4 rounded-lg border border-[#DFE5DF]">
        <div className="min-w-[680px] space-y-2.5 font-mono text-xs">
          {Array.from({ length: numQubits }).map((_, idx) => {
            const isSensor = idx < sensorCount;
            const label = isSensor ? `q_${idx} (x_${idx + 1})` : `q_${idx} (y_${idx - sensorCount + 1})`;
            const colorClass = isSensor ? "text-[#126B48]" : "text-[#7657B8]";

            return (
              <div key={idx} className="flex items-center gap-2 h-7">
                {/* Qubit Label */}
                <div className={`w-24 font-bold ${colorClass} text-[11px] shrink-0`}>
                  |0⟩_{label}
                </div>

                {/* Initial State Prep (Hadamard H) */}
                <div className="px-2.5 py-1 bg-white border border-[#C4E2D3] rounded font-semibold text-[#126B48] text-[11px] shadow-2xs shrink-0">
                  H
                </div>

                {/* Wire Segment */}
                <div className="h-0.5 flex-1 bg-[#8FA69B]" />

                {/* QAOA Layers */}
                {Array.from({ length: depthP }).map((_, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {/* Problem Hamiltonian Cost Unitary U_C(gamma) */}
                    <div className="px-2.5 py-1 bg-[#EEE9F8] border border-[#D8CCE8] rounded font-bold text-[#6343A1] text-[10px] shadow-2xs shrink-0">
                      U_C(γ_{pIdx + 1})
                    </div>

                    <div className="h-0.5 w-6 bg-[#8FA69B]" />

                    {/* Mixer Hamiltonian Unitary U_B(beta) */}
                    <div className="px-2.5 py-1 bg-white border border-[#DFE5DF] rounded font-bold text-[#1A2421] text-[10px] shadow-2xs shrink-0">
                      U_B(β_{pIdx + 1})
                    </div>

                    <div className="h-0.5 flex-1 bg-[#8FA69B]" />
                  </React.Fragment>
                ))}

                {/* Measurement Symbol */}
                <div className="px-2 py-0.5 bg-[#DFE5DF] border border-[#B3C0B8] rounded font-bold text-[#1A2421] text-[10px] shrink-0">
                  [M]
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Parameters */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#5C6E66] pt-1 border-t border-[#DFE5DF]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#126B48]" /> Sensor Qubits q_0..q_4
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7657B8]" /> Relay Qubits q_5..q_7
          </span>
        </div>
        <div>
          <span>Circuit Gates: <strong className="text-[#1A2421]">8 H + {depthP * 8} U_C + {depthP * 8} U_B + 8 Measurement</strong></span>
        </div>
      </div>
    </div>
  );
};
