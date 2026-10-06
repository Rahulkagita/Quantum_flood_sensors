from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation

class ScenarioRequest(BaseModel):
    basin_id: str = Field(..., description="Basin identifier (krishna | godavari)")
    rainfall_multiplier: float = Field(1.0, description="Multiplier applied to base rainfall (e.g. 1.25 for 25% increase)")
    rainfall_increase_mm: float = Field(0.0, description="Absolute rainfall increase in mm")
    sensor_count: int = Field(10, description="Number of candidate sensors to deploy in simulation")
    coverage_radius_km: float = Field(5.0, description="Effective coverage radius per sensor in km")

class CriticalZoneImpact(BaseModel):
    zone_name: str = Field(..., description="Name of the critical zone")
    baseline_risk: int = Field(..., description="Baseline risk score for zone")
    scenario_risk: int = Field(..., description="Simulated scenario risk score for zone")
    is_covered: bool = Field(..., description="Whether zone is within coverage radius of deployed sensors")

class ScenarioResponse(BaseModel):
    basin_id: str = Field(..., description="Basin identifier")
    simulation_type: str = Field("deterministic_scenario_simulation", description="Label explicitly identifying simulation")
    baseline_risk: int = Field(..., description="Baseline flood risk score (0-100)")
    scenario_risk: int = Field(..., description="Simulated scenario flood risk score (0-100)")
    risk_change: int = Field(..., description="Delta between scenario and baseline risk")
    coverage_ratio: float = Field(..., description="Ratio of high-exposure basin area covered by deployed sensors (0.0-1.0)")
    critical_zones: List[CriticalZoneImpact] = Field(..., description="Impact breakdown across critical zones")
    candidate_locations: List[CandidateLocation] = Field(..., description="Deployed candidate sensor sites in scenario")
