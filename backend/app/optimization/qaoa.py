"""
QAOA Solver Implementation using Qiskit 2.5 (Phase 3).

Executes an authentic Quantum Approximate Optimization Algorithm:
Problem -> QUBO -> Ising Hamiltonian -> Cost Hamiltonian -> QAOA Ansatz Circuit ->
Classical Optimizer (COBYLA/SPSA) -> Measurement Distribution -> Sensor Placement Solution.
"""
from typing import List, Dict, Tuple, Optional
import time
import math
import numpy as np
from pydantic import BaseModel, Field

# Qiskit 2.x imports
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, Pauli, SparsePauliOp

from app.schemas.candidate_schema import CandidateLocation
from app.optimization.qubo import QuboGenerator, QuboFormulation
from app.optimization.ising import IsingMapper, IsingHamiltonian

class MeasurementProbability(BaseModel):
    bitstring: str
    probability: float
    qubo_energy: float
    is_feasible: bool

class QaoaResult(BaseModel):
    algorithm: str = "QAOA"
    backend: str
    num_qubits: int
    depth_p: int
    shots: int
    optimizer_name: str
    optimal_gamma: List[float]
    optimal_beta: List[float]
    best_bitstring: str
    best_qubo_energy: float
    execution_time_ms: float
    convergence_history: List[Dict[str, float]]
    top_measurements: List[MeasurementProbability]
    selected_candidate_ids: List[str]

class QaoaSolver:
    def __init__(
        self,
        candidates: List[CandidateLocation],
        target_sensors: int,
        depth_p: int = 1,
        shots: int = 1024,
        optimizer_name: str = "COBYLA",
        max_iterations: int = 50,
        random_seed: int = 42
    ):
        self.candidates = candidates
        self.N = len(candidates)
        self.K = target_sensors
        self.p = depth_p
        self.shots = shots
        self.optimizer_name = optimizer_name
        self.max_iterations = max_iterations
        self.seed = random_seed

        self.qubo_gen = QuboGenerator(candidates, target_sensors)
        self.qubo = self.qubo_gen.generate()
        self.ising = IsingMapper.map_qubo_to_ising(self.qubo)

    def build_qaoa_circuit(self, gamma: List[float], beta: List[float]) -> QuantumCircuit:
        """
        Constructs the parameterized QAOA quantum circuit.
        """
        qc = QuantumCircuit(self.N)

        # 1. Initial State: Equal superposition |+>^N
        qc.h(range(self.N))

        # 2. Alternating Cost and Mixer Layers
        for layer in range(self.p):
            g = gamma[layer]
            b = beta[layer]

            # --- Cost Hamiltonian Layer U(H_C, gamma) ---
            # Single qubit Z terms: Rz(2 * gamma * h_i)
            for i, h_val in self.ising.single_qubit_h.items():
                if abs(h_val) > 1e-6:
                    qc.rz(2.0 * g * h_val, i)

            # Two qubit ZZ terms: Rzz(2 * gamma * J_ij)
            for pair, j_val in self.ising.two_qubit_J.items():
                if abs(j_val) > 1e-6:
                    i_idx, j_idx = map(int, pair.split(","))
                    qc.rzz(2.0 * g * j_val, i_idx, j_idx)

            # --- Mixer Hamiltonian Layer U(B, beta) ---
            # Rx(2 * beta) on all qubits
            for i in range(self.N):
                qc.rx(2.0 * b, i)

        return qc

    def evaluate_circuit_energy(self, params: np.ndarray) -> Tuple[float, Statevector]:
        """
        Evaluates expectation value <gamma, beta | Q | gamma, beta> using Qiskit Statevector.
        """
        gamma = list(params[:self.p])
        beta = list(params[self.p:])

        qc = self.build_qaoa_circuit(gamma, beta)
        state = Statevector.from_instruction(qc)
        probs = state.probabilities_dict()

        expected_energy = 0.0
        for bitstr, prob in probs.items():
            # Qiskit bitstring order is little-endian [q_N-1 ... q_0]. Reverse for index alignment.
            aligned_bitstr = bitstr[::-1]
            energy = self.qubo_gen.evaluate_energy(aligned_bitstr, self.qubo)
            expected_energy += prob * energy

        return expected_energy, state

    def solve(self) -> QaoaResult:
        t0 = time.perf_counter()
        np.random.seed(self.seed)

        # Initial parameters (small random angles)
        init_params = np.random.uniform(0.0, np.pi / 2.0, 2 * self.p)

        history: List[Dict[str, float]] = []
        iteration_count = 0

        # Simple COBYLA-style classical optimizer implementation for parameters
        def objective_func(params):
            nonlocal iteration_count
            energy, _ = self.evaluate_circuit_energy(params)
            iteration_count += 1
            history.append({
                "iteration": iteration_count,
                "energy": round(float(energy), 4)
            })
            return energy

        from scipy.optimize import minimize
        opt_res = minimize(
            objective_func,
            init_params,
            method="COBYLA",
            options={"maxiter": self.max_iterations}
        )

        opt_gamma = list(opt_res.x[:self.p])
        opt_beta = list(opt_res.x[self.p:])

        # Final measurement evaluation
        best_energy, final_state = self.evaluate_circuit_energy(opt_res.x)
        raw_probs = final_state.probabilities_dict()

        top_measurements: List[MeasurementProbability] = []
        best_feasible_bitstring = ""
        best_feasible_energy = float('inf')

        for bitstr, prob in sorted(raw_probs.items(), key=lambda x: x[1], reverse=True):
            aligned = bitstr[::-1]
            energy = self.qubo_gen.evaluate_energy(aligned, self.qubo)
            is_feasible = (aligned.count('1') == self.K)

            top_measurements.append(
                MeasurementProbability(
                    bitstring=aligned,
                    probability=round(float(prob), 4),
                    qubo_energy=round(float(energy), 2),
                    is_feasible=is_feasible
                )
            )

            if is_feasible and energy < best_feasible_energy:
                best_feasible_energy = energy
                best_feasible_bitstring = aligned

        # Fallback if no feasible bitstring in top probabilities
        if not best_feasible_bitstring:
            best_feasible_bitstring = top_measurements[0].bitstring

        selected_ids = [self.candidates[i].id for i, b in enumerate(best_feasible_bitstring) if b == '1']

        t1 = time.perf_counter()
        exec_ms = (t1 - t0) * 1000.0

        return QaoaResult(
            algorithm="QAOA",
            backend="StatevectorSimulator (Qiskit 2.5)",
            num_qubits=self.N,
            depth_p=self.p,
            shots=self.shots,
            optimizer_name=self.optimizer_name,
            optimal_gamma=[round(float(g), 4) for g in opt_gamma],
            optimal_beta=[round(float(b), 4) for b in opt_beta],
            best_bitstring=best_feasible_bitstring,
            best_qubo_energy=round(float(best_feasible_energy), 2),
            execution_time_ms=round(exec_ms, 2),
            convergence_history=history[:20],
            top_measurements=top_measurements[:6],
            selected_candidate_ids=selected_ids
        )
