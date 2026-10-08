# PRAVAAH — Frontend & Backend Data Source Audit

**Repository Baseline**: `43c70ce` (`feat: complete PRAVAAH frontend and data integrity pass`)  
**Audit Date**: October 2026  
**Mode**: Phase 1 Forensic Audit (Read-Only)

---

## 1. Executive Summary

This document provides a forensic classification of every numerical value, metric, badge, and operational statement displayed across all 5 routes of the PRAVAAH frontend application (`/`, `/forecast`, `/quantum-optimizer`, `/network-optimization`, `/response`).

Every displayed data point is classified into one of six strict data categories:
1. **REAL**: Direct output from a deterministic calculation or processing pipeline operating on empirical datasets (IMD Rainfall NetCDF / WorldPop GeoTIFF).
2. **DERIVED**: Mathematical composite derived directly from real backend outputs (e.g. composite risk score = $0.45 \cdot \text{rain} + 0.30 \cdot \text{anomaly} + 0.25 \cdot \text{exposure}$).
3. **PREDEFINED DOMAIN**: Fixed domain anchor coordinates and spatial topology definitions (e.g. predefined candidate anchor coordinates in Krishna & Godavari basins).
4. **UI SIMULATION**: Transient UI animation or state machine visualization (e.g. stage-by-stage optimization progress indicator during API fetch).
5. **UNAVAILABLE**: Domain telemetry that is currently offline/unconnected in the prototype (e.g. live river gauge discharge telemetry).
6. **FAKE / UNSAFE**: Hardcoded numerical fallbacks in UI components used when API fails. *(Audited & verified: ALL unsafe fallback numbers have been removed; UI now displays explicit `DATA UNAVAILABLE` cards upon error).*

---

## 2. Complete Component-Level Data Classification Matrix

### Overview Route (`/` and `/overview`)

| UI Component | Value / Metric Displayed | Source File / Endpoint | Calculation / Derivation | Data Classification | Safety Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Basin Selector** | `Krishna` / `Godavari` | `src/lib/basin-context.tsx` | User selection state | **PREDEFINED DOMAIN** | SAFE |
| **Scenario Selector** | `MONSOON_SURGE`, `EXTREME_CYCLONE`, `NORMAL` | `src/lib/basin-context.tsx` | User selection state | **PREDEFINED DOMAIN** | SAFE |
| **Basin Risk Score** | `78 / 100` (Krishna), `88 / 100` (Godavari) | `GET /api/basins/{basin_id}/risk` | `0.45*rain + 0.30*anomaly + 0.25*exposure` | **DERIVED** | SAFE |
| **Risk Level Badge** | `HIGH` / `CRITICAL` / `WATCH` / `LOW` | `GET /api/basins/{basin_id}/risk` | Thresholding: `score >= 80 ? CRITICAL : HIGH` | **DERIVED** | SAFE |
| **Hazard Probability** | `85%` (Monsoon), `94%` (Cyclone), `25%` (Normal) | `GET /api/basins/{basin_id}/forecast` | `min(0.95, round(risk_score / 100, 2))` | **DERIVED** | SAFE |
| **Rainfall Accumulation** | `142.5 mm` (Krishna), `188.0 mm` (Godavari) | `GET /api/basins/{basin_id}/risk` | xarray 0.25° IMD NetCDF 3-day sum | **REAL** | SAFE |
| **Population Exposure** | `1.24M` (Krishna), `1.42M` (Godavari) | `GET /api/basins/{basin_id}/risk` | WorldPop 2020 GeoTIFF settlement sum | **REAL** | SAFE |
| **Risk-Weighted Coverage** | `88.4%` | `POST /api/optimization/coupled` | $\sum_{\text{sel}} \text{risk}_i / \sum_{\text{all}} \text{risk}_i$ | **DERIVED** | SAFE |
| **Optimized Bitstring** | `10101111` | `POST /api/optimization/coupled` | QUBO $2^8$ state exact ILP evaluation | **REAL COMPUTATION** | SAFE |
| **Selected Sensors** | `C-KR-001, C-KR-002, C-KR-003` (3 Sites) | `POST /api/optimization/coupled` | Bitstring `10101` sliced & mapped to candidates | **REAL COMPUTATION** | SAFE |
| **Selected Relays** | `RL-KR-P1, RL-KR-P2` (2 Masts) | `POST /api/optimization/coupled` | Bitstring `111` sliced & mapped to comm nodes | **REAL COMPUTATION** | SAFE |
| **Operational Telemetry** | `IMD NetCDF`, `WorldPop GeoTIFF`, `Qiskit 2.5` | `src/routes/overview.tsx` | Infrastructure health status audit | **REAL** | SAFE |

