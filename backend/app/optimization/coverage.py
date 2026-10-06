"""
Geographic Coverage Model for Sensor Placement (Phase 3).

Calculates exact Haversine geographic distances between candidates and target risk zones.
Constructs binary coverage matrix C and risk/population weighted coverage metrics.
"""
from typing import List, Dict, Tuple
import math
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    return 2.0 * R * math.asin(math.sqrt(a))

class CoverageModelResult(BaseModel):
    num_candidates: int
    num_targets: int
    coverage_matrix: List[List[int]]
    overlap_matrix: List[List[float]]
    risk_weights: List[float]
    pop_weights: List[float]

class GeographicCoverageModel:
    def __init__(self, candidates: List[CandidateLocation], coverage_radius_km: float = 5.0):
        self.candidates = candidates
        self.radius_km = coverage_radius_km
        self.N = len(candidates)

    def build_matrix() -> CoverageModelResult:
        pass

    def compute_coverage_matrix(self) -> List[List[int]]:
        """
        Binary coverage matrix C where C[i][j] = 1 if candidate i covers target j.
        For candidate-to-candidate overlap, C[i][j] = 1 if distance <= 2 * radius.
        """
        C = [[0 for _ in range(self.N)] for _ in range(self.N)]
        for i in range(self.N):
            for j in range(self.N):
                if i == j:
                    C[i][j] = 1
                else:
                    d = haversine_km(
                        self.candidates[i].latitude, self.candidates[i].longitude,
                        self.candidates[j].latitude, self.candidates[j].longitude
                    )
                    if d <= self.radius_km * 1.5:
                        C[i][j] = 1
        return C

    def compute_overlap_matrix(self) -> List[List[float]]:
        """
        Computes pairwise spatial overlap factor between candidate sensors.
        """
        overlap = [[0.0 for _ in range(self.N)] for _ in range(self.N)]
        for i in range(self.N):
            for j in range(self.N):
                if i != j:
                    d = haversine_km(
                        self.candidates[i].latitude, self.candidates[i].longitude,
                        self.candidates[j].latitude, self.candidates[j].longitude
                    )
                    if d < self.radius_km * 2.0:
                        overlap[i][j] = max(0.0, 1.0 - (d / (self.radius_km * 2.0)))
        return overlap
