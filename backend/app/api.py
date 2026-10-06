from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.services.flood_risk import ConfigurableFloodRiskEngine
from app.services.candidate_generator import CandidateLocationGenerator
from app.services.scenario_engine import ScenarioEngine
from app.services.alert_service import AlertService
from app.schemas.risk_schema import FloodRiskEvaluation
from app.schemas.candidate_schema import CandidateGenerationResponse
from app.schemas.scenario_schema import ScenarioRequest, ScenarioResponse
from app.schemas.alert_schema import AlertResponse
from app.forecasting.hardened_forecaster import HardenedForecaster
from app.forecasting.qml_forecaster import QmlForecaster
from app.optimization.communication import CommunicationConnectivityModel
from app.optimization.response import ResponseDemandPoint, SpatialResponseDemandEngine
from app.optimization.hardened_coupled_validator import FinalCoupledValidator, ResponseNetworkMetrics, BitstringDecoding
from app.optimization.experiment import QuantumExperimentManager, ExperimentComparisonResult

router = APIRouter(prefix="/api")

risk_engine = ConfigurableFloodRiskEngine()
cand_generator = CandidateLocationGenerator()
scenario_engine = ScenarioEngine()
alert_service = AlertService()
hardened_forecaster = HardenedForecaster()
qml_forecaster = QmlForecaster(num_qubits=2, max_iter=20)
exp_manager = QuantumExperimentManager()

class OptimizationRequest(BaseModel):
    basin_id: str = Field("krishna", description="Basin ID (krishna | godavari)")
    scenario: str = Field("MONSOON_SURGE", description="Scenario type (NORMAL | MONSOON_SURGE | EXTREME_CYCLONE)")
    max_sensors: int = Field(3, description="Maximum sensor budget K")
    max_relays: int = Field(2, description="Maximum relay budget M")
    surge_probability: float = Field(0.80, description="Forecasted surge probability")
    qaoa_depth: int = Field(1, description="QAOA circuit depth p")

@router.get("/basins/{basin_id}/risk", response_model=FloodRiskEvaluation)
def get_basin_risk(basin_id: str, year: int = 2024, rainfall_override: Optional[float] = None):
    try:
        return risk_engine.evaluate_basin_risk(basin_id=basin_id, year=year, rainfall_override_mm=rainfall_override)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/basins/{basin_id}/candidates", response_model=CandidateGenerationResponse)
def get_candidates(basin_id: str, max_candidates: int = 10, min_spacing_km: float = 12.0):
    try:
        return cand_generator.generate_candidates(basin_id=basin_id, max_candidates=max_candidates, min_spacing_km=min_spacing_km)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/basins/{basin_id}/forecast")
def get_forecast_metrics(basin_id: str):
    c_metrics = hardened_forecaster.train_and_evaluate()
    q_metrics = qml_forecaster.train_and_evaluate()
    
    # Calculate hazard level based on basin current risk evaluation
    risk_eval = risk_engine.evaluate_basin_risk(basin_id)
    hazard_prob = min(0.95, round(risk_eval.risk_score / 100.0, 2))
    
    return {
        "basin_id": basin_id,
        "forecast_horizon": "24 Hours Ahead",
        "hazard_type": "Heavy-precipitation hazard forecast",
        "discharge_telemetry_status": "River discharge telemetry unavailable",
        "hazard_probability": hazard_prob,
        "historical_avg_rainfall_mm": risk_eval.historical_avg_rainfall_mm,
        "current_3day_rainfall_mm": risk_eval.rainfall_mm,
        "models": {
            "logistic_regression": c_metrics["logistic_regression"].model_dump(),
            "random_forest": c_metrics["random_forest"].model_dump(),
            "qml_vqc": q_metrics.model_dump()
        }
    }

@router.get("/basins/{basin_id}/alerts", response_model=AlertResponse)
def get_alerts(basin_id: str):
    return alert_service.get_alerts(basin_id)

@router.post("/scenarios/simulate", response_model=ScenarioResponse)
def simulate_scenario(req: ScenarioRequest):
    return scenario_engine.run_simulation(req)

@router.post("/optimization/coupled")
def run_coupled_optimization(req: OptimizationRequest):
    # Fetch candidates and comm nodes
    cands = cand_generator.generate_candidates(req.basin_id, max_candidates=10).candidates
    comm_model = CommunicationConnectivityModel(comm_range_km=15.0)
    comm_nodes = comm_model.build_default_comm_nodes(req.basin_id)
    
    # Filter candidates reachable by communication network
    valid_cands = [
        c for c in cands 
        if any(comm_model.compute_connectivity_matrix([c], comm_nodes).connectivity_matrix[0])
    ][:5]
    
    # Demand calculation based on surge probability
    demand_engine = SpatialResponseDemandEngine()
    demand_pts = demand_engine.compute_demand(valid_cands, surge_probability=req.surge_probability)
    
    validator = FinalCoupledValidator(
        sensors=valid_cands,
        demand_points=demand_pts,
        comm_nodes=comm_nodes,
        max_sensors_K=req.max_sensors,
        max_relays_M=req.max_relays
    )
    
    exact_bitstr, exact_e, exact_s = validator.evaluate_exact_ground_truth()
    
    risk_eval = risk_engine.evaluate_basin_risk(req.basin_id)
    
    metrics = validator.generate_response_metrics(
        bitstring=exact_bitstr,
        basin_id=req.basin_id,
        scenario_name=req.scenario,
        risk_score=risk_eval.risk_score,
        forecast_prob=req.surge_probability,
        qaoa_depth=req.qaoa_depth
    )
    
    decoding = validator.decode_bitstring(exact_bitstr)
    
    return {
        "metrics": metrics.model_dump(),
        "decoding": decoding.model_dump(),
        "candidates": [c.model_dump() for c in valid_cands],
        "comm_nodes": [cn.model_dump() for cn in comm_nodes],
        "demand_points": [d.model_dump() for d in demand_pts],
        "qubo_summary": {
            "num_qubits": validator.qubo.total_qubits,
            "sensor_qubits": validator.qubo.num_sensors_N,
            "relay_qubits": validator.qubo.num_relays_M,
            "offset": validator.qubo.offset,
            "matrix_size": f"{validator.qubo.total_qubits}x{validator.qubo.total_qubits}"
        }
    }

@router.get("/optimization/benchmark", response_model=ExperimentComparisonResult)
def get_optimization_benchmark(basin_id: str = "krishna", k_sensors: int = 5):
    cands = cand_generator.generate_candidates(basin_id, max_candidates=10).candidates
    return exp_manager.run_experiment(candidates=cands, target_sensors=k_sensors, basin_id=basin_id)
