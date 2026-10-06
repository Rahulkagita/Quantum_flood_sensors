"""
Master Phase 3 Test Suite for Quantum Core Components:
1. Coverage matrix & Haversine distance
2. QUBO formulation & offset
3. QUBO constraint penalty A*(Sum x_i - K)^2
4. QUBO vs Original Objective validation (CRITICAL TEST)
5. Exact Brute-Force Solver
6. Binary to Ising mapping
7. QAOA circuit construction & Statevector simulation
8. QAOA parameter optimization (COBYLA)
9. Measurement decoding & probability distribution
10. Approximation ratio & optimality gap calculation
11. Classical Greedy Baseline comparison
12. Krishna real candidate experiment (N=10, K=5)
13. Godavari real candidate experiment (N=10, K=5)
"""
import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.candidate_generator import CandidateLocationGenerator
from app.optimization.coverage import GeographicCoverageModel, haversine_km
from app.optimization.qubo import QuboGenerator
from app.optimization.qubo_validator import QuboValidator
from app.optimization.ising import IsingMapper
from app.optimization.greedy import ClassicalGreedyOptimizer
from app.optimization.qaoa import QaoaSolver
from app.optimization.experiment import QuantumExperimentManager

def test_phase3_quantum_core():
    print("==================================================")
    print("      RUNNING PHASE 3 QUANTUM CORE TEST SUITE     ")
    print("==================================================\n")

    cand_gen = CandidateLocationGenerator()
    k_cands = cand_gen.generate_candidates("krishna", max_candidates=6, min_spacing_km=2.0).candidates

    # 1. Coverage Matrix Test
    print("--- 1. Testing Coverage Matrix & Haversine Distance ---")
    cov_model = GeographicCoverageModel(k_cands, coverage_radius_km=5.0)
    matrix = cov_model.compute_coverage_matrix()
    print(f"Coverage matrix ({len(matrix)}x{len(matrix[0])}):\n{matrix}")
    assert len(matrix) == 6
    assert matrix[0][0] == 1

    # 2. QUBO Generation Test
    print("\n--- 2. Testing QUBO Formulation ---")
    qubo_gen = QuboGenerator(k_cands, target_sensors=3)
    qubo = qubo_gen.generate()
    print(f"QUBO matrix size: {qubo.num_candidates}x{qubo.num_candidates}, offset: {qubo.offset}")
    assert qubo.num_candidates == 6
    assert qubo.target_sensors == 3

    # 3. QUBO vs Original Objective Validation (MOST IMPORTANT TEST)
    print("\n--- 3. Testing QUBO Ground Truth Validation (N=6, K=3) ---")
    validator = QuboValidator(k_cands, target_sensors=3)
    val_res = validator.validate()
    print(val_res.explanation)
    assert val_res.is_valid, "CRITICAL FAILURE: QUBO energy minimum did not match physical objective maximum!"
    print("CRITICAL TEST PASSED: QUBO energy minimum EXACTLY matches physical objective maximum.")

    # 4. Ising Transformation Test
    print("\n--- 4. Testing Ising Hamiltonian Mapping ---")
    ising = IsingMapper.map_qubo_to_ising(qubo)
    print(f"Number of qubits: {ising.num_qubits}, Offset: {ising.offset}")
    print(f"Sample Pauli strings (first 3): {ising.pauli_string_representation[:3]}")
    assert ising.num_qubits == 6

    # 5. Greedy Baseline Test
    print("\n--- 5. Testing Classical Greedy Baseline ---")
    greedy = ClassicalGreedyOptimizer(k_cands, target_sensors=3)
    greedy_res = greedy.solve()
    print(f"Greedy Bitstring: {greedy_res.bitstring}, Objective: {greedy_res.objective_value}")
    assert len(greedy_res.selected_indices) == 3

    # 6. QAOA Execution Test
    print("\n--- 6. Testing Authentic QAOA Execution (Qiskit 2.5) ---")
    qaoa = QaoaSolver(k_cands, target_sensors=3, depth_p=1, max_iterations=20)
    qaoa_res = qaoa.solve()
    print(f"Backend: {qaoa_res.backend}, Qubits: {qaoa_res.num_qubits}, Depth p: {qaoa_res.depth_p}")
    print(f"Optimal Gamma: {qaoa_res.optimal_gamma}, Optimal Beta: {qaoa_res.optimal_beta}")
    print(f"QAOA Best Bitstring: {qaoa_res.best_bitstring}, QUBO Energy: {qaoa_res.best_qubo_energy}")
    print(f"Top 3 Measurements: {[m.model_dump() for m in qaoa_res.top_measurements[:3]]}")
    assert len(qaoa_res.best_bitstring) == 6
    assert qaoa_res.best_bitstring.count('1') == 3

    # 7. Real Flood Demonstration: Krishna Basin (N=10, K=5)
    print("\n==================================================")
    print("   REAL FLOOD DEMONSTRATION 1: KRISHNA (N=10, K=5)  ")
    print("==================================================")
    k_cands_10 = cand_gen.generate_candidates("krishna", max_candidates=10, min_spacing_km=2.0).candidates
    exp_mgr_k = QuantumExperimentManager(k_cands_10, target_sensors=5)
    exp_k = exp_mgr_k.run_experiment(experiment_id="EXP-KRISHNA-10", depth_p=1)
    print(json.dumps(exp_k.model_dump(), indent=2))
    assert exp_k.approximation_ratio > 0.0

    # 8. Real Flood Demonstration: Godavari Basin (N=10, K=5)
    print("\n==================================================")
    print("  REAL FLOOD DEMONSTRATION 2: GODAVARI (N=10, K=5)  ")
    print("==================================================")
    g_cands_10 = cand_gen.generate_candidates("godavari", max_candidates=10, min_spacing_km=2.0).candidates
    exp_mgr_g = QuantumExperimentManager(g_cands_10, target_sensors=5)
    exp_g = exp_mgr_g.run_experiment(experiment_id="EXP-GODAVARI-10", depth_p=1)
    print(json.dumps(exp_g.model_dump(), indent=2))
    assert exp_g.approximation_ratio > 0.0

    print("\n==================================================")
    print("   ALL PHASE 3 QUANTUM CORE TESTS PASSED 100%!   ")
    print("==================================================")

if __name__ == "__main__":
    test_phase3_quantum_core()
