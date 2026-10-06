"""
Deterministic & Explainable Flood Risk Engine (Phase 2A).

Uses ONLY real available datasets:
1. IMD Rainfall NetCDF files (1981, 1986, 2022, 2023, 2024, 2025)
2. WorldPop 2020 GeoTIFF (ind_ppp_2020_UNadj_constrained.tif)

Explicit Configurable Formula:
------------------------------
composite_risk_score = round(
    w_rain * rainfall_score
    + w_anomaly * rainfall_anomaly_score
    + w_exposure * population_exposure_score
)

Where:
- rainfall_score = min(100.0, (rainfall_3day_mm / 120.0) * 100.0)
- anomaly_score = min(100.0, max(0.0, ((rainfall_3day_mm - hist_avg_3day_mm) / max(hist_avg_3day_mm, 10.0) + 1.0) * 50.0))
- population_exposure_score = min(100.0, max(0.0, ((log10(max(pop_count, 100)) - 2.0) / 3.0) * 100.0))

Default Weights:
- w_rain = 0.45
- w_anomaly = 0.30
- w_exposure = 0.25

Does NOT invent river level values. Returns river_level = None.
"""
from typing import Optional, List, Dict, Any
import math
from app.data.nc_reader import RainfallDatasetReader
from app.data.population_sampler import PopulationSampler
from app.schemas.risk_schema import FloodRiskEvaluation, RiskBreakdown

class ConfigurableFloodRiskEngine:
    def __init__(
        self,
        nc_reader: Optional[RainfallDatasetReader] = None,
        pop_sampler: Optional[PopulationSampler] = None,
        w_rain: float = 0.45,
        w_anomaly: float = 0.30,
        w_exposure: float = 0.25
    ):
        self.nc_reader = nc_reader or RainfallDatasetReader()
        self.pop_sampler = pop_sampler or PopulationSampler()
        self.w_rain = w_rain
        self.w_anomaly = w_anomaly
        self.w_exposure = w_exposure
        
        # Verify weight normalization
        total_w = self.w_rain + self.w_anomaly + self.w_exposure
        if not math.isclose(total_w, 1.0, rel_tol=1e-5):
            self.w_rain /= total_w
            self.w_anomaly /= total_w
            self.w_exposure /= total_w

    def evaluate_basin_risk(
        self,
        basin_id: str,
        year: int = 2024,
        day_idx: int = 205,
        rainfall_override_mm: Optional[float] = None
    ) -> FloodRiskEvaluation:
        """
        Evaluates flood risk deterministically for Krishna or Godavari basin.
        """
        basin_clean = basin_id.lower().strip()
        if basin_clean not in ["krishna", "godavari"]:
            raise ValueError(f"Unsupported basin '{basin_id}'. Supported: 'krishna', 'godavari'")

        # Coordinates for key vulnerable reach center
        if basin_clean == "krishna":
            center_lon, center_lat = 80.648, 16.506 # Vijayawada reach
        else: # godavari
            center_lon, center_lat = 81.784, 16.945 # Dowleswaram reach

        # 1. Rainfall score calculation
        if rainfall_override_mm is not None:
            rainfall_3day = float(rainfall_override_mm)
        else:
            series = self.nc_reader.sample_rainfall_for_point(center_lon, center_lat, year=year)
            # 3-day window
            if len(series) >= 3:
                rainfall_3day = float(sum(series[-3:]))
            elif len(series) > 0:
                rainfall_3day = float(sum(series))
            else:
                rainfall_3day = 0.0

        rainfall_score = min(100.0, max(0.0, (rainfall_3day / 120.0) * 100.0))

        # 2. Historical anomaly calculation (comparing vs historical baseline year 1986)
        hist_series = self.nc_reader.sample_rainfall_for_point(center_lon, center_lat, year=1986)
        if len(hist_series) >= 3:
            hist_avg = float(sum(hist_series[-3:]))
        else:
            hist_avg = 15.0

        anomaly_ratio = (rainfall_3day - hist_avg) / max(hist_avg, 10.0)
        rainfall_anomaly_score = min(100.0, max(0.0, (anomaly_ratio + 1.0) * 50.0))

        # 3. Population exposure score calculation
        pop_count = self.pop_sampler.sample_population_exposure(center_lon, center_lat, radius_km=5.0)
        pop_log = math.log10(max(pop_count, 100))
        pop_exposure_score = min(100.0, max(0.0, ((pop_log - 2.0) / 3.0) * 100.0))

        # 4. Composite Risk Score
        raw_composite = (
            self.w_rain * rainfall_score
            + self.w_anomaly * rainfall_anomaly_score
            + self.w_exposure * pop_exposure_score
        )
        final_risk_score = int(round(min(100.0, max(0.0, raw_composite))))

        # Categorization
        if final_risk_score >= 80:
            risk_level = "CRITICAL"
        elif final_risk_score >= 65:
            risk_level = "HIGH"
        elif final_risk_score >= 40:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # Explicit Human-Readable Explanation
        explanation = (
            f"Basin {basin_clean.capitalize()} risk is evaluated as {risk_level} (Score: {final_risk_score}/100). "
            f"Calculated from 3-day accumulated rainfall of {rainfall_3day:.1f} mm (Score: {rainfall_score:.1f}/100), "
            f"a historical rainfall anomaly ratio of {anomaly_ratio:+.2f} vs baseline (Score: {rainfall_anomaly_score:.1f}/100), "
            f"and population exposure of ~{pop_count:,} residents in the 5 km buffer (Score: {pop_exposure_score:.1f}/100). "
            f"River gauge water level data is set to null as live gauge telemetry is not present in the raw datasets."
        )

        breakdown = RiskBreakdown(
            rainfall_score=round(rainfall_score, 1),
            rainfall_anomaly_score=round(rainfall_anomaly_score, 1),
            population_exposure_score=round(pop_exposure_score, 1),
            rainfall_weight=self.w_rain,
            anomaly_weight=self.w_anomaly,
            exposure_weight=self.w_exposure
        )

        return FloodRiskEvaluation(
            basin_id=basin_clean,
            risk_score=final_risk_score,
            risk_level=risk_level,
            rainfall_mm=round(rainfall_3day, 1),
            historical_avg_rainfall_mm=round(hist_avg, 1),
            population_exposure_count=pop_count,
            river_level=None,
            water_level_status="unavailable (gauge dataset not supplied)",
            data_sources=[
                "IMD rainfall NetCDF (0.25x0.25 gridded series)",
                "WorldPop 2020 GeoTIFF (ind_ppp_2020_UNadj_constrained.tif)"
            ],
            breakdown=breakdown,
            explanation=explanation
        )
