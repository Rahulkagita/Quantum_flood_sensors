"""
Classical Baseline Forecaster (Phase 4C).

Extracts temporal features from IMD NetCDF daily series across years 1981, 1986, 2022, 2023 (Train)
and evaluates on years 2024, 2025 (Test) using chronological splitting.
Models: Logistic Regression, Random Forest.
"""
from typing import Dict, List, Tuple, Optional
import numpy as np
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from app.data.nc_reader import RainfallDatasetReader

class ForecastingMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    num_train_samples: int
    num_test_samples: int

class ClassicalForecaster:
    def __init__(self, nc_reader: Optional[RainfallDatasetReader] = None):
        self.nc_reader = nc_reader or RainfallDatasetReader()

    def build_dataset(self, lon: float = 80.648, lat: float = 16.506) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Builds chronological feature matrices X and binary surge targets Y (R_{t+1} >= 30mm).
        """
        train_years = [1981, 1986, 2022, 2023]
        test_years = [2024, 2025]

        X_train, y_train = self._extract_features_for_years(train_years, lon, lat)
        X_test, y_test = self._extract_features_for_years(test_years, lon, lat)

        return X_train, y_train, X_test, y_test

    def _extract_features_for_years(self, years: List[int], lon: float, lat: float) -> Tuple[np.ndarray, np.ndarray]:
        X_list, y_list = [], []

        for y in years:
            try:
                series = self.nc_reader.sample_rainfall_for_point(lon, lat, year=y, day_indices=list(range(365)))
            except Exception:
                continue

            for t in range(2, len(series) - 1):
                r_t = series[t]
                r_t1 = series[t - 1]
                r_t2 = series[t - 2]
                sum_3d = r_t + r_t1 + r_t2
                mean_3d = sum_3d / 3.0
                target = 1.0 if series[t + 1] >= 25.0 else 0.0

                X_list.append([r_t, r_t1, r_t2, sum_3d, mean_3d])
                y_list.append(target)

        return np.array(X_list, dtype=float), np.array(y_list, dtype=float)

    def train_and_evaluate(self, lon: float = 80.648, lat: float = 16.506) -> Dict[str, ForecastingMetrics]:
        X_train, y_train, X_test, y_test = self.build_dataset(lon, lat)

        # Baseline 1: Logistic Regression
        lr = LogisticRegression(max_iter=500, random_state=42)
        lr.fit(X_train, y_train)
        lr_preds = lr.predict(X_test)
        lr_probs = lr.predict_proba(X_test)[:, 1] if len(np.unique(y_test)) > 1 else lr_preds

        lr_metrics = ForecastingMetrics(
            model_name="Logistic Regression",
            accuracy=round(float(accuracy_score(y_test, lr_preds)), 4),
            precision=round(float(precision_score(y_test, lr_preds, zero_division=0)), 4),
            recall=round(float(recall_score(y_test, lr_preds, zero_division=0)), 4),
            f1_score=round(float(f1_score(y_test, lr_preds, zero_division=0)), 4),
            roc_auc=round(float(roc_auc_score(y_test, lr_probs)) if len(np.unique(y_test)) > 1 else 0.5, 4),
            num_train_samples=len(X_train),
            num_test_samples=len(X_test)
        )

        # Baseline 2: Random Forest Classifier
        rf = RandomForestClassifier(n_estimators=50, random_state=42)
        rf.fit(X_train, y_train)
        rf_preds = rf.predict(X_test)
        rf_probs = rf.predict_proba(X_test)[:, 1] if len(np.unique(y_test)) > 1 else rf_preds

        rf_metrics = ForecastingMetrics(
            model_name="Random Forest",
            accuracy=round(float(accuracy_score(y_test, rf_preds)), 4),
            precision=round(float(precision_score(y_test, rf_preds, zero_division=0)), 4),
            recall=round(float(recall_score(y_test, rf_preds, zero_division=0)), 4),
            f1_score=round(float(f1_score(y_test, rf_preds, zero_division=0)), 4),
            roc_auc=round(float(roc_auc_score(y_test, rf_probs)) if len(np.unique(y_test)) > 1 else 0.5, 4),
            num_train_samples=len(X_train),
            num_test_samples=len(X_test)
        )

        return {"logistic_regression": lr_metrics, "random_forest": rf_metrics}
