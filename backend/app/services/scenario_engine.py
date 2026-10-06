"""
Deterministic Flood Scenario Engine (Phase 2C).

Uses real data from ConfigurableFloodRiskEngine and CandidateLocationGenerator.
Simulates environmental stress (rainfall multiplier / absolute increase) and evaluates
sensor network risk coverage ratio based on deployed candidate sensor locations.
"""
from typing import Optional, List
import math
from app.services.flood_risk import ConfigurableFloodRiskEngine
from app.services.candidate_generator import CandidateLocationGenerator, haversine_distance_km
from app.schemas.scenario_schema import ScenarioRequest, ScenarioResponse, CriticalZoneImpact

class ScenarioEngine:
    def __init__(
        self,
        risk_engine: Optional[ConfigurableFloodRiskEngine] = None,
        candidate_generator: Optional[CandidateLocationGenerator] = None
    ):
        self.risk_engine = risk_engine or ConfigurableFloodRiskEngine()
        self.candidate_generator = candidate_generator or CandidateLocationGenerator(risk_engine=self.risk_engine)

        self._critical_zone_coords = {
            "krishna": [
                ("Vijayawada East Bank", 16.50, 80.68),
                ("Avanigadda Delta Reach", 16.04, 80.93),
                ("Hamsaladeevi Coastal Outlet", 15.82, 80.98),
                ("Kolluru Floodplain", 16.18, 80.79),
            ],
            "godavari": [
                ("Konaseema Central Delta", 16.70, 81.95),
                ("Amalapuram Lowlands", 16.58, 82.00),
                ("Kothapeta Canal Reach", 16.72, 81.89),
                ("Dowleswaram Approach", 16.94, 81.78),
            ]
        }

    def run_simulation(self, request: ScenarioRequest, year: int = 2024) -> ScenarioResponse:
        """
        Executes a deterministic flood scenario simulation.
        """
        basin_clean = request.basin_id.lower().strip()
        
        # 1. Evaluate baseline risk using real NetCDF rainfall & WorldPop datasets
        baseline_eval = self.risk_engine.evaluate_basin_risk(basin_clean, year=year)
        baseline_risk = baseline_eval.risk_score

        # 2. Evaluate simulated scenario rainfall
        simulated_rain_mm = (baseline_eval.rainfall_mm * request.rainfall_multiplier) + request.rainfall_increase_mm
        scenario_eval = self.risk_engine.evaluate_basin_risk(
            basin_clean,
            year=year,
            rainfall_override_mm=simulated_rain_mm
        )
        scenario_risk = scenario_eval.risk_score
        risk_change = scenario_risk - baseline_risk

        # 3. Generate candidate sensor locations for simulated deployment
        candidates_resp = self.candidate_generator.generate_candidates(
            basin_id=basin_clean,
            max_candidates=request.sensor_count,
            min_spacing_km=2.0,
            year=year
        )
        deployed_candidates = candidates_resp.candidates

        # 4. Compute critical zone coverage and risk impact
        zones_info = self._critical_zone_coords.get(basin_clean, [])
        critical_zone_impacts: List[CriticalZoneImpact] = []
        covered_count = 0

        for zone_name, z_lat, z_lon in zones_info:
            # Check if zone is covered by any deployed candidate sensor
            is_covered = False
            for cand in deployed_candidates:
                dist = haversine_distance_km(z_lat, z_lon, cand.latitude, cand.longitude)
                if dist <= request.coverage_radius_km:
                    is_covered = True
                    break
            
            if is_covered:
                covered_count += 1

            # Zone baseline vs scenario risk
            z_base = min(99, max(10, int(round(baseline_risk * 0.95))))
            z_scen = min(99, max(10, int(round(scenario_risk * 0.95))))

            critical_zone_impacts.append(
                CriticalZoneImpact(
                    zone_name=zone_name,
                    baseline_risk=z_base,
                    scenario_risk=z_scen,
                    is_covered=is_covered
                )
            )

        # 5. Compute overall risk coverage ratio
        total_zones = len(zones_info)
        coverage_ratio = round(covered_count / total_zones, 2) if total_zones > 0 else 0.0

        return ScenarioResponse(
            basin_id=basin_clean,
            simulation_type="deterministic_scenario_simulation",
            baseline_risk=baseline_risk,
            scenario_risk=scenario_risk,
            risk_change=risk_change,
            coverage_ratio=coverage_ratio,
            critical_zones=critical_zone_impacts,
            candidate_locations=deployed_candidates
        )
