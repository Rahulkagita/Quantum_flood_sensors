"""
Unit tests for Phase 2D Alert Service:
- Verifies INFO threshold (0-39)
- Verifies WATCH threshold (40-59)
- Verifies WARNING threshold (60-79)
- Verifies CRITICAL threshold (80-100)
- Verifies non-integration of external channels (email/whatsapp connected=False)
- Verifies 100% deterministic output
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.alert_service import AlertService

def test_phase2d_alert_service():
    print("=== Testing Phase 2D AlertService ===")
    service = AlertService()

    # 1. Test INFO Level Threshold (Risk < 40)
    print("\n--- 1. Test INFO Level Threshold (Rainfall = 0 mm) ---")
    res_info = service.get_alerts("krishna", rainfall_override_mm=0.0)
    print(json.dumps(res_info.model_dump(), indent=2))
    assert res_info.alerts[0].level == "INFO"
    assert res_info.alerts[0].risk_score < 40

    # 2. Test WATCH Level Threshold (40 <= Risk <= 59)
    print("\n--- 2. Test WATCH Level Threshold (Rainfall = 25 mm) ---")
    res_watch = service.get_alerts("krishna", rainfall_override_mm=25.0)
    print(f"Risk Score: {res_watch.alerts[0].risk_score}, Level: {res_watch.alerts[0].level}")
    assert res_watch.alerts[0].level == "WATCH"
    assert 40 <= res_watch.alerts[0].risk_score <= 59

    # 3. Test WARNING Level Threshold (60 <= Risk <= 79)
    print("\n--- 3. Test WARNING Level Threshold (Rainfall = 55 mm) ---")
    res_warn = service.get_alerts("godavari", rainfall_override_mm=55.0)
    print(f"Risk Score: {res_warn.alerts[0].risk_score}, Level: {res_warn.alerts[0].level}")
    assert res_warn.alerts[0].level == "WARNING"
    assert 60 <= res_warn.alerts[0].risk_score <= 79

    # 4. Test CRITICAL Level Threshold (Risk >= 80)
    print("\n--- 4. Test CRITICAL Level Threshold (Rainfall = 140 mm) ---")
    res_crit = service.get_alerts("godavari", rainfall_override_mm=140.0)
    print(f"Risk Score: {res_crit.alerts[0].risk_score}, Level: {res_crit.alerts[0].level}")
    assert res_crit.alerts[0].level == "CRITICAL"
    assert res_crit.alerts[0].risk_score >= 80

    # 5. Test Channel Integration Integrity
    print("\n--- 5. Test Channel Integration Integrity ---")
    channels = res_info.channels
    assert any(c.channel == "dashboard" and c.connected for c in channels)
    assert any(c.channel == "email" and not c.connected for c in channels)
    assert any(c.channel == "whatsapp" and not c.connected for c in channels)
    print("External channels correctly reported as connected=False (no fake integrations).")

    # 6. Test Deterministic Output
    print("\n--- 6. Test Deterministic Output ---")
    run1 = service.get_alerts("krishna", rainfall_override_mm=40.0)
    run2 = service.get_alerts("krishna", rainfall_override_mm=40.0)
    assert run1.alerts[0].model_dump() == run2.alerts[0].model_dump()
    print("Alert generation is 100% deterministic.")

    print("\nALL PHASE 2D ALERT SERVICE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2d_alert_service()
