from typing import Literal

from pydantic import BaseModel, Field


class CategoryPredictionRequest(BaseModel):
    description: str = Field(default="")
    transaction_type: Literal["EXPENSE", "INCOME"] = Field(default="EXPENSE")
    candidate_labels: list[str] | None = None


class CategoryAlternative(BaseModel):
    label: str
    score: float


class CategoryPredictionResponse(BaseModel):
    predicted_label: str
    confidence_score: float
    alternatives: list[CategoryAlternative] = []
    model_source: str


class DailyExpensePoint(BaseModel):
    date: str
    amount: float


class MonthlyExpensePoint(BaseModel):
    month: str
    total: float


class CategoryDailyExpensePoint(BaseModel):
    category: str
    date: str
    amount: float


class SpendingPredictionRequest(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    daily_expenses: list[DailyExpensePoint] = []
    historical_monthly_expenses: list[MonthlyExpensePoint] = []
    category_daily_expenses: list[CategoryDailyExpensePoint] = []


class CategoryForecast(BaseModel):
    category: str
    current_spent: float
    predicted_monthly_spent: float


class SpendingPredictionResponse(BaseModel):
    predicted_monthly_expense: float
    current_month_expense: float
    historical_average_last_3_months: float
    trend_direction: Literal["UP", "DOWN", "STABLE"]
    confidence_score: float
    days_elapsed: int
    days_in_month: int
    category_forecasts: list[CategoryForecast] = []


class InsightBudgetPoint(BaseModel):
    category: str
    amount_limit: float
    spent: float
    predicted_spent: float | None = None


class InsightCategoryTotal(BaseModel):
    category: str
    total: float


class InsightTransactionPoint(BaseModel):
    description: str = ""
    category: str = "Uncategorized"
    amount: float


class InsightPredictionSummary(BaseModel):
    predicted_monthly_expense: float
    current_month_expense: float
    historical_average_last_3_months: float
    trend_direction: Literal["UP", "DOWN", "STABLE"] = "STABLE"


class InsightGenerationRequest(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    current_category_totals: list[InsightCategoryTotal] = []
    previous_category_totals: list[InsightCategoryTotal] = []
    budgets: list[InsightBudgetPoint] = []
    prediction_summary: InsightPredictionSummary
    recent_transactions: list[InsightTransactionPoint] = []


class InsightItem(BaseModel):
    message: str
    level: Literal["info", "warning", "critical"] = "info"


class InsightGenerationResponse(BaseModel):
    insights: list[InsightItem]
