from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LinearRegression

from models.schemas import SpendingPredictionRequest

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"
SPENDING_MODEL_PATH = ARTIFACTS_DIR / "spending_regressor.joblib"


@dataclass
class SpendingPredictionResult:
    predicted_monthly_expense: float
    current_month_expense: float
    historical_average_last_3_months: float
    trend_direction: str
    confidence_score: float
    days_elapsed: int
    days_in_month: int
    category_forecasts: list[dict[str, float | str]]


class SpendingPredictor:
    def __init__(self) -> None:
        self.model = None
        if SPENDING_MODEL_PATH.exists():
            self.model = joblib.load(SPENDING_MODEL_PATH)

    def _predict_next_from_history(self, history: list[float]) -> float:
        if not history:
            return 0.0
        if len(history) == 1:
            return history[0]

        x = np.arange(len(history)).reshape(-1, 1)
        y = np.array(history, dtype=float)

        if self.model is not None:
            try:
                prediction = float(self.model.predict(np.array([[len(history)]]))[0])
                return max(0.0, prediction)
            except Exception:
                pass

        model = LinearRegression()
        model.fit(x, y)
        prediction = float(model.predict(np.array([[len(history)]]))[0])
        return max(0.0, prediction)

    def predict(self, payload: SpendingPredictionRequest) -> SpendingPredictionResult:
        days_in_month = calendar.monthrange(payload.year, payload.month)[1]
        parsed_days = [
            datetime.fromisoformat(point.date).day
            for point in payload.daily_expenses
        ]
        days_elapsed = max(parsed_days) if parsed_days else 0
        current_spent = float(sum(point.amount for point in payload.daily_expenses))
        run_rate = (current_spent / days_elapsed) if days_elapsed > 0 else 0.0
        run_rate_projection = run_rate * days_in_month if days_elapsed > 0 else 0.0

        sorted_history = sorted(payload.historical_monthly_expenses, key=lambda item: item.month)
        historical_totals = [float(item.total) for item in sorted_history]
        historical_avg_last_3 = (
            float(np.mean(historical_totals[-3:])) if historical_totals else 0.0
        )
        historical_projection = self._predict_next_from_history(historical_totals)

        if current_spent > 0 and days_elapsed > 0:
            baseline = historical_projection or historical_avg_last_3 or run_rate_projection
            predicted = 0.65 * run_rate_projection + 0.35 * baseline
        else:
            predicted = historical_projection or historical_avg_last_3

        predicted = max(current_spent, float(predicted))
        delta = (
            (predicted - historical_avg_last_3) / historical_avg_last_3
            if historical_avg_last_3 > 0
            else 0.0
        )
        if delta > 0.08:
            trend = "UP"
        elif delta < -0.08:
            trend = "DOWN"
        else:
            trend = "STABLE"

        history_signal = min(len(historical_totals) / 6, 1.0) * 0.25
        progress_signal = min(days_elapsed / max(days_in_month, 1), 1.0) * 0.2
        confidence = min(0.95, 0.5 + history_signal + progress_signal)

        category_sums: dict[str, float] = {}
        for point in payload.category_daily_expenses:
            category_sums[point.category] = category_sums.get(point.category, 0.0) + float(point.amount)

        category_forecasts = []
        for category, spent in category_sums.items():
            projected = (spent / max(days_elapsed, 1)) * days_in_month if days_elapsed > 0 else spent
            category_forecasts.append(
                {
                    "category": category,
                    "current_spent": round(float(spent), 2),
                    "predicted_monthly_spent": round(float(max(projected, spent)), 2),
                }
            )

        category_forecasts.sort(key=lambda item: float(item["predicted_monthly_spent"]), reverse=True)

        return SpendingPredictionResult(
            predicted_monthly_expense=round(predicted, 2),
            current_month_expense=round(current_spent, 2),
            historical_average_last_3_months=round(historical_avg_last_3, 2),
            trend_direction=trend,
            confidence_score=round(confidence, 4),
            days_elapsed=days_elapsed,
            days_in_month=days_in_month,
            category_forecasts=category_forecasts,
        )
