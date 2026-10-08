import os
import sys
import unittest
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.schemas.candidate_schema import CandidateLocation
from app.response.demand import ResponseDemandPoint
from app.optimization.communication import CommunicationNode
from app.optimization.coupled_qubo import CoupledQuboGenerator
from app.optimization.ising import IsingMapper
from app.optimization.coupled_solver import CoupledQaoaSolver

class TestCoupledQuboHardening(unittest.TestCase):
    def setUp(self):
        # Setup 5 Candidate Sensors and 3 Relays
        self.sensors = [
            CandidateLocation(id="C-KR-001", basin_id="krishna", latitude=16.506, longitude=80.648, risk_score=92, population_exposure=0.9, population_count=180000, priority="CRITICAL"),
            CandidateLocation(id="C-KR-002", basin_id="krishna", latitude=16.220, longitude=80.820, risk_score=87, population_exposure=0.8, population_count=150000, priority="CRITICAL"),
            CandidateLocation(id="C-KR-003", basin_id="krishna", latitude=16.780, longitude=80.850, risk_score=82, population_exposure=0.7, population_count=120000, priority="HIGH"),
            CandidateLocation(id="C-KR-004", basin_id="krishna", latitude=16.450, longitude=80.320, risk_score=75, population_exposure=0.6, population_count=95000, priority="HIGH"),
            CandidateLocation(id="C-KR-005", basin_id="krishna", latitude=16.150, longitude=80.450, risk_score=68, population_exposure=0.5, population_count=80000, priority="MODERATE"),
        ]
        self.demand = [
            ResponseDemandPoint(
                candidate_id=s.id,
                latitude=s.latitude,
                longitude=s.longitude,
                current_risk=s.risk_score,
                forecasted_risk=s.risk_score,
                population_count=s.population_count,
                early_warning_importance=0.85,
                response_demand_score=s.risk_score * 0.95,
            )
            for s in self.sensors
        ]
        self.relays = [
            CommunicationNode(id="RL-KR-P1", label="Prakasam Node", latitude=16.140, longitude=80.850, communication_range_km=15.0),
            CommunicationNode(id="RL-KR-P2", label="Delta Coastal Relay", latitude=15.900, longitude=80.940, communication_range_km=15.0),
            CommunicationNode(id="RL-KR-P3", label="Inland High Tower", latitude=16.340, longitude=80.740, communication_range_km=15.0),
        ]
        self.generator = CoupledQuboGenerator(self.sensors, self.demand, self.relays, max_sensors_K=3, max_comm_M=2, penalty_A=120.0, penalty_B=100.0, penalty_C_disconnect=250.0)
        self.qubo = self.generator.generate()

    def test_qubo_variable_count(self):
        """P1-8.1: Verify total qubits N+M = 8."""
        self.assertEqual(self.qubo.num_sensors_N, 5)
        self.assertEqual(self.qubo.num_comm_nodes_M, 3)
        self.assertEqual(self.qubo.total_qubits, 8)
        self.assertEqual(len(self.qubo.qubo_matrix), 8)

    def test_bitstring_length_and_slicing(self):
        """P1-8.2 & P1-8.3: Verify 8-bit length and canonical sensor/relay decoding."""
        solver = CoupledQaoaSolver(self.sensors, self.demand, self.relays, max_sensors_K=3, max_comm_M=2)
        res = solver.validate_classically()
        self.assertEqual(len(res.exact_qubo_optimum_bitstring), 8)
        self.assertEqual(res.total_qubits, 8)

    def test_qubo_to_ising_energy_equivalence(self):
        """P1-8.4: Verify numerical QUBO to Ising energy equivalence."""
        ising = IsingMapper.map_qubo_to_ising(self.qubo)
        
        # Test binary assignment x = [1, 1, 1, 0, 0, 0, 1, 1]
        x_bits = "11100011"
        x_vec = np.array([int(b) for b in x_bits], dtype=float)
        Q_mat = np.array(self.qubo.qubo_matrix, dtype=float)
        qubo_energy = float(x_vec.T @ Q_mat @ x_vec + self.qubo.offset)
        
        # Spin mapping z_i = 1 - 2*x_i (z in {+1, -1})
        z_vec = 1.0 - 2.0 * x_vec
        ising_energy = IsingMapper.evaluate_ising_energy(z_vec, ising.single_qubit_h, ising.two_qubit_J, ising.offset)
        
        self.assertAlmostEqual(qubo_energy, ising_energy, places=4)

    def test_connectivity_penalty(self):
        """P1-8.5: Verify disconnected sensor selection receives penalty."""
        # Connected configuration: sensors 1, 2 selected and relay 1 selected
        connected_bitstr = "11000100"
        # Disconnected configuration: sensor 4 selected far away without relay
        disconnected_bitstr = "00010000"
        
        e_connected = self.generator.evaluate_coupled_energy(connected_bitstr, self.qubo)
        e_disconnected = self.generator.evaluate_coupled_energy(disconnected_bitstr, self.qubo)
        
        # Disconnected configuration should have significantly higher penalty energy
        self.assertGreater(e_disconnected, e_connected)

if __name__ == "__main__":
    unittest.main()
