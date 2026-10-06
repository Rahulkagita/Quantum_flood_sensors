"""
Rule-Based Flood Alert Service (Phase 2D).

Derives alerts deterministically from the ConfigurableFloodRiskEngine.
Configurable Risk Level Thresholds:
- 0 to 39   -> INFO
- 40 to 59  -> WATCH
- 60 to 79  -> WARNING
- 80 to 100 -> CRITICAL

Enforces transparency:
- No fake live notification broadcasts (email/whatsapp integrations flagged connected=False).
- 100% deterministic outputs for identical risk input.
"""
from typing import Optional, List, Dict
from datetime import datetime, timezone
from app.services.flood_risk import ConfigurableFloodRiskEngine
from app.schemas.alert_schema import FloodAlert, AlertChannelState, AlertResponse

class AlertService:
    def __init__(
        self,
        risk_engine: Optional[ConfigurableFloodRiskEngine] = None,
        info_threshold: int = 0,
        watch_threshold: int = 40,
        warning_threshold: int = 60,
        critical_threshold: int = 80
    ):
        self.risk_engine = risk_engine or ConfigurableFloodRiskEngine()
        self.info_threshold = info_threshold
        self.watch_threshold = watch_threshold
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold

    def determine_alert_level(self, risk_score: int) -> str:
        """
        Maps a 0-100 risk score to alert levels based on configurable thresholds.
        """
        if risk_score >= self.critical_threshold:
            return "CRITICAL"
        elif risk_score >= self.warning_threshold:
            return "WARNING"
        elif risk_score >= self.watch_threshold:
            return "WATCH"
        else:
            return "INFO"

    def get_alerts(
        self,
        basin_id: str,
        year: int = 2024,
        rainfall_override_mm: Optional[float] = None,
        eval_timestamp: Optional[str] = None
    ) -> AlertResponse:
        """
        Evaluates risk score and generates deterministic, rule-based flood alerts.
        """
        basin_clean = basin_id.lower().strip()
        risk_eval = self.risk_engine.evaluate_basin_risk(
            basin_clean,
            year=year,
            rainfall_override_mm=rainfall_override_mm
        )
        
        score = risk_eval.risk_score
        level = self.determine_alert_level(score)
        ts = eval_timestamp or "2026-10-05T20:00:00Z"

        alerts: List[FloodAlert] = []

        if level == "CRITICAL":
            alerts.append(
                FloodAlert(
                    id=f"ALT-{basin_clean[:2].upper()}-CRIT",
                    basin_id=basin_clean,
                    level="CRITICAL",
                    risk_score=score,
                    title="Critical Flood Emergency Warning",
                    reason=f"Extreme rainfall accumulation ({risk_eval.rainfall_mm:.1f} mm) & high population exposure (~{risk_eval.population_exposure_count:,})",
                    source="IMD rainfall NetCDF & WorldPop 2020",
                    timestamp=ts
                )
            )
        elif level == "WARNING":
            alerts.append(
                FloodAlert(
                    id=f"ALT-{basin_clean[:2].upper()}-WARN",
                    basin_id=basin_clean,
                    level="WARNING",
                    risk_score=score,
                    title="Elevated Flood Inundation Warning",
                    reason=f"Significant rainfall ({risk_eval.rainfall_mm:.1f} mm) exceeding historical baseline",
                    source="IMD rainfall NetCDF",
                    timestamp=ts
                )
            )
        elif level == "WATCH":
            alerts.append(
                FloodAlert(
                    id=f"ALT-{basin_clean[:2].upper()}-WATCH",
                    basin_id=basin_clean,
                    level="WATCH",
                    risk_score=score,
                    title="Catchment Precipitation Watch",
                    reason=f"Moderate rainfall accumulation ({risk_eval.rainfall_mm:.1f} mm) over upper basin",
                    source="IMD rainfall NetCDF",
                    timestamp=ts
                )
            )
        else: # INFO
            alerts.append(
                FloodAlert(
                    id=f"ALT-{basin_clean[:2].upper()}-INFO",
                    basin_id=basin_clean,
                    level="INFO",
                    risk_score=score,
                    title="Normal Basin Operational Status",
                    reason="Low precipitation accumulation across basin catchment",
                    source="IMD rainfall NetCDF",
                    timestamp=ts
                )
            )

        channels = [
            AlertChannelState(channel="dashboard", label="Dashboard HUD", enabled=True, connected=True),
            AlertChannelState(channel="email", label="Email Notification", enabled=False, connected=False),
            AlertChannelState(channel="whatsapp", label="WhatsApp Alert", enabled=False, connected=False),
        ]

        return AlertResponse(
            basin_id=basin_clean,
            alerts=alerts,
            channels=channels
        )
