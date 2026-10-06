"""
QUBO Ground-Truth Classical Validator (Phase 3).

Exhaustively enumerates all 2^N binary bitstrings for small N (N <= 14).
Validates that QUBO energy minimum exactly matches the original objective maximum.
"""
from typing import List, Dict, Tuple
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.optimization.qubo import QuboGenerator, QuboFormulation

class ValidationResult(BaseModel):
    is_valid: bool
    num_solutions_evaluated: int
    exact_qubo_optimum_bitstring: str
    exact_qubo_optimum_energy: float
    exact_original_optimum_bitstring: str
    exact_original_optimum_objective: float
    rankings_agree: bool
    explanation: str

class QuboValidator:
    def __init__(self, candidates: List[CandidateLocation], target_sensors: int):
        self.candidates = candidates
        self.N = len(candidates)
        self.K = target_sensors
        self.qubo_gen = QuboGenerator(candidates, target_sensors)
        self.qubo = self.qubo_gen.generate()

    def calculate_original_objective(self, bitstring: str) -> Tuple[float, bool]:
        """
        Computes the unconstrained physical objective for a bitstring:
        Risk + Population - Overlap penalties, with hard constraint flag Sum(x_i) == K.
        """
        selected_indices = [i for i, b in enumerate(bitstring) if b == '1']
        cardinality = len(selected_indices)
        is_feasible = (cardinality == self.K)

        if not selected_indices:
            return 0.0, is_feasible

        risk_sum = sum(self.candidates[i].risk_score for i in selected_indices)
        pop_sum = sum(self.candidates[i].population_exposure * 100.0 for i in selected_indices)

        overlap_penalty = 0.0
        for idx1 in range(len(selected_indices)):
            for idx2 in range(idx1 + 1, len(selected_indices)):
                i, j = selected_indices[idx1], selected_indices[idx2]
                overlap_penalty += self.qubo_gen.overlap_matrix[i][j] * 25.0

        objective = (self.qubo_gen.w_risk * risk_sum) + (self.qubo_gen.w_pop * pop_sum) - (self.qubo_gen.w_redundant * overlap_penalty)
        return float(objective), is_feasible

    def validate(self) -> ValidationResult:
        if self.N > 14:
            raise ValueError(f"Brute force validation restricted to N <= 14 (got N={self.N})")

        total_solutions = 1 << self.N
        best_qubo_energy = float('inf')
        best_qubo_bitstring = ""

        best_original_obj = float('-inf')
        best_original_bitstring = ""

        for integer_val in range(total_solutions):
            bitstring = format(integer_val, f'0{self.N}b')
            energy = self.qubo_gen.evaluate_energy(bitstring, self.qubo)
            obj, is_feasible = self.calculate_original_objective(bitstring)

            if energy < best_qubo_energy:
                best_qubo_energy = energy
                best_qubo_bitstring = bitstring

            if is_feasible and obj > best_original_obj:
                best_original_obj = obj
                best_original_bitstring = bitstring

        rankings_agree = (best_qubo_bitstring == best_original_bitstring)
        is_valid = rankings_agree

        explanation = (
            f"Evaluated all {total_solutions} solutions. "
            f"QUBO energy minimum bitstring: {best_qubo_bitstring} (Energy: {best_qubo_energy:.2f}). "
            f"Original physical objective maximum bitstring: {best_original_bitstring} (Objective: {best_original_obj:.2f}). "
            f"Validation result: {'PASSED (Optima match 100%)' if is_valid else 'FAILED (Mismatch detected)'}."
        )

        return ValidationResult(
            is_valid=is_valid,
            num_solutions_evaluated=total_solutions,
            exact_qubo_optimum_bitstring=best_qubo_bitstring,
            exact_qubo_optimum_energy=best_qubo_energy,
            exact_original_optimum_bitstring=best_original_bitstring,
            exact_original_optimum_objective=best_original_obj,
            rankings_agree=rankings_agree,
            explanation=explanation
        )
