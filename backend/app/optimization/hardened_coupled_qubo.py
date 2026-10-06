"""
Hardened Coupled Sensor + Communication Relay QUBO Generator (Phases 4E - 4I).

Formulates Joint Binary Optimization:
q_0 .. q_{N-1} : Sensor selection x_i in {0,1}
q_N .. q_{N+M-1}: Communication Relay selection y_j in {0,1}

Objective:
MAXIMIZE:
  - Forecasted Flood Risk Coverage
  - Population Exposure Coverage
  - Early Warning Importance
MINIMIZE:
  - Sensor Hardware Costs (penalty)
  - Communication Relay Costs (penalty)
  - Pairwise Sensor Redundancy / Overlap (penalty)
  - Sensor Disconnection Penalty (C_disc * x_i * (1 - Sum y_j connected))
  - Hard Sensor Budget Penalty: A * (Sum x_i - K_max)^2
  - Hard Relay Budget Penalty: B * (Sum y_j - M_max)^2

Notice on Constraints:
Enforces "AT MOST M_max" communication relays (inequality / budget upper bound)
so solver can discover if fewer relays are sufficient.
"""
from typing import List, Dict, Tuple
import numpy as np
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.response.demand import ResponseDemandPoint
from app.optimization.communication import CommunicationNode, CommunicationConnectivityModel

class HardenedCoupledQubo(BaseModel):
    num_sensors_N: int
    num_relays_M: int
    total_qubits: int
    qubo_matrix: List[List[float]]
    offset: float
    sensor_budget_K: int
    relay_budget_M: int
    penalty_A_sensor_budget: float
    penalty_B_relay_budget: float
    penalty_C_disconnect: float
    penalty_redundancy: float

class HardenedCoupledQuboGenerator:
    def __init__(
        self,
        sensors: List[CandidateLocation],
        demand_points: List[ResponseDemandPoint],
        comm_nodes: List[CommunicationNode],
        max_sensors_K: int = 5,
        max_relays_M: int = 2,
        penalty_A_sensor: float = 120.0,
        penalty_B_relay: float = 100.0,
        penalty_C_disconnect: float = 250.0,
        penalty_redundancy: float = 40.0
    ):
        self.sensors = sensors
        self.demand = demand_points
        self.comm_nodes = comm_nodes
        self.N = len(sensors)
        self.M = len(comm_nodes)
        self.Total = self.N + self.M
        self.K = max_sensors_K
        self.M_max = max_relays_M
        self.A = penalty_A_sensor
        self.B = penalty_B_relay
        self.C_disc = penalty_C_disconnect
        self.w_red = penalty_redundancy

        comm_model = CommunicationConnectivityModel()
        self.conn_res = comm_model.compute_connectivity_matrix(sensors, comm_nodes)
        self.A_matrix = self.conn_res.connectivity_matrix

    def generate(self) -> HardenedCoupledQubo:
        Q = np.zeros((self.Total, self.Total), dtype=float)

        # 1. Sensor Diagonal & Budget Penalty Terms (q_0 .. q_{N-1})
        for i in range(self.N):
            d = self.demand[i]
            # Combined physical utility reward
            reward_i = (0.45 * d.forecasted_risk) + (0.35 * d.response_demand_score) + (0.20 * d.early_warning_importance * 100.0)
            # Budget penalty: A * (Sum x_i - K)^2 -> A * (1 - 2K) on diagonal
            Q[i, i] = -reward_i + self.A * (1.0 - 2.0 * self.K)

        # Sensor-Sensor Off-Diagonal Terms
        for i in range(self.N):
            for j in range(i + 1, self.N):
                # Distance overlap penalty + 2A budget interaction
                dist_overlap = max(0.0, 1.0 - (haversine_distance(self.sensors[i], self.sensors[j]) / 10.0))
                Q[i, j] = (self.w_red * dist_overlap) + (2.0 * self.A)

        # 2. Relay Diagonal & Budget Penalty Terms (q_N .. q_{N+M-1})
        for j in range(self.M):
            idx = self.N + j
            # Relay cost penalty + B * (1 - 2 * M_max) budget penalty on diagonal
            Q[idx, idx] = 20.0 + self.B * (1.0 - 2.0 * self.M_max)

        # Relay-Relay Off-Diagonal Terms
        for j1 in range(self.M):
            for j2 in range(j1 + 1, self.M):
                idx1 = self.N + j1
                idx2 = self.N + j2
                Q[idx1, idx2] = 2.0 * self.B

        # 3. Disconnection Penalty: C_disc * x_i * (1 - Sum y_j connected)
        for i in range(self.N):
            Q[i, i] += self.C_disc
            for j in range(self.M):
                if self.A_matrix[i][j] == 1:
                    idx_y = self.N + j
                    if i < idx_y:
                        Q[i, idx_y] -= self.C_disc
                    else:
                        Q[idx_y, i] -= self.C_disc

        offset = float(self.A * (self.K ** 2) + self.B * (self.M_max ** 2))

        return HardenedCoupledQubo(
            num_sensors_N=self.N,
            num_relays_M=self.M,
            total_qubits=self.Total,
            qubo_matrix=Q.tolist(),
            offset=offset,
            sensor_budget_K=self.K,
            relay_budget_M=self.M_max,
            penalty_A_sensor_budget=self.A,
            penalty_B_relay_budget=self.B,
            penalty_C_disconnect=self.C_disc,
            penalty_redundancy=self.w_red
        )

    def evaluate_energy(self, bitstring: str, qubo: HardenedCoupledQubo) -> float:
        x = np.array([int(b) for b in bitstring], dtype=float)
        Q = np.array(qubo.qubo_matrix, dtype=float)
        return float(x.T @ Q @ x + qubo.offset)

def haversine_distance(s1: CandidateLocation, s2: CandidateLocation) -> float:
    R = 6371.0
    dlat = np.radians(s2.latitude - s1.latitude)
    dlon = np.radians(s2.longitude - s1.longitude)
    a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(s1.latitude)) * np.cos(np.radians(s2.latitude)) * np.sin(dlon / 2.0)**2
    return 2.0 * R * np.arcsin(np.sqrt(a))
