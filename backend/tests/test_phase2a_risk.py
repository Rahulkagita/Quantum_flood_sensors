"""
Unit tests for Phase 2A Flood Risk Engine:
- Verifies Krishna risk calculation
- Verifies Godavari risk calculation
- Verifies low rainfall conditions
- Verifies high rainfall conditions
- Verifies missing/unavailable river level data (river_level is None)
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.flood_risk import ConfigurableFloodRiskEngine

def test_phase2a_flood_risk():
    print("=== Testing Phase 2A ConfigurableFloodRiskEngine ===")
    engine = ConfigurableFloodRiskEngine()

    # 1. Test Krishna Basin
    print("\n--- 1. Test Krishna Basin ---")
    krishna_eval = engine.evaluate_basin_risk("krishna", year=2024)
    print(json.dumps(krishna_eval.model_dump(), indent=2))
    assert krishna_eval.basin_id == "krishna"
    assert 0 <= krishna_eval.risk_score <= 100
    assert krishna_eval.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert krishna_eval.river_level is None
    assert "IMD rainfall NetCDF" in krishna_eval.data_sources[0]

    # 2. Test Godavari Basin
    print("\n--- 2. Test Godavari Basin ---")
    godavari_eval = engine.evaluate_basin_risk("godavari", year=2024)
    print(json.dumps(godavari_eval.model_dump(), indent=2))
    assert godavari_eval.basin_id == "godavari"
    assert 0 <= godavari_eval.risk_score <= 100
    assert godavari_eval.river_level is None

    # 3. Test Low Rainfall Conditions
    print("\n--- 3. Test Low Rainfall Conditions (0.0 mm) ---")
    low_eval = engine.evaluate_basin_risk("krishna", rainfall_override_mm=0.0)
    print(f"Low Rainfall Risk Score: {low_eval.risk_score}, Level: {low_eval.risk_level}")
    assert low_eval.risk_score < 50
    assert low_eval.risk_level in ["LOW", "MODERATE"]

    # 4. Test High Rainfall Conditions (150.0 mm)
    print("\n--- 4. Test High Rainfall Conditions (150.0 mm) ---")
    high_eval = engine.evaluate_basin_risk("godavari", rainfall_override_mm=150.0)
    print(f"High Rainfall Risk Score: {high_eval.risk_score}, Level: {high_eval.risk_level}")
    assert high_eval.risk_score >= 80
    assert high_eval.risk_level in ["HIGH", "CRITICAL"]

    # 5. Test Missing River Level telemetry integrity
    print("\n--- 5. Test Missing River Level Telemetry Integrity ---")
    assert low_eval.river_level is None
    assert high_eval.river_level is None
    assert "unavailable" in low_eval.water_level_status

    print("\nALL PHASE 2A FLOOD RISK ENGINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2a_flood_risk()
