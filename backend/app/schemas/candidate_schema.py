from typing import List, Optional
from pydantic import BaseModel, Field

class CandidateLocation(BaseModel):
    id: str = Field(..., description="Unique candidate site identifier")
    basin_id: str = Field(..., description="Basin identifier (krishna | godavari)")
    latitude: float = Field(..., description="WGS84 latitude coordinate")
    longitude: float = Field(..., description="WGS84 longitude coordinate")
    risk_score: int = Field(..., description="Flood risk score at candidate site (0-100)")
    population_exposure: float = Field(..., description="Normalized population exposure index (0.0-1.0)")
    population_count: int = Field(..., description="Estimated population exposure count in buffer")
    priority: str = Field(..., description="Site priority level (LOW | MODERATE | HIGH | CRITICAL)")

class CandidateGenerationResponse(BaseModel):
    basin_id: str = Field(..., description="Basin identifier")
    total_candidates: int = Field(..., description="Number of candidate sites generated")
    min_spacing_km: float = Field(..., description="Minimum spacing constraint applied in km")
    candidates: List[CandidateLocation] = Field(..., description="List of generated candidate sensor locations")
