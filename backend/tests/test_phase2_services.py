"""
Integration tests for Phase 2:
- Flood-risk service (Krishna and Godavari)
- Candidate location generator
- Scenario simulation engine
- Alert service
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.flood_risk import FloodRiskService
from app.services.candidate_generator import CandidateLocationGenerator
from app.services.scenario_engine import ScenarioEngine
from app.services.alert_service import AlertService

def test_phase2():
    print("=== Testing Phase 2 Services ===")

    # 1. Flood Risk Service
    print("\n--- 1. Testing FloodRiskService ---")
    risk_service = FloodRiskService()
    
    krishna_summary = risk_service.get_basin_summary("krishna")
    print(f"Krishna Summary: {json.dumps(krishna_summary, indent=2)}")
    assert krishna_summary["riskScore"] > 0
    assert krishna_summary["waterLevel"] is None  # Verifying non-fabrication of river levels
    assert "unavailable" in krishna_summary["waterLevelStatus"]

    godavari_summary = risk_service.get_basin_summary("godavari")
    print(f"Godavari Summary: {json.dumps(godavari_summary, indent=2)}")
    assert godavari_summary["riskScore"] > 0
    assert godavari_summary["waterLevel"] is None

    krishna_zones = risk_service.get_zone_risks("krishna")
    print(f"Krishna Zones ({len(krishna_zones)}): {krishna_zones[:2]}")
    assert len(krishna_zones) == 5

    forecast = risk_service.get_forecast_series("krishna")
    print(f"Forecast Series (17 points): first point={forecast[0]}, last point={forecast[-1]}")
    assert len(forecast) == 17
    assert forecast[0]["riverLevel"] is None

    # 2. Candidate Generator
    print("\n--- 2. Testing CandidateLocationGenerator ---")
    cand_gen = CandidateLocationGenerator(risk_service=risk_service)
    
    k_cands = cand_gen.generate_candidates("krishna", min_distance_km=2.0)
    print(f"Krishna Generated Candidates Count: {len(k_cands)}")
    assert len(k_cands) >= 7
    first_c = k_cands[0]
    print(f"Sample Candidate (Top Priority): {first_c['id']} - {first_c['label']}, Priority={first_c['priority']}")
    print(f"  Coordinates: {first_c['coordinates']}")
    print(f"  Population Exposure: {first_c['detail']['populationExposure']}")
    print(f"  River Distance: {first_c['detail']['riverDistanceKm']} km")
    assert first_c["detail"]["populationExposure"] > 0
    assert first_c["priority"] > 50

    g_cands = cand_gen.generate_candidates("godavari", min_distance_km=2.0)
    print(f"Godavari Generated Candidates Count: {len(g_cands)}")
    assert len(g_cands) >= 7

    # 3. Scenario Engine
    print("\n--- 3. Testing ScenarioEngine ---")
    scenario_engine = ScenarioEngine(risk_service=risk_service)
    scenario_res = scenario_engine.simulate(
        basin_id="krishna",
        current_risk=87,
        current_coverage=54,
        existing_sensors=5,
        existing_communication_nodes=1,
        rainfall_intensity="severe",
        river_rise_meters=1.5,
        duration_hours=12,
        sensor_failure_percent=10,
        communication_failure_percent=10
    )
    print(f"Scenario Simulation Result:\n{json.dumps(scenario_res, indent=2)}")
    assert scenario_res["status"] == "complete"
    assert scenario_res["predictedRisk"] >= scenario_res["currentRisk"]
    assert scenario_res["additionalSensors"] > 0
    assert len(scenario_res["criticalZones"]) > 0

    # 4. Alert Service
    print("\n--- 4. Testing AlertService ---")
    alert_service = AlertService(risk_service=risk_service)
    k_alerts = alert_service.get_alerts_for_basin("krishna")
    print(f"Krishna Alerts ({len(k_alerts)}): {json.dumps(k_alerts, indent=2)}")
    assert len(k_alerts) >= 2
    assert any(a["level"] in ["critical", "warning"] for a in k_alerts)

    channels = alert_service.get_channels()
    print(f"Alert Channels: {channels}")
    assert len(channels) == 3

    print("\nALL PHASE 2 SERVICES PASSED AUTOMATED TESTS SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2()