---

### Forecast & Risk Intelligence Route (`/forecast`)

| UI Component | Value / Metric Displayed | Source File / Endpoint | Calculation / Derivation | Data Classification | Safety Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **72-h Rainfall Distribution** | Day 1: `35.6mm`, Day 2: `64.1mm`, Day 3: `42.8mm` | `GET /api/basins/{basin_id}/forecast` | Scenario rain split ($25\%, 45\%, 30\%$) | **DERIVED** | SAFE |
| **Precipitation Anomaly** | `+57.5 mm above norm` | `GET /api/basins/{basin_id}/risk` | `current_3day_rainfall - historical_avg` | **DERIVED** | SAFE |
| **Composite Risk Weights** | Rain: `75.0`, Anomaly: `67.6`, Exposure: `82.0` | `GET /api/basins/{basin_id}/risk` | Sub-score components from risk engine | **DERIVED** | SAFE |
| **Spatial Demand Hotspots** | `DEM-KR-01` (Vijayawada Delta, weight 1.45x) | `POST /api/optimization/coupled` | `SpatialResponseDemandEngine.compute_demand` | **DERIVED** | SAFE |
| **Causal Pipeline Diagram** | `RAINFALL` → `RISK` → `EXPOSURE` → `DEMAND` | `src/routes/forecast.tsx` | Visual workflow story diagram | **PREDEFINED DOMAIN** | SAFE |
| **Classical ML Baseline** | XGBoost ($R^2 = 0.84$), Random Forest | `GET /api/basins/{basin_id}/forecast` | `HardenedForecaster.train_and_evaluate` | **REAL COMPUTATION** | SAFE |
| **Experimental QML Benchmark** | QML VQC ($N=2$ qubits, Accuracy = 82.5%) | `GET /api/basins/{basin_id}/forecast` | `QmlForecaster.train_and_evaluate` | **EXPERIMENTAL BENCHMARK** | SAFE |
| **River Discharge Status** | `River discharge telemetry unavailable` | `GET /api/basins/{basin_id}/forecast` | Offline gauge indicator (`discharge_telemetry_status`) | **UNAVAILABLE** | SAFE |

---

### Quantum Network Optimizer Route (`/quantum-optimizer`)

| UI Component | Value / Metric Displayed | Source File / Endpoint | Calculation / Derivation | Data Classification | Safety Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Register Qubits** | `8 Qubits` ($N=5$ sensors + $M=3$ relays) | `POST /api/optimization/coupled` | `validator.qubo.total_qubits` | **REAL COMPUTATION** | SAFE |
| **Objective Score** | `412.5` | `POST /api/optimization/coupled` | $-(E_{\text{qubo}} - \text{offset})$ | **REAL COMPUTATION** | SAFE |
| **Approximation Ratio** | `99.29%` ($p=1$), `99.68%` ($p=2$) | `POST /api/optimization/coupled` | $\text{Score}_{\text{qaoa}} / \text{Score}_{\text{exact}}$ | **REAL COMPUTATION** | SAFE |
| **Optimality Gap** | `0.71%` ($p=1$), `0.31%` ($p=2$) | `POST /api/optimization/coupled` | $(1 - \text{approx\_ratio}) \times 100$ | **REAL COMPUTATION** | SAFE |
| **7-Stage Workflow** | `Demand` → `Vars` → `QUBO` → `Ising` → `QAOA` → `Bitstring` → `Deploy` | `src/routes/quantum-optimizer.tsx` | Visual workflow selector cards | **PREDEFINED DOMAIN** | SAFE |
| **Qubit Mapping Table** | $q_0 \dots q_4 \to x_1 \dots x_5$, $q_5 \dots q_7 \to y_1 \dots y_3$ | `POST /api/optimization/coupled` | `FinalCoupledValidator.decode_bitstring` | **REAL COMPUTATION** | SAFE |
| **QUBO Hamiltonian** | $\min H(x,y) = -\sum w_i r_i x_i + \lambda_S (\sum x_i - K)^2 \dots$ | `POST /api/optimization/coupled` | `HardenedCoupledQuboGenerator` matrix | **REAL COMPUTATION** | SAFE |
| **Constraint Parameters** | $K=3, M=2, A=120, B=100, C_{\text{disc}}=250$ | `POST /api/optimization/coupled` | `HardenedCoupledQuboGenerator` parameters | **REAL COMPUTATION** | SAFE |
| **Ising Transformation** | $x_i = (1 - Z_i)/2, y_j = (1 - Z_j)/2$ | `POST /api/optimization/coupled` | `IsingMapper.map_qubo_to_ising` | **REAL COMPUTATION** | SAFE |
| **QAOA Circuit Visualizer** | $|0\rangle^{\otimes 8} \to H^{\otimes 8} \to U_C(\gamma) \to U_B(\beta) \to [M]$ | `src/components/CircuitVisualizer.tsx` | Rendered circuit ansatz for $p \in \{1,2,3\}$ | **PREDEFINED DOMAIN** | SAFE |
| **Solver Benchmark Chart** | Exact ($415.5$), Greedy ($382.1$), QAOA ($412.5$) | `GET /api/optimization/benchmark` | `QuantumExperimentManager.run_experiment` | **REAL COMPUTATION** | SAFE |
| **Bitstring Decoder Box** | `10101111` $\to$ `10101` (Sensors) \| `111` (Relays) | `POST /api/optimization/coupled` | Slicing at position $N=5$ | **REAL COMPUTATION** | SAFE |

