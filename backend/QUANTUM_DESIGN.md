# QUANTUM DESIGN SPECIFICATION: QAOA FLOOD SENSOR PLACEMENT

## 1. Problem Definition
The optimal sensor placement problem aims to select exactly $K$ sensor sites from $N$ candidate locations in a river basin (Krishna or Godavari) to maximize flood monitoring utility while staying within structural and resource constraints.

Decision variables:
$$x_i \in \{0, 1\} \quad \text{where } x_i = 1 \text{ if candidate } i \text{ is selected, else } 0$$

## 2. Objective Function & Coverage Model
Every candidate site $i$ covers target location $j$ if their geographic Haversine distance $d(i, j) \le R_{\text{coverage}}$.
The coverage matrix $C \in \{0, 1\}^{N \times M}$ maps candidates to target risk zones.

The unconstrained maximization objective balances risk-weighted coverage, population-weighted exposure, and sensor cost penalties:
$$\text{Maximize } f(x) = \sum_{i=1}^N w_{\text{risk}} \cdot \text{Risk}_i \cdot x_i + \sum_{i=1}^N w_{\text{pop}} \cdot \text{Pop}_i \cdot x_i - \sum_{i < j} w_{\text{redundant}} \cdot C_{ij} \cdot x_i x_j$$

## 3. QUBO Formulation
Because Quadratic Unconstrained Binary Optimization (QUBO) is minimization-oriented ($Q(x) = x^T Q x + c$), we convert the maximization objective into energy minimization:

$$Q(x) = -f(x) + A \left( \sum_{i=1}^N x_i - K \right)^2$$

Expanding the quadratic cardinality constraint:
$$A \left( \sum_{i=1}^N x_i - K \right)^2 = A \left( \sum_{i=1}^N x_i^2 + 2 \sum_{i < j} x_i x_j - 2K \sum_{i=1}^N x_i + K^2 \right)$$

Using $x_i^2 = x_i$ for binary variables:
$$Q_{ii} = - (w_{\text{risk}} \cdot \text{Risk}_i + w_{\text{pop}} \cdot \text{Pop}_i) + A(1 - 2K)$$
$$Q_{ij} = w_{\text{redundant}} \cdot C_{ij} + 2A \quad (i < j)$$
$$\text{Offset } c = A \cdot K^2$$

## 4. Ising Hamiltonian Mapping
Using the mapping $x_i = \frac{1 - Z_i}{2}$ where $Z_i \in \{+1, -1\}$ are Pauli-$Z$ operators:

$$H_C = \sum_{i} h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + C_{\text{offset}}$$

Where:
$$J_{ij} = \frac{Q_{ij}}{4}$$
$$h_i = -\frac{Q_{ii}}{2} - \sum_{j \ne i} \frac{Q_{ij}}{4}$$

## 5. QAOA Circuit Structure
The Quantum Approximate Optimization Algorithm (QAOA) creates a parameterized state $|\gamma, \beta\rangle$:

$$|\gamma, \beta\rangle = U(B, \beta_p) U(H_C, \gamma_p) \cdots U(B, \beta_1) U(H_C, \gamma_1) |+\rangle^{\otimes N}$$

- **Initial State:** $|+\rangle^{\otimes N} = H^{\otimes N} |0\otimes N\rangle$
- **Cost Unitary:** $U(H_C, \gamma) = e^{-i \gamma H_C}$, realized with $R_Z(2 \gamma h_i)$ on single qubits and $R_{ZZ}(2 \gamma J_{ij})$ between coupled qubits.
- **Mixer Unitary:** $U(B, \beta) = e^{-i \beta \sum Z_i} \rightarrow e^{-i \beta \sum X_i}$, realized with $R_X(2 \beta)$ on all qubits.

## 6. Classical Optimizer & Solution Extraction
Parameters $(\gamma, \beta)$ are optimized using COBYLA or SPSA against statevector/shot expectations. Measurement yields a bitstring $x \in \{0,1\}^N$, decoded back to selected sensor coordinates.
