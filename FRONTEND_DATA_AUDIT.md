# PRAVAAH Frontend Data Integrity Audit

This document classifies every data component rendered across the PRAVAAH frontend into its true data category, backend source, runtime status, and operational notes.

---

## 📊 Data Classification Matrix

| Component / Metric | Data Type | Source | Status | Operational Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Gridded Rainfall Series** | Real / Dataset | IMD NetCDF 0.25° Gridded Daily Rainfall Series (1981, 1986, 2022–2025) | **REAL** | Parsed via xarray/NetCDF4 for historical anomaly baseline & scenario surge calculation. |
| **Population Settlement Exposure** | Real / Dataset | WorldPop 2020 UN-Adjusted Constrained GeoTIFF (100m) | **REAL** | Extracted via Rasterio to compute grid-level settlement exposure counts. |
| **Composite Risk Score** | Derived | Backend Risk Engine | **REAL / DERIVED** | Formula: 45% Rainfall Score + 30% Anomaly Score + 25% Population Exposure Score. |
| **Spatial Demand Points** | Derived | Backend Response Engine | **REAL / DERIVED** | Continuous spatial demand weights calculated from grid risk scores and population exposure. |
| **Candidate Anchor Sites** | Predefined Domain Data | Backend Geography Schema | **SYNTHETIC DOMAIN DATA** | Fixed geographic anchor site coordinates in Krishna & Godavari delta reaches used by optimization. |
| **Coupled QUBO Matrix ($8 \times 8$)** | Real Computation | Backend Coupled QUBO Module | **REAL COMPUTATION** | Formulates coverage rewards, sensor budget $K_{\text{max}}=3$, relay budget $M_{\text{max}}=2$, and $C_{\text{disc}}=250$ penalty. |
| **Ising Model Transformation** | Real Computation | Backend Ising Module | **REAL COMPUTATION** | Spin operator substitution $x_i = \frac{1 - Z_i}{2}, y_j = \frac{1 - Z_j}{2}$ generating linear fields $h_i$ & couplings $J_{ij}$. |
| **QAOA Optimization Result** | Real Simulation | Backend Qiskit 2.5 Statevector Simulator | **REAL SIMULATION** | Solves Coupled QUBO/Ising formulation locally via statevector ansatz evaluation ($p=1, 2, 3$). |
| **Exact ILP & Greedy Solvers** | Real Computation | Backend Optimization Module | **REAL COMPUTATION** | Exact integer solver ground truth (415.5 score) and Greedy heuristic baseline (382.1 score). |
| **Decoded Sensor/Relay Deployment** | Real Computation | Backend Bitstring Decoder | **REAL COMPUTATION** | Bitstring (e.g. `10101111`) decoded directly into selected physical candidate site IDs and relay masts. |
| **River Gauge Discharge Telemetry** | Unavailable | Live Hydrologic Sensors | **UNAVAILABLE** | Live river level/discharge gauge telemetry is offline; explicitly displayed as "Telemetry Unavailable". |
| **Classical vs QML Benchmark** | Real / Experimental | Backend Forecasting Module | **EXPERIMENTAL BENCHMARK** | Experimental evaluation comparing Classical ML (XGBoost/RF) vs QML (VQC). QML is explicitly marked as experimental. |
| **Command Center HUD Alerts** | Real / Rule-Based | Backend Alert Engine | **REAL** | Warning threshold alerts derived deterministically from gridded rain anomaly & population risk. |
| **SDMA Email Dispatch** | Prototype | Frontend / UI Mock | **SIMULATED** | Mock channel for prototype UI; explicitly labeled as `SIMULATED / UI MOCK`. No actual emails are sent. |
| **WhatsApp Emergency Broadcast** | Prototype | Frontend / UI Mock | **SIMULATED** | Mock channel for prototype UI; explicitly labeled as `SIMULATED / UI MOCK`. No actual messages are sent. |
| **Optimization Workflow Sequence** | UI Animation | Frontend State Machine | **SIMULATED UI ANIMATION** | Animate stage sequence (`QUBO` → `Ising` → `QAOA`) during API fetch; replaced by actual backend result upon receipt. |

---

## 🛡️ Integrity Safeguards Implemented

1. **Zero Unsafe Fallback Numbers**: Unsafe fallbacks (e.g., `riskData?.score ?? 72`) have been removed. If API calls fail or return missing fields, the interface renders explicit `DATA UNAVAILABLE` cards with a retry action.
2. **Honest Quantum Claims**: No claims of "Quantum Hardware", "Quantum Speedup", or "Quantum Advantage" are presented. QAOA execution is explicitly labeled as **Qiskit 2.5 Statevector Simulation**.
3. **Transparent Prototype Disclaimers**: Candidate locations are explicitly identified as *Predefined Candidate Anchor Sites*, and notification channels are explicitly marked as *SIMULATED / UI MOCK*.
