# FORECASTING DESIGN SPECIFICATION: HEAVY RAINFALL SURGE PREDICTION

## 1. Problem Formulation

To support UC-067 without fabricating unavailable river level data, the forecasting task predicts the **probability of an extreme rainfall surge event** $Y_{t+1} \in \{0, 1\}$ over a 24-hour horizon using a sliding window of historical precipitation observations:

$$Y_{t+1} = \begin{cases} 1 & \text{if } R_{t+1} \ge 30.0 \text{ mm/day (Severe Surge)} \\ 0 & \text{otherwise} \end{cases}$$

## 2. Input Features ($X_t$)

Extracted deterministically from IMD NetCDF daily grid series:

1. $R_t$: Current day precipitation ($\text{mm}$)
2. $R_{t-1}$: Previous day precipitation ($\text{mm}$)
3. $R_{t-2}$: 2-day prior precipitation ($\text{mm}$)
4. $\text{Mean}_{3d}$: 3-day rolling mean ($\frac{R_t + R_{t-1} + R_{t-2}}{3}$)
5. $\text{Sum}_{3d}$: 3-day rolling accumulation ($R_t + R_{t-1} + R_{t-2}$)
6. $\text{Anomaly}_{hist}$: Ratio vs historical baseline year ($\frac{\text{Sum}_{3d} - \text{HistAvg}}{\text{HistAvg}}$)

## 3. Evaluation Metrics & Splitting

- **Chronological Train/Test Split:**
  - **Train Set:** Years 1981, 1986, 2022, 2023 (1,460 timesteps)
  - **Test Set:** Years 2024, 2025 (731 timesteps)
- **Strict Constraint:** Temporal ordering is preserved. Random shuffling is disabled to prevent data leakage.
- **Classification Metrics:** Accuracy, Precision, Recall, F1-Score, ROC-AUC.

## 4. Coupled Pipeline Integration

$$\text{IMD NetCDF Series} \xrightarrow{\text{Features}} \text{Classifier (Classical / QML)} \xrightarrow{\text{P(Surge)}} \text{Forecasted Risk} \xrightarrow{\text{Demographics}} \text{Response Demand} \xrightarrow{\text{Coupled QUBO}} \text{QAOA Network}$$
