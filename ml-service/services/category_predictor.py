from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys

try:
    import joblib
except ModuleNotFoundError:  # pragma: no cover - defensive fallback for local envs
    joblib = None

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from utils.text import normalize_text

ARTIFACTS_DIR = ROOT_DIR / "artifacts"
CATEGORY_MODEL_PATH = ARTIFACTS_DIR / "category_pipeline.joblib"


KEYWORD_FALLBACK = {
    "gaji": "Gaji",
    "salary": "Gaji",
    "freelance": "Gaji",
    "kopi": "Makanan",
    "makan": "Makanan",
    "gojek": "Transportasi",
    "grab": "Transportasi",
    "spotify": "Hiburan",
    "netflix": "Hiburan",
    "bioskop": "Hiburan",
}


@dataclass
class CategoryPredictionResult:
    predicted_label: str
    confidence_score: float
    alternatives: list[dict[str, float | str]]
    model_source: str


class CategoryPredictor:
    def __init__(self) -> None:
        self.pipeline = None
        if CATEGORY_MODEL_PATH.exists() and joblib is not None:
            self.pipeline = joblib.load(CATEGORY_MODEL_PATH)

    def _predict_with_model(self, text: str) -> tuple[str, float, list[dict[str, float | str]]]:
        transformed = [normalize_text(text)]

        if hasattr(self.pipeline, "predict_proba"):
            probabilities = self.pipeline.predict_proba(transformed)[0]
            labels = list(self.pipeline.classes_)
            ranked = sorted(
                zip(labels, probabilities, strict=False),
                key=lambda item: float(item[1]),
                reverse=True,
            )
            predicted_label = ranked[0][0]
            confidence = float(ranked[0][1])
            alternatives = [
                {"label": label, "score": float(score)}
                for label, score in ranked[:3]
            ]
            return predicted_label, confidence, alternatives

        predicted_label = str(self.pipeline.predict(transformed)[0])
        confidence = 0.66
        alternatives = [{"label": predicted_label, "score": confidence}]
        return predicted_label, confidence, alternatives

    def _predict_with_keyword(self, text: str) -> tuple[str, float]:
        normalized = normalize_text(text)
        for keyword, label in KEYWORD_FALLBACK.items():
            if keyword in normalized:
                return label, 0.72
        return "Lainnya", 0.55

    def predict(
        self,
        description: str,
        transaction_type: str,
        candidate_labels: list[str] | None = None,
    ) -> CategoryPredictionResult:
        if self.pipeline is not None:
            predicted, confidence, alternatives = self._predict_with_model(description)
            source = "tfidf_logreg"
        else:
            predicted, confidence = self._predict_with_keyword(description)
            alternatives = [{"label": predicted, "score": confidence}]
            source = "keyword_fallback"

        if transaction_type == "INCOME":
            predicted = "Gaji" if predicted != "Gaji" else predicted
            confidence = max(confidence, 0.6)
            alternatives = [{"label": "Gaji", "score": confidence}]

        if candidate_labels:
            label_map = {label.lower(): label for label in candidate_labels}
            matched = label_map.get(predicted.lower())
            if not matched:
                best = next(
                    (label for label in candidate_labels if label.lower() == "lainnya"),
                    candidate_labels[0],
                )
                predicted = best
                confidence = min(confidence, 0.65)
            else:
                predicted = matched

            filtered_alternatives: list[dict[str, float | str]] = []
            for item in alternatives:
                label = str(item["label"])
                if label.lower() in label_map:
                    filtered_alternatives.append(
                        {"label": label_map[label.lower()], "score": float(item["score"])}
                    )
            alternatives = filtered_alternatives or [{"label": predicted, "score": confidence}]

        return CategoryPredictionResult(
            predicted_label=predicted,
            confidence_score=round(float(confidence), 4),
            alternatives=alternatives,
            model_source=source,
        )
