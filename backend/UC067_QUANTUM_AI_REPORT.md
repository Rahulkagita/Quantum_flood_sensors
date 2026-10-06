# UC-067 QUANTUM & QML DISASTER-RESPONSE REPORT

## 1. Problem Context & Use-Case Definition (UC-067)
"Flood forecasting and disaster-response sensor placement — Placing limited sensors and communication nodes for maximal coverage in disaster zones, and forecasting floods, are coupled hard problems acutely relevant to the Krishna-Godavari basins."

This intelligence system couples **Temporal Heavy Rainfall Forecasting** with **Spatial Quantum Optimization (QAOA)** for joint sensor and communication relay placement across Krishna and Godavari basins.

---

## 2. Dataset Audit Summary
- **IMD NetCDF Series:** 6 annual files (1981, 1986, 2022-2025), $0.25^\circ \times 0.25^\circ$ daily gridded rainfall ($\text{mm/day}$).
- **WorldPop 2020 GeoTIFF:** $100\text{m} \times 100\text{m}$ unadjusted population density grid ($488\text{ MB}$).
- **River Level Telemetry:** Not present in raw datasets. Handled strictly as `null` to avoid non-scientific fabrication.

---

## 3. Heavy Rainfall Surge Forecasting & Baseline vs QML Benchmarks
Target: $Y_{t+1} \in \{0, 1\}$ ($1$ if next-day rainfall $\ge 25.0\text{ mm/day}$, else $0$).
Splitting: Chronological Train (1981, 1986, 2022, 2023 - 1,460 samples) vs Test (2024, 2025 - 724 samples).

| Model | Qubits / Features | Accuracy | F1-Score | ROC-AUC | Runtime |
|---|---|---|---|---|---|
| **Logistic Regression** | 5 Features | $95.58\%$ | $0.0588$ | $0.8124$ | $0.02\text{ s}$ |
| **Random Forest** | 5 Features | $95.03\%$ | $0.1429$ | $0.8350$ | $0.08\text{ s}$ |
| **Variational Quantum Classifier (VQC)** | 2 Qubits (PCA) | $92.82\%$ | $0.0714$ | $0.6210$ | $3.45\text{ s}$ |

*Honest Finding:* The classical Random Forest model achieves higher precision/recall than the 2-qubit VQC. The QML model serves as a functional quantum pipeline demonstration using Qiskit 2.5 Statevector simulation.

---

## 4. Coupled Sensor + Communication Relay QUBO & QAOA Optimization

### Decision Variables ($N+M$ Qubits):
- $x_i \in \{0, 1\}$ for sensor $i \in \{1, \dots, N\}$
- $y_j \in \{0, 1\}$ for communication relay node $j \in \{1, \dots, M\}$

### Mathematical Formulation:
$$Q(x, y) = - \sum_{i} \text{Demand}_i x_i + A \left( \sum_{i} x_i - K \right)^2 + B \left( \sum_{j} y_j - M_{\text{max}} \right)^2 + C_{\text{disc}} \sum_{i} x_i \left( 1 - \sum_{j \in \text{Link}(i)} y_j \right)$$

### Benchmark Ratios (6 Sensors + 3 Comm Relays = 9 Qubits):
- **Exhaustive Ground Truth Search:** 512 bitstrings evaluated.
- **Exact QUBO Optimum Bitstring:** `110001101` (Energy: $-49.13$, Physical Score: $1529.13$).
- **Ground Truth Validation:** **`PASSED (100% Optima Match)`**.

---

## 5. Coupled Network Performance Across Flood Scenarios

| Scenario | Risk Level | Selected Sensors | Selected Relays | Disconnected Sensors | Risk Coverage |
|---|---|---|---|---|---|
| **Normal Operational** | `LOW` (25) | 3 | 1 | 0 | $75.0\%$ |
| **Monsoon Surge** | `HIGH` (78) | 5 | 2 | 0 | $92.5\%$ |
| **Extreme Cyclone** | `CRITICAL` (99)| 5 | 3 | 0 | $100.0\%$ |

---

## 6. Honest Limitations & Quantum Disclosures
1. **Simulator Execution:** QAOA and VQC circuits are simulated locally using Qiskit 2.5 `Statevector` backend; no hardware quantum advantage is claimed over classical solvers.
2. **QML Scaling:** The VQC is constrained to 2 qubits via PCA to maintain low simulation runtimes.
3. **Data Availability:** River level telemetry is set to `null` due to missing raw telemetry data.
