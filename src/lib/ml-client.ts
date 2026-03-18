const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8001";

type MlCategoryPredictionRequest = {
  description: string;
  transaction_type: "EXPENSE" | "INCOME";
  candidate_labels?: string[];
};

export type MlCategoryPredictionResponse = {
  predicted_label: string;
  confidence_score: number;
  alternatives: Array<{ label: string; score: number }>;
  model_source: string;
};

type SpendingDailyPoint = {
  date: string;
  amount: number;
};

type SpendingMonthlyPoint = {
  month: string;
  total: number;
};

type SpendingCategoryDailyPoint = {
  category: string;
  date: string;
  amount: number;
};

export type MlSpendingPredictionRequest = {
  month: number;
  year: number;
  daily_expenses: SpendingDailyPoint[];
  historical_monthly_expenses: SpendingMonthlyPoint[];
  category_daily_expenses: SpendingCategoryDailyPoint[];
};

export type MlSpendingPredictionResponse = {
  predicted_monthly_expense: number;
  current_month_expense: number;
  historical_average_last_3_months: number;
  trend_direction: "UP" | "DOWN" | "STABLE";
  confidence_score: number;
  days_elapsed: number;
  days_in_month: number;
  category_forecasts: Array<{
    category: string;
    current_spent: number;
    predicted_monthly_spent: number;
  }>;
};

export type MlInsightRequest = {
  month: number;
  year: number;
  current_category_totals: Array<{ category: string; total: number }>;
  previous_category_totals: Array<{ category: string; total: number }>;
  budgets: Array<{
    category: string;
    amount_limit: number;
    spent: number;
    predicted_spent?: number;
  }>;
  prediction_summary: {
    predicted_monthly_expense: number;
    current_month_expense: number;
    historical_average_last_3_months: number;
    trend_direction: "UP" | "DOWN" | "STABLE";
  };
  recent_transactions: Array<{ description: string; category: string; amount: number }>;
};

export type MlInsightResponse = {
  insights: Array<{ message: string; level: "info" | "warning" | "critical" }>;
};

async function postMl<T>(path: string, payload: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function predictCategoryMl(payload: MlCategoryPredictionRequest) {
  return postMl<MlCategoryPredictionResponse>("/predict/category", payload);
}

export function predictSpendingMl(payload: MlSpendingPredictionRequest) {
  return postMl<MlSpendingPredictionResponse>("/predict/spending", payload);
}

export function generateInsightsMl(payload: MlInsightRequest) {
  return postMl<MlInsightResponse>("/insights/generate", payload);
}
