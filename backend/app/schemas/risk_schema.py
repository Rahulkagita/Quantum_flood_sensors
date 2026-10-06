from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskBreakdown(BaseModel):
    rainfall_score: float = Field(..., description="Normalized current rainfall score (0-100)")
    rainfall_anomaly_score: float = Field(..., description="Normalized rainfall anomaly score vs historical baseline (0-100)")
    population_exposure_score: float = Field(..., description="Normalized population exposure score (0-100)")
    rainfall_weight: float = Field(..., description="Weight applied to rainfall score")
    anomaly_weight: float = Field(..., description="Weight applied to anomaly score")
    exposure_weight: float = Field(..., description="Weight applied to population exposure score")

class FloodRiskEvaluation(BaseModel):
    basin_id: str = Field(..., description="Basin identifier (krishna | godavari)")
    risk_score: int = Field(..., description="Final composite risk score (0-100)")
    risk_level: str = Field(..., description="Risk level (LOW | MODERATE | HIGH | CRITICAL)")
    rainfall_mm: float = Field(..., description="3-day accumulated rainfall in mm")
    historical_avg_rainfall_mm: float = Field(..., description="Historical baseline average rainfall in mm")
    population_exposure_count: int = Field(..., description="Estimated population in high exposure zone")
    river_level: Optional[float] = Field(None, description="River gauge level (null if real dataset unavailable)")
    water_level_status: str = Field("unavailable (gauge dataset not supplied)", description="Status of river level telemetry")
    data_sources: List[str] = Field(..., description="List of authoritative raw datasets used")
    breakdown: RiskBreakdown = Field(..., description="Detailed breakdown of risk score calculation components")
    explanation: str = Field(..., description="Human-readable explanation of why this risk score was produced")
