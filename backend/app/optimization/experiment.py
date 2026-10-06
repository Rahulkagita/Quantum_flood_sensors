"""
Quantum Experiment Manager (Phase 3).

Orchestrates comparisons between Exact Brute-Force, QAOA Quantum, and Classical Greedy.
Computes real approximation ratio and optimality gap without manufacturing numbers.
"""
from typing import List, Dict, Optional, Any
import time
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.optimization.qubo import QuboGenerator
from app.optimization.qubo_validator import QuboValidator
from app.optimization.greedy import ClassicalGreedyOptimizer
from app.optimization.qaoa import QaoaSolver, QaoaResult

class ExperimentComparisonResult(BaseModel):
    experiment_id: str
    num_candidates_N: int
    target_sensors_K: int
    qaoa_depth_p: int
    num_qubits: int
    backend: str
    shots: int
    exact_optimum_bitstring: str
    exact_optimum_objective: float
    exact_optimum_energy: float
    greedy_optimum_bitstring: str
    greedy_optimum_objective: float
    greedy_optimum_energy: float
    qaoa_optimum_bitstring: str
    qaoa_optimum_objective: float
    qaoa_optimum_energy: float
    approximation_ratio: float
    optimality_gap_percent: float
    greedy_approximation_ratio: float
    qaoa_execution_time_ms: float
    greedy_execution_time_ms: float
    qubo_rankings_agree_with_exact: bool
    qaoa_top_measurements: List[Dict[str, Any]]

class QuantumExperimentManager:
    def __init__(self, candidates: List[CandidateLocation], target_sensors: int):
        self.candidates = candidates
        self.N = len(candidates)
        self.K = target_sensors
        self.qubo_gen = QuboGenerator(candidates, target_sensors)
        self.qubo = self.qubo_gen.generate()

    def run_experiment(
        self,
        experiment_id: str = "EXP-001",
        depth_p: int = 1,
        shots: int = 1024,
        max_iterations: int = 40
    ) -> ExperimentComparisonResult:
        """
        Runs complete benchmark pipeline across Exact, Greedy, and QAOA.
        """
        # 1. Exact Brute Force Ground Truth
        validator = QuboValidator(self.candidates, self.K)
        val_res = validator.validate()

        # 2. Classical Greedy Baseline
        greedy_opt = ClassicalGreedyOptimizer(self.candidates, self.K)
        greedy_res = greedy_opt.solve()

        # 3. Authentic QAOA Quantum Execution
        qaoa_solver = QaoaSolver(
            candidates=self.candidates,
            target_sensors=self.K,
            depth_p=depth_p,
            shots=shots,
            max_iterations=max_iterations
        )
        qaoa_res = qaoa_solver.solve()

        # Physical objective for QAOA best bitstring
        qaoa_obj, _ = validator.calculate_original_objective(qaoa_res.best_bitstring)

        # Exact ratios & gaps computation
        exact_obj = val_res.exact_original_optimum_objective
        if exact_obj > 0:
            approx_ratio = round(qaoa_obj / exact_obj, 4)
            greedy_approx_ratio = round(greedy_res.objective_value / exact_obj, 4)
            gap_percent = round((1.0 - approx_ratio) * 100.0, 2)
        else:
            approx_ratio = 1.0
            greedy_approx_ratio = 1.0
            gap_percent = 0.0

        top_meas = [m.model_dump() for m in qaoa_res.top_measurements]

        return ExperimentComparisonResult(
            experiment_id=experiment_id,
            num_candidates_N=self.N,
            target_sensors_K=self.K,
            qaoa_depth_p=depth_p,
            num_qubits=self.N,
            backend=qaoa_res.backend,
            shots=shots,
            exact_optimum_bitstring=val_res.exact_original_optimum_bitstring,
            exact_optimum_objective=round(exact_obj, 2),
            exact_optimum_energy=round(val_res.exact_qubo_optimum_energy, 2),
            greedy_optimum_bitstring=greedy_res.bitstring,
            greedy_optimum_objective=greedy_res.objective_value,
            greedy_optimum_energy=greedy_res.qubo_energy,
            qaoa_optimum_bitstring=qaoa_res.best_bitstring,
            qaoa_optimum_objective=round(qaoa_obj, 2),
            qaoa_optimum_energy=qaoa_res.best_qubo_energy,
            approximation_ratio=approx_ratio,
            optimality_gap_percent=gap_percent,
            greedy_approximation_ratio=greedy_approx_ratio,
            qaoa_execution_time_ms=qaoa_res.execution_time_ms,
            greedy_execution_time_ms=greedy_res.execution_time_ms,
            qubo_rankings_agree_with_exact=val_res.rankings_agree,
            qaoa_top_measurements=top_meas
        )
