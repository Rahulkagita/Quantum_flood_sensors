"""
QUBO Generator for Sensor Placement (Phase 3).

Formulates Q(x) = x^T Q x + offset for sensor selection.
Maximizes risk coverage & population exposure while penalizing redundant coverage
and enforcing hard cardinality constraint (Sum x_i = K)^2.
"""
from typing import List, Tuple, Dict
import numpy as np
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.optimization.coverage import GeographicCoverageModel

class QuboFormulation(BaseModel):
    num_candidates: int
    target_sensors: int
    qubo_matrix: List[List[float]]
    offset: float
    linear_terms: Dict[int, float]
    quadratic_terms: Dict[str, float]

class QuboGenerator:
    def __init__(
        self,
        candidates: List[CandidateLocation],
        target_sensors: int,
        w_risk: float = 1.0,
        w_pop: float = 0.8,
        w_redundant: float = 0.5,
        penalty_A: float = 150.0,
        coverage_radius_km: float = 5.0
    ):
        self.candidates = candidates
        self.N = len(candidates)
        self.K = target_sensors
        self.w_risk = w_risk
        self.w_pop = w_pop
        self.w_redundant = w_redundant
        self.A = penalty_A
        self.cov_model = GeographicCoverageModel(candidates, coverage_radius_km)
        self.overlap_matrix = self.cov_model.compute_overlap_matrix()

    def generate(self) -> QuboFormulation:
        Q = np.zeros((self.N, self.N), dtype=float)
        
        # 1. Linear diagonal terms: -Reward_i + A * (1 - 2K)
        linear_terms = {}
        for i in range(self.N):
            c = self.candidates[i]
            reward_i = (self.w_risk * c.risk_score) + (self.w_pop * c.population_exposure * 100.0)
            diag_val = -reward_i + self.A * (1.0 - 2.0 * self.K)
            Q[i, i] = diag_val
            linear_terms[i] = round(float(diag_val), 4)

        # 2. Quadratic off-diagonal terms: w_redundant * overlap_ij + 2A
        quadratic_terms = {}
        for i in range(self.N):
            for j in range(i + 1, self.N):
                off_val = (self.w_redundant * self.overlap_matrix[i][j] * 50.0) + (2.0 * self.A)
                Q[i, j] = off_val
                quadratic_terms[f"{i},{j}"] = round(float(off_val), 4)

        offset = float(self.A * (self.K ** 2))

        return QuboFormulation(
            num_candidates=self.N,
            target_sensors=self.K,
            qubo_matrix=Q.tolist(),
            offset=offset,
            linear_terms=linear_terms,
            quadratic_terms=quadratic_terms
        )

    def evaluate_energy(self, bitstring: str, qubo: QuboFormulation) -> float:
        """
        Computes Q(x) energy for a given binary bitstring.
        """
        x = np.array([int(b) for b in bitstring], dtype=float)
        Q = np.array(qubo.qubo_matrix, dtype=float)
        energy = float(x.T @ Q @ x + qubo.offset)
        return energy
