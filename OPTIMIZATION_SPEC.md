# PRAVAAH Optimization Architecture & Mathematical Specification

## 1. Overview
PRAVAAH formulates the joint placement of flood response sensors and wireless communication relay infrastructure as a **Coupled Quadratic Unconstrained Binary Optimization (QUBO)** problem. The resulting QUBO is mapped to an Ising Spin Hamiltonian and solved via the **Quantum Approximate Optimization Algorithm (QAOA)** simulated with statevector fidelity in Qiskit 2.5.

---

## 2. Decision Variables
For a candidate set of $N$ sensors and $M$ communication relays, the decision vector $\mathbf{x} \in \{0,1\}^{N+M}$ is defined as:
$$\mathbf{x} = [x_0, x_1, \dots, x_{N-1}, y_0, y_1, \dots, y_{M-1}]^T$$
Where:
- $x_i \in \{0,1\}$: Binary decision to deploy sensor candidate $i$ ($i = 0 \dots N-1$).
- $y_j \in \{0,1\}$: Binary decision to activate communication relay mast $j$ ($j = 0 \dots M-1$).
- Total qubits: $N + M = 8$ (5 Sensors + 3 Relays for Krishna & Godavari operational domains).

---

## 3. Objective Function & QUBO Formulation
The total energy $H(\mathbf{x})$ to be **minimized** is:
$$H(\mathbf{x}) = \mathbf{x}^T \mathbf{Q} \mathbf{x} + \text{offset}$$

Where the QUBO matrix $\mathbf{Q} \in \mathbb{R}^{(N+M) \times (N+M)}$ incorporates the following component terms:

### A. Sensor Physical Utility & Reward (Diagonal $Q[i,i]$)
Each sensor $i$ yields a composite physical utility reward $R_i$ computed from spatial demand:
$$R_i = 0.45 \cdot \text{ForecastedRisk}_i + 0.35 \cdot \text{DemandScore}_i + 0.20 \cdot (\text{EarlyWarning}_i \times 100)$$
Diagonal contribution:
$$Q[i,i] \mathrel{-}= R_i$$

### B. Sensor Budget Penalty Constraint (Diagonal & Off-Diagonal)
To enforce at most $K_{\text{max}}$ active sensors under penalty weight $A = 120.0$:
$$A \left( \sum_{i=0}^{N-1} x_i - K_{\text{max}} \right)^2 = A \left( \sum_{i=0}^{N-1} x_i + 2 \sum_{i < j} x_i x_j - 2 K_{\text{max}} \sum_{i=0}^{N-1} x_i + K_{\text{max}}^2 \right)$$
- Diagonal: $Q[i,i] \mathrel{+}= A (1 - 2 K_{\text{max}})$
- Off-Diagonal: $Q[i,j] \mathrel{+}= 2A$
- Offset: $+ A \cdot K_{\text{max}}^2$

### C. Hardened Relay Budget Penalty Constraint (Diagonal & Off-Diagonal)
To strictly enforce at most $M_{\text{max}}$ active relays under hardened penalty weight $B = 350.0$:
$$B \left( \sum_{j=0}^{M-1} y_j - M_{\text{max}} \right)^2$$
- Diagonal: $Q[N+j, N+j] \mathrel{+}= 20.0 + B (1 - 2 M_{\text{max}})$
- Off-Diagonal: $Q[N+j_1, N+j_2] \mathrel{+}= 2B$
- Offset: $+ B \cdot M_{\text{max}}^2$

> **Mathematical Proof of Relay Budget Hardening**:
> The disconnection penalty for an unlinked sensor is $C_{\text{disc}} = 250.0$. By setting $B = 350.0 > C_{\text{disc}} = 250.0$, adding an unbudgeted $(M_{\text{max}}+1)$-th relay to gain coverage incurs a penalty of at least $+350.0$. Since $+350.0 > 250.0$, violating $M_{\text{max}}$ is **strictly suboptimal** under all network topologies and can never be selected by the ground-truth exact or QAOA solver.

### D. Sensor Disconnection & Wireless Connectivity Penalty
Let $\mathbf{A}_{\text{conn}} \in \{0,1\}^{N \times M}$ be the wireless reachability matrix ($A_{ij} = 1$ if distance between sensor $i$ and relay $j$ is $\le 15.0\text{ km}$).
If sensor $x_i = 1$ and no connected relay $y_j = 1$ is activated, penalty $C_{\text{disc}} = 250.0$ is incurred:
$$Q[i,i] \mathrel{+}= C_{\text{disc}}$$
$$Q[i, N+j] \mathrel{-}= C_{\text{disc}} \quad \forall j \text{ s.t. } A_{ij} = 1$$

---

## 4. Scenario Propagation Mapping
The flood scenario selected in the UI dynamically scales the surge intensity $\sigma$:
- **NORMAL**: $\sigma = 0.25$
- **MONSOON_SURGE**: $\sigma = 0.80$
- **EXTREME_CYCLONE**: $\sigma = 1.25$

Spatial demand engine updates forecasted risk:
$$\text{ForecastedRisk}_i = \min\left(99, \max\left(10, \text{round}(\text{RiskScore}_i \times (1.0 + \sigma \times 0.4))\right)\right)$$

This shifts the QUBO diagonal terms $Q[i,i]$, modifying the energy landscape and altering optimal sensor selections across different scenarios.

---

## 5. QAOA Execution & Bitstring Decoding
1. **Ising Mapping**: Binary variables $x_i \in \{0,1\}$ are transformed to Pauli-Z spin operators $Z_i \in \{+1, -1\}$ via $Z_i = 1 - 2x_i$.
2. **QAOA Circuit**: Evaluated with depth $p \in \{1, 2, 3\}$ using classical parameter optimization (COBYLA/Nelder-Mead) over variational angles $(\boldsymbol{\gamma}, \boldsymbol{\beta})$.
3. **Canonical Decoding**:
   - Bits $0 \dots N-1 \to$ Sensor selection states
   - Bits $N \dots N+M-1 \to$ Relay selection states
