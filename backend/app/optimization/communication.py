"""
Communication Node & Connectivity Matrix Model (Phase 4H).

Models relay communication masts and computes binary connectivity matrix A[i, j]
between sensors and communication hubs.
"""
from typing import List, Dict, Tuple
import math
from pydantic import BaseModel, Field
from app.schemas.candidate_schema import CandidateLocation
from app.optimization.coverage import haversine_km

class CommunicationNode(BaseModel):
    id: str
    label: str
    latitude: float
    longitude: float
    cost: float = 75000.0
    communication_range_km: float = 12.0

class ConnectivityModelResult(BaseModel):
    num_sensors: int
    num_comm_nodes: int
    connectivity_matrix: List[List[int]]
    uncovered_sensors: List[str]

class CommunicationConnectivityModel:
    def __init__(self, comm_range_km: float = 12.0):
        self.comm_range_km = comm_range_km

    def build_default_comm_nodes(self, basin_id: str) -> List[CommunicationNode]:
        if basin_id.lower() == "krishna":
            return [
                CommunicationNode(id="RL-KR-P1", label="Challapalli Mast", latitude=16.14, longitude=80.85),
                CommunicationNode(id="RL-KR-P2", label="Nagayalanka Mast", latitude=15.90, longitude=80.94),
                CommunicationNode(id="RL-KR-P3", label="Vuyyuru Mast", latitude=16.34, longitude=80.74),
            ]
        else: # godavari
            return [
                CommunicationNode(id="RL-GD-P1", label="Mummidivaram Mast", latitude=16.68, longitude=82.00),
                CommunicationNode(id="RL-GD-P2", label="Palakollu Mast", latitude=16.52, longitude=81.73),
                CommunicationNode(id="RL-GD-P3", label="Yanam Mast", latitude=16.66, longitude=82.18),
            ]

    def compute_connectivity_matrix(
        self,
        sensors: List[CandidateLocation],
        comm_nodes: List[CommunicationNode]
    ) -> ConnectivityModelResult:
        N = len(sensors)
        M = len(comm_nodes)
        A = [[0 for _ in range(M)] for _ in range(N)]
        uncovered = []

        for i in range(N):
            s = sensors[i]
            has_link = False
            for j in range(M):
                c = comm_nodes[j]
                d = haversine_km(s.latitude, s.longitude, c.latitude, c.longitude)
                if d <= self.comm_range_km:
                    A[i][j] = 1
                    has_link = True
            if not has_link:
                uncovered.append(s.id)

        return ConnectivityModelResult(
            num_sensors=N,
            num_comm_nodes=M,
            connectivity_matrix=A,
            uncovered_sensors=uncovered
        )
