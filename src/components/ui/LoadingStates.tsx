import React from "react";
import { Loader2, AlertCircle, RefreshCw, Layers, Cpu, CheckCircle2 } from "lucide-react";

export interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-pulse rounded bg-[#EEF2EE] ${className}`} />;
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-[#DFE5DF] rounded-lg p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-3 w-24" />
        <LoadingSkeleton className="h-4 w-4 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-20" />
      <LoadingSkeleton className="h-3 w-32" />
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-60" }) => {
  return (
    <div className={`bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4 ${height} flex flex-col justify-between`}>
      <div className="flex justify-between items-center border-b border-[#DFE5DF] pb-3">
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton className="h-5 w-24 rounded" />
      </div>
      <div className="flex-1 flex items-end justify-between gap-3 pt-4">
        {[40, 75, 55, 90, 60, 80].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-full bg-[#EEF2EE] animate-pulse rounded-t`} style={{ height: `${h}%` }} />
            <LoadingSkeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="bg-white border border-[#DFE5DF] rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center border-b border-[#DFE5DF] pb-3">
        <LoadingSkeleton className="h-4 w-40" />
        <LoadingSkeleton className="h-4 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-[#EEF2EE]">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-36" />
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MapLoadingState: React.FC<{ message?: string }> = ({ message = "Loading Flood Intelligence Map..." }) => {
  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#E8ECE8] rounded-lg flex flex-col items-center justify-center p-6 text-center border border-[#DFE5DF]">
      <div className="w-12 h-12 rounded-full bg-white border border-[#DFE5DF] flex items-center justify-center shadow-xs mb-3">
        <Loader2 className="w-6 h-6 text-[#168A5B] animate-spin" />
      </div>
      <h3 className="text-sm font-bold text-[#1A2421]">{message}</h3>
      <p className="text-xs text-[#5C6E66] mt-1 max-w-sm">
        Rendering GIS hydro-meterological vectors, candidate grids, and river channels...
      </p>
    </div>
  );
};

export const QuantumEngineLoadingState: React.FC<{ currentStep?: number }> = ({ currentStep = 3 }) => {
  const stages = [
    { name: "INITIALIZING", sub: "Setting up Qiskit 2.5 simulator" },
    { name: "BUILDING SPATIAL DEMAND", sub: "Reading IMD & WorldPop grids" },
    { name: "FORMING QUBO", sub: "Constructing 8x8 matrix H(x,y)" },
    { name: "MAPPING TO ISING", sub: "Spin substitution Z_i = 1 - 2x_i" },
    { name: "RUNNING QAOA", sub: "Executing statevector simulation" },
    { name: "DECODING BITSTRING", sub: "Sample bitstring evaluation" },
    { name: "BUILDING DEPLOYMENT", sub: "Connecting sensors & relays" },
  ];

  return (
    <div className="bg-white border border-[#DFE5DF] rounded-lg p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-[#DFE5DF] pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#7657B8] animate-spin" />
          <h2 className="text-sm font-bold text-[#1A2421]">Executing Quantum Response Optimizer</h2>
        </div>
        <span className="badge-quantum">Qiskit 2.5 Engine</span>
      </div>

      <div className="space-y-3">
        {stages.map((st, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={st.name}
              className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                isDone
                  ? "bg-[#EEF7F1] border-[#C4E2D3] text-[#126B48]"
                  : isCurrent
                  ? "bg-[#EEE9F8] border-[#7657B8] text-[#1A2421] shadow-xs"
                  : "bg-[#F7F8F3] border-[#DFE5DF] text-[#8FA69B]"
              }`}
            >
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#168A5B] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#7657B8] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#DFE5DF] shrink-0" />
                )}
                <div>
                  <div className="font-bold tracking-tight">{st.name}</div>
                  <div className="text-[11px] opacity-80">{st.sub}</div>
                </div>
              </div>

              {isDone && <span className="font-mono text-[10px] uppercase font-bold text-[#168A5B]">COMPLETE</span>}
              {isCurrent && <span className="font-mono text-[10px] uppercase font-bold text-[#7657B8]">RUNNING...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = "Unable to load flood intelligence data",
  message = "A temporary network or service connection failure occurred while contacting the PRAVAAH intelligence service.",
  onRetry,
}) => {
  return (
    <div className="bg-white border border-[#F6B8B6] rounded-lg p-6 text-center space-y-4 shadow-xs">
      <div className="w-10 h-10 rounded-full bg-[#FDEDEC] text-[#E85D5A] flex items-center justify-center mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#1A2421]">{title}</h3>
        <p className="text-xs text-[#5C6E66] mt-1 max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#168A5B] hover:bg-[#126B48] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Request
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
}> = ({ title = "No flood intelligence data available", message = "No records found for the selected basin or scenario configuration." }) => {
  return (
    <div className="bg-white border border-[#DFE5DF] rounded-lg p-8 text-center space-y-3 shadow-xs">
      <div className="w-10 h-10 rounded-full bg-[#F7F8F3] text-[#5C6E66] flex items-center justify-center mx-auto border border-[#DFE5DF]">
        <Layers className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#1A2421]">{title}</h3>
      <p className="text-xs text-[#5C6E66] max-w-sm mx-auto">{message}</p>
    </div>
  );
};
