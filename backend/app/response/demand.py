"""
Spatial Response Demand Generator (Phase 4F).

Converts forecasted flood risk and WorldPop demographic density into spatial response demand scores.
Formula:
Demand = 0.50 * Forecasted_Risk + 0.35 * Population_Exposure + 0.15 * Early_Warning_Value
"""
from typing import List, Dict
import math
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation

class ResponseDemandPoint(BaseModel):
    candidate_id: str
    latitude: float
    longitude: float
    current_risk: int
    forecasted_risk: int
    population_count: int
    early_warning_importance: float
    response_demand_score: float

class SpatialResponseDemandEngine:
    def compute_demand(
        self,
        candidates: List[CandidateLocation],
        surge_probability: float
    ) -> List[ResponseDemandPoint]:
        demand_points = []
        for c in candidates:
            # Forecasted risk combines baseline current risk with predicted surge probability
            forecasted_risk = min(99, max(10, int(round(c.risk_score * (1.0 + surge_probability * 0.4)))))
            
            # Early warning importance is high for dense upstream/delta junctions
            early_warning_val = min(1.0, max(0.2, (c.population_exposure * 0.7 + (c.risk_score / 100.0) * 0.3)))
            
            # Composite Demand Score
            demand_score = (
                0.50 * forecasted_risk
                + 0.35 * (c.population_exposure * 100.0)
                + 0.15 * (early_warning_val * 100.0)
            )

            demand_points.append(
                ResponseDemandPoint(
                    candidate_id=c.id,
                    latitude=c.latitude,
                    longitude=c.longitude,
                    current_risk=c.risk_score,
                    forecasted_risk=forecasted_risk,
                    population_count=c.population_count,
                    early_warning_importance=round(early_warning_val, 2),
                    response_demand_score=round(demand_score, 2)
                )
            )
        return demand_points
