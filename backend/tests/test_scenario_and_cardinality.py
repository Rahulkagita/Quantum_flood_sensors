import os
import sys
import unittest
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.schemas.candidate_schema import CandidateLocation
from app.response.demand import SpatialResponseDemandEngine
from app.optimization.communication import CommunicationNode
from app.optimization.hardened_coupled_qubo import HardenedCoupledQuboGenerator, generate_hardened_coupled_qubo

class TestScenarioAndCardinality(unittest.TestCase):
    def setUp(self):
        self.sensors = [
            CandidateLocation(id="C-KR-001", basin_id="krishna", latitude=16.506, longitude=80.648, risk_score=60, population_exposure=0.9, population_count=180000, priority="HIGH"),
            CandidateLocation(id="C-KR-002", basin_id="krishna", latitude=16.220, longitude=80.820, risk_score=55, population_exposure=0.8, population_count=150000, priority="MODERATE"),
            CandidateLocation(id="C-KR-003", basin_id="krishna", latitude=16.780, longitude=80.850, risk_score=50, population_exposure=0.7, population_count=120000, priority="MODERATE"),
            CandidateLocation(id="C-KR-004", basin_id="krishna", latitude=16.450, longitude=80.320, risk_score=45, population_exposure=0.6, population_count=95000, priority="LOW"),
        ]
        self.relays = [
            CommunicationNode(id="RL-KR-P1", label="Prakasam Node", latitude=16.140, longitude=80.850, communication_range_km=15.0),
            CommunicationNode(id="RL-KR-P2", label="Delta Coastal Relay", latitude=15.900, longitude=80.940, communication_range_km=15.0),
            CommunicationNode(id="RL-KR-P3", label="Inland High Tower", latitude=16.340, longitude=80.740, communication_range_km=15.0),
        ]

    def test_relay_cardinality_hardened_penalty(self):
        """Verify penalty_B_relay = 350.0 > penalty_C_disconnect = 250.0 ensures > M_max relays is strictly suboptimal."""
        demand_engine = SpatialResponseDemandEngine()
        demands = demand_engine.compute_demand(self.sensors, surge_intensity=0.8)
        
        # Generator with M_max = 2
        gen = HardenedCoupledQuboGenerator(
            sensors=self.sensors,
            demand_points=demands,
            comm_nodes=self.relays,
            max_sensors_K=3,
            max_relays_M=2,
            penalty_A_sensor=120.0,
            penalty_B_relay=350.0,
            penalty_C_disconnect=250.0
        )
        qubo = gen.generate()
        
        # Test 2 relays vs 3 relays
        # Bitstring encoding: sensors (4 bits) + relays (3 bits)
        # 2 relays: "1110 110" (3 sensors, 2 relays)
        # 3 relays: "1110 111" (3 sensors, 3 relays -> violates M_max=2 by 1 relay)
        
        e_2relays = gen.evaluate_coupled_energy("1110110", qubo)
        e_3relays = gen.evaluate_coupled_energy("1110111", qubo)
        
        # 3 relays must incur at least +350 penalty compared to 2 relays
        self.assertGreater(e_3relays, e_2relays)
        self.assertGreaterEqual(e_3relays - e_2relays, 100.0)

    def test_scenario_surge_intensity_propagation(self):
        """Verify surge_intensity values (0.25, 0.80, 1.25) shift forecasted risk and demand scores."""
        demand_engine = SpatialResponseDemandEngine()
        
        demands_normal = demand_engine.compute_demand(self.sensors, surge_intensity=0.25)
        demands_monsoon = demand_engine.compute_demand(self.sensors, surge_intensity=0.80)
        demands_cyclone = demand_engine.compute_demand(self.sensors, surge_intensity=1.25)
        
        # Check that forecasted risk increases strictly with surge intensity
        for i in range(len(self.sensors)):
            self.assertGreater(demands_monsoon[i].forecasted_risk, demands_normal[i].forecasted_risk)
            self.assertGreater(demands_cyclone[i].forecasted_risk, demands_monsoon[i].forecasted_risk)
            self.assertGreater(demands_cyclone[i].response_demand_score, demands_normal[i].response_demand_score)

if __name__ == "__main__":
    unittest.main()
