import React, { createContext, useContext, useState, useEffect } from "react";
import {
  fetchBasinRisk,
  RiskEvaluationData,
  fetchCandidates,
  CandidateResponseData,
} from "./api-client";

export type BasinId = "krishna" | "godavari";

interface BasinContextType {
  basinId: BasinId;
  setBasinId: (id: BasinId) => void;
  scenario: string;
  setScenario: (sc: string) => void;
  riskData: RiskEvaluationData | null;
  candidateData: CandidateResponseData | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BasinContext = createContext<BasinContextType | undefined>(undefined);

export const BasinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [basinId, setBasinId] = useState<BasinId>("krishna");
  const [scenario, setScenario] = useState<string>("MONSOON_SURGE");
  const [riskData, setRiskData] = useState<RiskEvaluationData | null>(null);
  const [candidateData, setCandidateData] = useState<CandidateResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [rData, cData] = await Promise.all([fetchBasinRisk(basinId), fetchCandidates(basinId)]);
      setRiskData(rData);
      setCandidateData(cData);
    } catch (e) {
      console.error("Error loading basin context data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [basinId]);

  return (
    <BasinContext.Provider
      value={{
        basinId,
        setBasinId,
        scenario,
        setScenario,
        riskData,
        candidateData,
        loading,
        refresh: refreshData,
      }}
    >
      {children}
    </BasinContext.Provider>
  );
};

export const useBasin = () => {
  const ctx = useContext(BasinContext);
  if (!ctx) throw new Error("useBasin must be used within a BasinProvider");
  return ctx;
};
