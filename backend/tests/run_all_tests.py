"""
Master backend test runner.
Runs tests for Phase 1, Phase 2A, Phase 2B, Phase 2C, and Phase 2D.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from tests.test_phase1_readers import test_rainfall_reader, test_population_sampler
from tests.test_phase2a_risk import test_phase2a_flood_risk
from tests.test_phase2b_candidates import test_phase2b_candidate_generator
from tests.test_phase2c_scenario import test_phase2c_scenario_engine
from tests.test_phase2d_alerts import test_phase2d_alert_service

def run_all_backend_tests():
    print("==================================================")
    print("      RUNNING COMPLETE BACKEND TEST SUITE        ")
    print("==================================================\n")

    print("[Phase 1] Dataset Readers:")
    test_rainfall_reader()
    test_population_sampler()

    print("\n[Phase 2A] Flood Risk Engine:")
    test_phase2a_flood_risk()

    print("\n[Phase 2B] Candidate Location Generator:")
    test_phase2b_candidate_generator()

    print("\n[Phase 2C] Scenario Engine:")
    test_phase2c_scenario_engine()

    print("\n[Phase 2D] Alert Service:")
    test_phase2d_alert_service()

    print("\n==================================================")
    print("  ALL BACKEND TESTS PASSED CLEANLY AND SUCCESSFULLY! ")
    print("==================================================")

if __name__ == "__main__":
    run_all_backend_tests()
