"""
Unit tests for Phase 2B Candidate Location Generator:
- Verifies Krishna candidates generation
- Verifies Godavari candidates generation
- Verifies candidate count configurable limits
- Verifies spatial coordinate validity (within basin bounding box)
- Verifies minimum spacing constraint enforcement
- Verifies deterministic, reproducible output
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.candidate_generator import CandidateLocationGenerator, haversine_distance_km
from app.config import settings

def test_phase2b_candidate_generator():
    print("=== Testing Phase 2B CandidateLocationGenerator ===")
    generator = CandidateLocationGenerator()

    # 1. Test Krishna Basin Generation
    print("\n--- 1. Test Krishna Basin Generation ---")
    res_k = generator.generate_candidates("krishna", max_candidates=10, min_spacing_km=2.0)
    print(f"Krishna candidates generated: {res_k.total_candidates}")
    print(json.dumps([c.model_dump() for c in res_k.candidates[:2]], indent=2))
    assert res_k.basin_id == "krishna"
    assert res_k.total_candidates <= 10
    assert res_k.total_candidates > 0

    # 2. Test Godavari Basin Generation
    print("\n--- 2. Test Godavari Basin Generation ---")
    res_g = generator.generate_candidates("godavari", max_candidates=10, min_spacing_km=2.0)
    print(f"Godavari candidates generated: {res_g.total_candidates}")
    print(json.dumps([c.model_dump() for c in res_g.candidates[:2]], indent=2))
    assert res_g.basin_id == "godavari"
    assert res_g.total_candidates <= 10
    assert res_g.total_candidates > 0

    # 3. Test Coordinate Validity (Bounding Box Check)
    print("\n--- 3. Test Coordinate Validity ---")
    bounds_k = settings.BASIN_BOUNDS["krishna"] # [79.5, 15.5, 81.5, 17.2]
    for c in res_k.candidates:
        assert bounds_k[0] <= c.longitude <= bounds_k[2], f"Longitude {c.longitude} out of bounds"
        assert bounds_k[1] <= c.latitude <= bounds_k[3], f"Latitude {c.latitude} out of bounds"
    print("All candidate coordinates fall strictly inside the basin bounding box.")

    # 4. Test Minimum Spacing Constraint Enforcement
    print("\n--- 4. Test Minimum Spacing Constraint (2.0 km) ---")
    cands = res_k.candidates
    for i in range(len(cands)):
        for j in range(i + 1, len(cands)):
            dist = haversine_distance_km(
                cands[i].latitude, cands[i].longitude,
                cands[j].latitude, cands[j].longitude
            )
            assert dist >= 2.0, f"Candidates {cands[i].id} and {cands[j].id} violate min spacing: {dist:.2f} km"
    print("All generated candidates strictly satisfy minimum spacing >= 2.0 km.")

    # 5. Test Deterministic & Reproducible Output
    print("\n--- 5. Test Deterministic & Reproducible Output ---")
    run1 = generator.generate_candidates("krishna", max_candidates=5, min_spacing_km=2.0)
    run2 = generator.generate_candidates("krishna", max_candidates=5, min_spacing_km=2.0)
    assert [c.id for c in run1.candidates] == [c.id for c in run2.candidates]
    assert [c.risk_score for c in run1.candidates] == [c.risk_score for c in run2.candidates]
    print("Candidate generation output is 100% deterministic and reproducible.")

    print("\nALL PHASE 2B CANDIDATE GENERATOR TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2b_candidate_generator()
