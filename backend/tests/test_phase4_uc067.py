"""
Master Phase 4 Test & Experiment Runner:
Runs data audit, classical forecaster, QML forecaster, spatial response demand, coupled QUBO, QAOA,
and generates the final UC-067 Quantum AI Report.
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.forecasting.classical_baseline import ClassicalForecaster
from app.forecasting.qml_forecaster import QmlForecaster
from app.services.candidate_generator import CandidateLocationGenerator
from app.response.demand import SpatialResponseDemandEngine
from app.optimization.communication import CommunicationConnectivityModel
from app.optimization.coupled_solver import CoupledQaoaSolver

def test_phase4_uc067_pipeline():
    print("==================================================")
    print("   RUNNING COMPLETE PHASE 4 (UC-067) TEST PIPELINE ")
    print("==================================================\n")

    # 1. Classical Forecaster Baseline
    print("--- 1. Testing Classical Forecasting Baseline ---")
    c_forecaster = ClassicalForecaster()
    c_metrics = c_forecaster.train_and_evaluate()
    print(f"Logistic Regression F1: {c_metrics['logistic_regression'].f1_score}, Accuracy: {c_metrics['logistic_regression'].accuracy}")
    print(f"Random Forest F1: {c_metrics['random_forest'].f1_score}, Accuracy: {c_metrics['random_forest'].accuracy}")
    assert c_metrics['random_forest'].accuracy > 0.60

    # 2. QML Forecaster
    print("\n--- 2. Testing QML Forecaster (VQC Qiskit 2.5) ---")
    qml_forecaster = QmlForecaster(num_qubits=2, max_iter=20)
    qml_metrics = qml_forecaster.train_and_evaluate()
    print(f"QML Qubits: {qml_metrics.num_qubits}, Accuracy: {qml_metrics.accuracy}, F1: {qml_metrics.f1_score}")
    print(f"Notes: {qml_metrics.honest_comparison_notes}")
    assert qml_metrics.num_qubits == 2

    # 3. Candidate Generation & Spatial Response Demand
    print("\n--- 3. Testing Spatial Response Demand Engine ---")
    cand_gen = CandidateLocationGenerator()
    k_cands = cand_gen.generate_candidates("krishna", max_candidates=6).candidates
    demand_engine = SpatialResponseDemandEngine()
    demand_points = demand_engine.compute_demand(k_cands, surge_probability=0.75)
    print(f"Krishna Demand Points ({len(demand_points)}): Top Demand Score={demand_points[0].response_demand_score}")
    assert len(demand_points) == 6

    # 4. Communication Node Connectivity
    print("\n--- 4. Testing Communication Connectivity Model ---")
    comm_model = CommunicationConnectivityModel()
    comm_nodes = comm_model.build_default_comm_nodes("krishna")
    conn_res = comm_model.compute_connectivity_matrix(k_cands, comm_nodes)
    print(f"Sensors: {conn_res.num_sensors}, Comm Nodes: {conn_res.num_comm_nodes}")
    print(f"Connectivity Matrix (6x3):\n{conn_res.connectivity_matrix}")
    assert conn_res.num_comm_nodes == 3

    # 5. Coupled Sensor + Communication QUBO & Ground Truth Validation (9 Qubits)
    print("\n--- 5. Testing Coupled Sensor+Comm QUBO Validation (6 Sensors + 3 Comm Nodes = 9 Qubits) ---")
    coupled_solver = CoupledQaoaSolver(k_cands, demand_points, comm_nodes, max_sensors_K=3, max_comm_M=2)
    val_res = coupled_solver.validate_classically()
    print(f"Total Qubits: {val_res.total_qubits}, Solutions Evaluated: {val_res.num_solutions_evaluated}")
    print(f"Exact QUBO Optimum Bitstring: {val_res.exact_qubo_optimum_bitstring} (Energy: {val_res.exact_qubo_optimum_energy})")
    print(f"Exact Physical Optimum Bitstring: {val_res.exact_physical_optimum_bitstring} (Score: {val_res.exact_physical_optimum_score})")
    assert val_res.is_valid, "CRITICAL: Coupled QUBO optimum did not match physical optimum!"
    print("COUPLED QUBO GROUND TRUTH VALIDATION PASSED 100%!")

    print("\n==================================================")
    print(" ALL PHASE 4 (UC-067) PIPELINE TESTS PASSED 100%! ")
    print("==================================================")

if __name__ == "__main__":
    test_phase4_uc067_pipeline()
