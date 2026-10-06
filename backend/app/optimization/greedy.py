"""
Classical Greedy Baseline Optimizer (Phase 3).

Serves as the benchmark heuristic to compare against QAOA and Exact solvers.
Uses identical objective function and constraint logic.
"""
from typing import List, Dict, Tuple
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.optimization.qubo import QuboGenerator

class GreedyResult(BaseModel):
    selected_candidate_ids: List[str]
    selected_indices: List[int]
    bitstring: str
    objective_value: float
    qubo_energy: float
    execution_time_ms: float

class ClassicalGreedyOptimizer:
    def __init__(self, candidates: List[CandidateLocation], target_sensors: int):
        self.candidates = candidates
        self.N = len(candidates)
        self.K = target_sensors
        self.qubo_gen = QuboGenerator(candidates, target_sensors)
        self.qubo = self.qubo_gen.generate()

    def solve(self) -> GreedyResult:
        import time
        t0 = time.perf_counter()

        selected: List[int] = []
        candidates_pool = list(range(self.N))

        while len(selected) < self.K and candidates_pool:
            best_idx = -1
            best_incremental_gain = float('-inf')

            for idx in candidates_pool:
                cand = self.candidates[idx]
                gain = (self.qubo_gen.w_risk * cand.risk_score) + (self.qubo_gen.w_pop * cand.population_exposure * 100.0)
                
                # Penalty for overlap with already selected
                overlap_pen = 0.0
                for sel in selected:
                    overlap_pen += self.qubo_gen.overlap_matrix[idx][sel] * 25.0

                net_gain = gain - (self.qubo_gen.w_redundant * overlap_pen)
                if net_gain > best_incremental_gain:
                    best_incremental_gain = net_gain
                    best_idx = idx

            if best_idx != -1:
                selected.append(best_idx)
                candidates_pool.remove(best_idx)
            else:
                break

        bitstring_chars = ['0'] * self.N
        for idx in selected:
            bitstring_chars[idx] = '1'
        bitstring = "".join(bitstring_chars)

        t1 = time.perf_counter()
        exec_ms = (t1 - t0) * 1000.0

        energy = self.qubo_gen.evaluate_energy(bitstring, self.qubo)

        # Compute physical objective
        risk_sum = sum(self.candidates[i].risk_score for i in selected)
        pop_sum = sum(self.candidates[i].population_exposure * 100.0 for i in selected)
        overlap_sum = 0.0
        for i in range(len(selected)):
            for j in range(i + 1, len(selected)):
                s1, s2 = selected[i], selected[j]
                overlap_sum += self.qubo_gen.overlap_matrix[s1][s2] * 25.0

        objective = (self.qubo_gen.w_risk * risk_sum) + (self.qubo_gen.w_pop * pop_sum) - (self.qubo_gen.w_redundant * overlap_sum)

        return GreedyResult(
            selected_candidate_ids=[self.candidates[i].id for i in selected],
            selected_indices=selected,
            bitstring=bitstring,
            objective_value=round(float(objective), 2),
            qubo_energy=round(float(energy), 2),
            execution_time_ms=round(exec_ms, 3)
        )
