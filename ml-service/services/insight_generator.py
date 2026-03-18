from __future__ import annotations

from statistics import median

import numpy as np

from models.schemas import InsightGenerationRequest


class InsightGenerator:
    def generate(self, payload: InsightGenerationRequest) -> list[dict[str, str]]:
        insights: list[dict[str, str]] = []

        current_map = {item.category: float(item.total) for item in payload.current_category_totals}
        previous_map = {item.category: float(item.total) for item in payload.previous_category_totals}

        for category, current_total in current_map.items():
            previous_total = previous_map.get(category, 0.0)
            if previous_total <= 0:
                continue
            growth = (current_total - previous_total) / previous_total
            if growth >= 0.12:
                insights.append(
                    {
                        "level": "warning",
                        "message": (
                            f"Pengeluaran kategori {category} meningkat {round(growth * 100)}% "
                            "dibanding bulan lalu."
                        ),
                    }
                )
            elif growth <= -0.12:
                insights.append(
                    {
                        "level": "info",
                        "message": (
                            f"Pengeluaran kategori {category} turun {round(abs(growth) * 100)}% "
                            "dibanding bulan lalu."
                        ),
                    }
                )

        if current_map:
            top_category = max(current_map.items(), key=lambda item: item[1])
            insights.append(
                {
                    "level": "info",
                    "message": (
                        f"Kategori {top_category[0]} adalah pengeluaran terbesar bulan ini."
                    ),
                }
            )

        for budget in payload.budgets:
            if budget.amount_limit <= 0:
                continue
            spent_ratio = budget.spent / budget.amount_limit
            if spent_ratio >= 0.85:
                insights.append(
                    {
                        "level": "warning",
                        "message": (
                            f"Kategori {budget.category} telah memakai {round(spent_ratio * 100)}% "
                            "budget bulan ini."
                        ),
                    }
                )

            predicted_spent = budget.predicted_spent or budget.spent
            if predicted_spent > budget.amount_limit:
                insights.append(
                    {
                        "level": "critical",
                        "message": (
                            f"Berdasarkan tren saat ini, budget {budget.category} berpotensi "
                            "terlewati sebelum akhir bulan."
                        ),
                    }
                )

        prediction = payload.prediction_summary
        if (
            prediction.historical_average_last_3_months > 0
            and prediction.predicted_monthly_expense > prediction.historical_average_last_3_months * 1.08
        ):
            insights.append(
                {
                    "level": "warning",
                    "message": (
                        "Prediksi pengeluaran bulan ini lebih tinggi dari rata-rata 3 bulan terakhir."
                    ),
                }
            )

        if payload.recent_transactions:
            amounts = np.array([float(item.amount) for item in payload.recent_transactions], dtype=float)
            if len(amounts) >= 4:
                q1 = float(np.percentile(amounts, 25))
                q3 = float(np.percentile(amounts, 75))
                iqr = q3 - q1
                threshold = q3 + 1.5 * iqr
                outlier = next(
                    (item for item in payload.recent_transactions if float(item.amount) > threshold),
                    None,
                )
                if outlier:
                    insights.append(
                        {
                            "level": "warning",
                            "message": "Ada transaksi yang lebih besar dari pola normal pengeluaranmu.",
                        }
                    )
            else:
                amount_median = median(float(item.amount) for item in payload.recent_transactions)
                outlier = next(
                    (
                        item
                        for item in payload.recent_transactions
                        if float(item.amount) > amount_median * 2.5
                    ),
                    None,
                )
                if outlier:
                    insights.append(
                        {
                            "level": "warning",
                            "message": "Ada transaksi yang terlihat tidak biasa dibanding pola sebelumnya.",
                        }
                    )

        if not insights:
            insights.append(
                {
                    "level": "info",
                    "message": "Pola pengeluaranmu relatif stabil bulan ini. Pertahankan konsistensinya.",
                }
            )

        deduped: list[dict[str, str]] = []
        seen = set()
        for item in insights:
            key = item["message"]
            if key in seen:
                continue
            seen.add(key)
            deduped.append(item)

        return deduped[:6]