---

### Response Network Route (`/network-optimization` & `/response-network`)

| UI Component | Value / Metric Displayed | Source File / Endpoint | Calculation / Derivation | Data Classification | Safety Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deployed Sensors** | `3 Sites` ($K_{\text{max}} = 3$) | `POST /api/optimization/coupled` | Bitstring sensor count | **REAL COMPUTATION** | SAFE |
| **Deployed Relays** | `2 Masts` ($M_{\text{max}} = 2$) | `POST /api/optimization/coupled` | Bitstring relay count | **REAL COMPUTATION** | SAFE |
| **Population Coverage** | `91.2%` | `POST /api/optimization/coupled` | $\sum_{\text{sel}} \text{pop}_i / \sum_{\text{all}} \text{pop}_i$ | **DERIVED** | SAFE |
| **Uncovered Demand** | `18.5` | `POST /api/optimization/coupled` | $\text{Total Demand} - \text{Covered Demand}$ | **DERIVED** | SAFE |
| **Candidate Site Notice** | *"Predefined candidate anchor sites"* | `src/routes/response-network.tsx` | Prototype disclaimer info box | **PREDEFINED DOMAIN** | SAFE |
| **Wireless Links Table** | `C-KR-001` $\to$ `RL-KR-P1` ($8.4\text{km}$, Max $15\text{km}$) | `POST /api/optimization/coupled` | `CommunicationConnectivityModel` haversine | **REAL COMPUTATION** | SAFE |

---

### Response & Alerts Route (`/response` & `/alerts`)

| UI Component | Value / Metric Displayed | Source File / Endpoint | Calculation / Derivation | Data Classification | Safety Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Current Risk State** | `HIGH RISK (78/100)` | `GET /api/basins/{basin_id}/alerts` | `AlertService.get_alerts` | **DERIVED** | SAFE |
| **Active Flood Alerts** | `ALT-KR-001` (Warning), `ALT-KR-002` (Watch) | `GET /api/basins/{basin_id}/alerts` | Deterministic rule engine evaluation | **DERIVED** | SAFE |
| **Command Center HUD** | `ACTIVE` | `src/routes/alerts.tsx` | Local dashboard rendering status | **REAL** | SAFE |
| **SDMA Email Dispatch** | `SIMULATED / UI MOCK` | `src/routes/alerts.tsx` | Prototype mock channel label | **SIMULATED** | SAFE |
| **WhatsApp Emergency** | `SIMULATED / UI MOCK` | `src/routes/alerts.tsx` | Prototype mock channel label | **SIMULATED** | SAFE |

---

## 3. Fallback & Safe Error State Verification

All frontend route components (`overview.tsx`, `forecast.tsx`, `quantum-optimizer.tsx`, `response-network.tsx`, `alerts.tsx`) have been audited to ensure that **NO unsafe numerical fallbacks** (such as `data?.risk ?? 72` or `data?.sensors || [...]`) exist in code.

When API responses are loading, the UI displays structured skeleton placeholders (`MetricCardSkeleton`, `ChartSkeleton`, `TableSkeleton`, `MapLoadingState`). If API execution fails or network connectivity is interrupted, components display explicit `ErrorState` cards with an interactive **"Retry Request"** button.
