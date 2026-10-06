"""
Coupled Sensor + Communication QUBO Generator (Phase 4I).

Formulates joint decision variables:
q_0 .. q_{N-1} : Sensor selections x_i in {0,1}
q_N .. q_{N+M-1}: Communication node selections y_j in {0,1}

Objective:
MAXIMIZE: Sensor Forecast Risk Coverage + Population Exposure + Early Warning Value
MINIMIZE: Sensor Cost + Comm Node Cost + Disconnected Sensor Penalties + Cardinality Penalties.
"""
from typing import List, Dict, Tuple
import numpy as np
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.response.demand import ResponseDemandPoint
from app.optimization.communication import CommunicationNode, CommunicationConnectivityModel

class CoupledQuboFormulation(BaseModel):
    num_sensors_N: int
    num_comm_nodes_M: int
    total_qubits: int
    qubo_matrix: List[List[float]]
    offset: float
    penalty_A_sensors: float
    penalty_B_comm: float
    penalty_C_disconnect: float

class CoupledQuboGenerator:
    def __init__(
        self,
        sensors: List[CandidateLocation],
        demand_points: List[ResponseDemandPoint],
        comm_nodes: List[CommunicationNode],
        max_sensors_K: int = 5,
        max_comm_M: int = 2,
        penalty_A: float = 120.0,
        penalty_B: float = 100.0,
        penalty_C_disconnect: float = 80.0
    ):
        self.sensors = sensors
        self.demand = demand_points
        self.comm_nodes = comm_nodes
        self.N = len(sensors)
        self.M = len(comm_nodes)
        self.Total = self.N + self.M
        self.K = max_sensors_K
        self.max_comm = max_comm_M
        self.A = penalty_A
        self.B = penalty_B
        self.C_disc = penalty_C_disconnect

        comm_model = CommunicationConnectivityModel()
        self.conn_res = comm_model.compute_connectivity_matrix(sensors, comm_nodes)
        self.A_matrix = self.conn_res.connectivity_matrix

    def generate(self) -> CoupledQuboFormulation:
        Q = np.zeros((self.Total, self.Total), dtype=float)

        # 1. Sensor Diagonal Terms (q_0 .. q_{N-1})
        for i in range(self.N):
            d = self.demand[i]
            # Reward for forecast risk + demand score
            reward_i = 0.6 * d.forecasted_risk + 0.4 * d.response_demand_score
            # Cardinality penalty: A * (Sum x_i - K)^2 -> A(1 - 2K) on diagonal
            Q[i, i] = -reward_i + self.A * (1.0 - 2.0 * self.K)

        # Sensor Off-diagonal Terms A * 2x_i x_j
        for i in range(self.N):
            for j in range(i + 1, self.N):
                Q[i, j] += 2.0 * self.A

        # 2. Comm Node Diagonal Terms (q_N .. q_{N+M-1})
        for j in range(self.M):
            idx = self.N + j
            # Cost penalty + Cardinality penalty B * (Sum y_j - M_max)^2
            Q[idx, idx] = 15.0 + self.B * (1.0 - 2.0 * self.max_comm)

        # Comm Node Off-diagonal Terms B * 2y_i y_j
        for j1 in range(self.M):
            for j2 in range(j1 + 1, self.M):
                idx1 = self.N + j1
                idx2 = self.N + j2
                Q[idx1, idx2] += 2.0 * self.B

        # 3. Disconnect Penalty: If sensor i is selected (x_i=1), at least one connected comm node j (y_j=1) must be active
        # Penalty: C_disc * x_i * (1 - Sum_{j connected} y_j)
        for i in range(self.N):
            # x_i term
            Q[i, i] += self.C_disc
            # -C_disc * x_i * y_j
            for j in range(self.M):
                if self.A_matrix[i][j] == 1:
                    idx_y = self.N + j
                    # Add to upper triangle
                    if i < idx_y:
                        Q[i, idx_y] -= self.C_disc
                    else:
                        Q[idx_y, i] -= self.C_disc

        offset = float(self.A * (self.K ** 2) + self.B * (self.max_comm ** 2))

        return CoupledQuboFormulation(
            num_sensors_N=self.N,
            num_comm_nodes_M=self.M,
            total_qubits=self.Total,
            qubo_matrix=Q.tolist(),
            offset=offset,
            penalty_A_sensors=self.A,
            penalty_B_comm=self.B,
            penalty_C_disconnect=self.C_disc
        )

    def evaluate_coupled_energy(self, bitstring: str, qubo: CoupledQuboFormulation) -> float:
        x = np.array([int(b) for b in bitstring], dtype=float)
        Q = np.array(qubo.qubo_matrix, dtype=float)
        return float(x.T @ Q @ x + qubo.offset)
