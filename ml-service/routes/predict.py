from fastapi import APIRouter

from models.schemas import (
    CategoryPredictionRequest,
    CategoryPredictionResponse,
    SpendingPredictionRequest,
    SpendingPredictionResponse,
)
from services.category_predictor import CategoryPredictor
from services.spending_predictor import SpendingPredictor

router = APIRouter(prefix="/predict", tags=["predict"])

category_predictor = CategoryPredictor()
spending_predictor = SpendingPredictor()


@router.post("/category", response_model=CategoryPredictionResponse)
async def predict_category(payload: CategoryPredictionRequest):
    result = category_predictor.predict(
        description=payload.description,
        transaction_type=payload.transaction_type,
        candidate_labels=payload.candidate_labels,
    )
    return {
        "predicted_label": result.predicted_label,
        "confidence_score": result.confidence_score,
        "alternatives": result.alternatives,
        "model_source": result.model_source,
    }


@router.post("/spending", response_model=SpendingPredictionResponse)
async def predict_spending(payload: SpendingPredictionRequest):
    result = spending_predictor.predict(payload)
    return {
        "predicted_monthly_expense": result.predicted_monthly_expense,
        "current_month_expense": result.current_month_expense,
        "historical_average_last_3_months": result.historical_average_last_3_months,
        "trend_direction": result.trend_direction,
        "confidence_score": result.confidence_score,
        "days_elapsed": result.days_elapsed,
        "days_in_month": result.days_in_month,
        "category_forecasts": result.category_forecasts,
    }
