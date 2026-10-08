"""
Ising Hamiltonian Mapper (Phase 3).

Converts binary QUBO decision variables x_i in {0, 1} to Pauli spin Z_i in {-1, +1}:
x_i = (1 - Z_i) / 2

Generates Pauli-Z single-qubit coefficients (h_i) and two-qubit ZZ coupling coefficients (J_ij).
"""
from typing import Dict, List, Tuple
import numpy as np
from pydantic import BaseModel, Field
from app.optimization.qubo import QuboFormulation

class IsingHamiltonian(BaseModel):
    num_qubits: int
    single_qubit_h: Dict[int, float]
    two_qubit_J: Dict[str, float]
    offset: float
    pauli_string_representation: List[str]

class IsingMapper:
    @staticmethod
    def map_qubo_to_ising(qubo) -> IsingHamiltonian:
        N = getattr(qubo, "num_candidates", getattr(qubo, "total_qubits", len(qubo.qubo_matrix)))
        Q = np.array(qubo.qubo_matrix, dtype=float)
        
        # Mathematical mapping derivations:
        # x_i = (1 - Z_i) / 2
        # Q_ii x_i = Q_ii / 2 - (Q_ii / 2) Z_i
        # Q_ij x_i x_j = Q_ij / 4 - (Q_ij / 4) Z_i - (Q_ij / 4) Z_j + (Q_ij / 4) Z_i Z_j
        
        h = np.zeros(N, dtype=float)
        J = np.zeros((N, N), dtype=float)
        const_offset = float(qubo.offset)

        # 1. Single-qubit terms h_i and constant shift
        for i in range(N):
            const_offset += Q[i, i] / 2.0
            h[i] -= Q[i, i] / 2.0

        # 2. Pairwise interaction terms J_ij
        for i in range(N):
            for j in range(i + 1, N):
                q_val = Q[i, j]
                const_offset += q_val / 4.0
                h[i] -= q_val / 4.0
                h[j] -= q_val / 4.0
                J[i, j] = q_val / 4.0

        h_dict = {i: round(float(h[i]), 4) for i in range(N)}
        J_dict = {f"{i},{j}": round(float(J[i, j]), 4) for i in range(N) for j in range(i + 1, N) if abs(J[i, j]) > 1e-6}

        pauli_strings = []
        for i, val in h_dict.items():
            if abs(val) > 1e-6:
                pauli_strings.append(f"{val:+.4f} * Z_{i}")

        for pair, val in J_dict.items():
            i, j = pair.split(",")
            pauli_strings.append(f"{val:+.4f} * Z_{i}Z_{j}")

        return IsingHamiltonian(
            num_qubits=N,
            single_qubit_h=h_dict,
            two_qubit_J=J_dict,
            offset=round(const_offset, 4),
            pauli_string_representation=pauli_strings
        )

    @staticmethod
    def evaluate_ising_energy(z_vec: np.ndarray, h_dict: Dict[int, float], J_dict: Dict[str, float], offset: float) -> float:
        energy = offset
        for i, val in h_dict.items():
            energy += val * z_vec[i]
        for pair, val in J_dict.items():
            i, j = map(int, pair.split(","))
            energy += val * z_vec[i] * z_vec[j]
        return energy
