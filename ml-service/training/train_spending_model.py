from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "training" / "data" / "spending_dataset.csv"
ARTIFACT_PATH = ROOT / "artifacts" / "spending_regressor.joblib"


def main() -> None:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    required_columns = {"month_index", "total_expense"}
    if not required_columns.issubset(df.columns):
        raise ValueError("Dataset must have columns: month_index,total_expense")

    x = df[["month_index"]].to_numpy(dtype=float)
    y = df["total_expense"].to_numpy(dtype=float)

    if len(df) < 4:
        raise ValueError("Provide at least 4 rows for spending model training.")

    split_index = int(len(df) * 0.8)
    x_train, x_test = x[:split_index], x[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    model = LinearRegression()
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"MAE: {mae:.2f}")

    future_month = np.array([[x[-1][0] + 1]])
    forecast = model.predict(future_month)[0]
    print(f"Next month baseline forecast: {forecast:.2f}")

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_PATH)
    print(f"Saved model to: {ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
