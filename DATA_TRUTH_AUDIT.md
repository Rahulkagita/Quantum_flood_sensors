# DATA TRUTH AUDIT — PRAVAAH / UC-067

**Date**: October 8, 2026  
**Status**: Comprehensive Data Classification Audit Complete  

---

## 1. Audit Inventory

| Data / Value | Source | Classification | Used Where | Keep/Remove |
| :--- | :--- | :--- | :--- | :--- |
| **IMD 0.25x0.25° Gridded Rainfall Series** | IMD NetCDF Series (`data/`) | **REAL DATA** | `nc_reader.py` → `flood_risk.py` | **Keep** |
| **WorldPop 2020 Population GeoTIFF** | WorldPop `ind_ppp_2020_UNadj_constrained.tif` | **REAL DATA** | `population_sampler.py` | **Keep** |
| **River Gauge Telemetry & Water Level** | None (`river_level: null`) | **PROTOTYPE ASSUMPTION / EXPLICITLY UNAVAILABLE** | `flood_risk.py` (`water_level_status: "unavailable"`) | **Keep (Honest Null)** |
| **Rainfall Anomaly & Composite Risk Score** | Computed from 3-day IMD rainfall + 30yr baseline | **DERIVED DATA** | `/`, `/forecast`, `/network-optimization` | **Keep** |
| **Spatial Response Demand Points** | Computed: $0.50 \cdot \text{Risk} + 0.35 \cdot \text{Pop} + 0.15 \cdot \text{EarlyWarning}$ | **DERIVED DATA** | `hardened_coupled_qubo.py` & Demand Hotspots | **Keep** |
| **Candidate Sensor Locations** | Pre-seeded bounding box coordinates (10 nodes/basin) | **PROTOTYPE ASSUMPTION** | `candidate_generator.py` & Map overlays | **Keep** |
| **Communication Relay Locations** | Fixed gateway nodes (3 nodes/basin) | **PROTOTYPE ASSUMPTION** | `communication.py` & Connectivity Model | **Keep** |
| **QUBO & Ising Hamiltonian** | Formulated dynamically by `HardenedCoupledQuboGenerator` | **OPTIMIZED RESULT** | `/quantum-optimizer`, `/network-optimization` | **Keep** |
| **QAOA Statevector Circuit & Energy** | Qiskit 2.x Statevector Simulator (`qaoa.py`) | **SIMULATED OUTPUT / OPTIMIZED RESULT** | `/quantum-optimizer` benchmark | **Keep** |
| **Scenario Stress Multipliers** | User-selected multipliers ($0.25, 0.80, 1.25$) | **PROTOTYPE ASSUMPTION** | `scenario_engine.py` & `api.py` | **Keep (Stress Multipliers)** |
| **Email & WhatsApp Alert Dispatch** | Simulated local channel state (`connected: false`) | **SIMULATED OUTPUT** | `alert_service.py` & Warning Center | **Keep (Marked Simulated)** |
| **Client HTTP Fallback** | `api-client.ts` offline catch block | **SIMULATED OUTPUT / FALLBACK** | `src/lib/api-client.ts` | **Keep (Offline Fallback)** |

---

## 2. Integrity Verification

1. **No Fake Telemetry**: River gauge readings are explicitly reported as `null` / `"unavailable (gauge dataset not supplied)"`.
2. **No Misleading Quantum Claims**: All quantum computations state `"Evaluated using Qiskit Statevector simulation"`.
3. **No Fake Backend Integrations**: External SMS/WhatsApp alerts explicitly report `connected: false` and `label: "Simulated"`.
4. **End-to-End Functional Chain**: Real IMD rainfall + WorldPop demographics feed directly into flood risk, spatial demand, QUBO formulation, and candidate selection.
