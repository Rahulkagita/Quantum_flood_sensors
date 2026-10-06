"""
Unit tests for Phase 2C Scenario Engine:
- Baseline scenario test
- Increased rainfall scenario test (multiplier > 1.0)
- Reduced rainfall scenario test (multiplier < 1.0)
- Different sensor counts test
- Different coverage radius test
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.scenario_engine import ScenarioEngine
from app.schemas.scenario_schema import ScenarioRequest

def test_phase2c_scenario_engine():
    print("=== Testing Phase 2C ScenarioEngine ===")
    engine = ScenarioEngine()

    # 1. Test Baseline Scenario (multiplier = 1.0)
    print("\n--- 1. Test Baseline Scenario ---")
    req_base = ScenarioRequest(basin_id="krishna", rainfall_multiplier=1.0, sensor_count=5, coverage_radius_km=5.0)
    res_base = engine.run_simulation(req_base)
    print(json.dumps(res_base.model_dump(), indent=2))
    assert res_base.basin_id == "krishna"
    assert res_base.risk_change == 0
    assert res_base.simulation_type == "deterministic_scenario_simulation"

    # 2. Test Increased Rainfall Scenario (multiplier = 1.5, +20mm)
    print("\n--- 2. Test Increased Rainfall Scenario (1.5x + 20mm) ---")
    req_inc = ScenarioRequest(basin_id="godavari", rainfall_multiplier=1.5, rainfall_increase_mm=20.0, sensor_count=8, coverage_radius_km=5.0)
    res_inc = engine.run_simulation(req_inc)
    print(f"Baseline Risk: {res_inc.baseline_risk}, Scenario Risk: {res_inc.scenario_risk}, Change: +{res_inc.risk_change}")
    assert res_inc.scenario_risk > res_inc.baseline_risk
    assert res_inc.risk_change > 0

    # 3. Test Reduced Rainfall Scenario (multiplier = 0.5)
    print("\n--- 3. Test Reduced Rainfall Scenario (0.5x) ---")
    req_red = ScenarioRequest(basin_id="godavari", rainfall_multiplier=0.5, sensor_count=5, coverage_radius_km=5.0)
    res_red = engine.run_simulation(req_red)
    print(f"Baseline Risk: {res_red.baseline_risk}, Scenario Risk: {res_red.scenario_risk}, Change: {res_red.risk_change}")
    assert res_red.scenario_risk < res_red.baseline_risk
    assert res_red.risk_change < 0

    # 4. Test Different Sensor Counts (5 vs 12 sensors)
    print("\n--- 4. Test Different Sensor Counts ---")
    req_5 = ScenarioRequest(basin_id="krishna", sensor_count=5, coverage_radius_km=3.0)
    res_5 = engine.run_simulation(req_5)
    
    req_12 = ScenarioRequest(basin_id="krishna", sensor_count=12, coverage_radius_km=3.0)
    res_12 = engine.run_simulation(req_12)
    print(f"Coverage Ratio (5 sensors): {res_5.coverage_ratio}, (12 sensors): {res_12.coverage_ratio}")
    assert len(res_12.candidate_locations) > len(res_5.candidate_locations)
    assert res_12.coverage_ratio >= res_5.coverage_ratio

    # 5. Test Different Coverage Radius (3.0 km vs 15.0 km)
    print("\n--- 5. Test Different Coverage Radius ---")
    req_small = ScenarioRequest(basin_id="krishna", sensor_count=5, coverage_radius_km=3.0)
    res_small = engine.run_simulation(req_small)

    req_large = ScenarioRequest(basin_id="krishna", sensor_count=5, coverage_radius_km=15.0)
    res_large = engine.run_simulation(req_large)
    print(f"Coverage Ratio (3km radius): {res_small.coverage_ratio}, (15km radius): {res_large.coverage_ratio}")
    assert res_large.coverage_ratio >= res_small.coverage_ratio

    print("\nALL PHASE 2C SCENARIO ENGINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2c_scenario_engine()
