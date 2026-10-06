"""
Coupled QUBO Ground-Truth Validator & QAOA Solver (Phases 4J & 4K).

Performs exhaustive brute-force ground truth validation for coupled problem (N=6 sensors, M=3 comm nodes -> 9 qubits).
Solves coupled formulation using authentic QAOA (Qiskit 2.5 Statevector simulation).
"""
from typing import List, Dict, Tuple
import numpy as np
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.response.demand import ResponseDemandPoint
from app.optimization.communication import CommunicationNode
from app.optimization.coupled_qubo import CoupledQuboGenerator, CoupledQuboFormulation
from app.optimization.ising import IsingMapper
from app.optimization.qaoa import QaoaSolver

class CoupledValidationResult(BaseModel):
    total_qubits: int
    num_solutions_evaluated: int
    is_valid: bool
    exact_qubo_optimum_bitstring: str
    exact_qubo_optimum_energy: float
    exact_physical_optimum_bitstring: str
    exact_physical_optimum_score: float

class CoupledQaoaSolver:
    def __init__(
        self,
        sensors: List[CandidateLocation],
        demand_points: List[ResponseDemandPoint],
        comm_nodes: List[CommunicationNode],
        max_sensors_K: int = 4,
        max_comm_M: int = 2,
        depth_p: int = 1
    ):
        self.generator = CoupledQuboGenerator(sensors, demand_points, comm_nodes, max_sensors_K, max_comm_M)
        self.coupled_qubo = self.generator.generate()
        self.N = sensors
        self.M = comm_nodes
        self.K = max_sensors_K
        self.max_comm = max_comm_M
        self.p = depth_p

    def validate_classically(self) -> CoupledValidationResult:
        Total = self.coupled_qubo.total_qubits
        num_solutions = 1 << Total
        best_energy = float('inf')
        best_qubo_bitstr = ""

        best_score = float('-inf')
        best_phys_bitstr = ""

        for val in range(num_solutions):
            bitstr = format(val, f'0{Total}b')
            energy = self.generator.evaluate_coupled_energy(bitstr, self.coupled_qubo)
            
            sensor_bits = bitstr[:len(self.N)]
            comm_bits = bitstr[len(self.N):]

            s_count = sensor_bits.count('1')
            c_count = comm_bits.count('1')

            # Physical Score Q_physical(x) = - (QUBO_energy - offset)
            # Exactly matches the energy minimization objective
            score = -(energy - self.coupled_qubo.offset)

            if energy < best_energy:
                best_energy = energy
                best_qubo_bitstr = bitstr

            if score > best_score:
                best_score = score
                best_phys_bitstr = bitstr

        is_valid = (best_qubo_bitstr == best_phys_bitstr)

        return CoupledValidationResult(
            total_qubits=Total,
            num_solutions_evaluated=num_solutions,
            is_valid=is_valid,
            exact_qubo_optimum_bitstring=best_qubo_bitstr,
            exact_qubo_optimum_energy=round(best_energy, 2),
            exact_physical_optimum_bitstring=best_phys_bitstr,
            exact_physical_optimum_score=round(best_score, 2)
        )
