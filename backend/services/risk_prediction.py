"""
Disease Risk Prediction Service.

Uses a simple logistic-regression–style scoring algorithm for the MVP.
In production, replace with trained ML models (scikit-learn, XGBoost, etc.).
"""
import math
from typing import Dict, Any, Tuple


# Feature weights (mock — replace with trained model coefficients)
DIABETES_WEIGHTS: Dict[str, float] = {
    "age": 0.03,
    "bmi": 0.08,
    "glucose": 0.04,
    "blood_pressure_systolic": 0.015,
    "blood_pressure_diastolic": 0.01,
    "insulin": 0.005,
    "skin_thickness": 0.002,
    "pregnancies": 0.02,
    "smoking": 0.15,
    "alcohol": 0.1,
}

HEART_DISEASE_WEIGHTS: Dict[str, float] = {
    "age": 0.04,
    "bmi": 0.05,
    "cholesterol": 0.03,
    "blood_pressure_systolic": 0.025,
    "blood_pressure_diastolic": 0.02,
    "smoking": 0.25,
    "alcohol": 0.08,
    "glucose": 0.02,
}


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _compute_risk(data: Dict[str, Any], weights: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    """Compute a risk score using weighted features put through a sigmoid."""
    z = -3.5  # intercept (bias towards low risk for safety)
    importance: Dict[str, float] = {}

    for feature, weight in weights.items():
        value = data.get(feature)
        if value is None:
            continue
        if isinstance(value, bool):
            value = 1.0 if value else 0.0
        contribution = float(value) * weight
        z += contribution
        importance[feature] = round(abs(contribution), 4)

    # Normalize importance
    total = sum(importance.values()) or 1
    importance = {k: round(v / total, 3) for k, v in sorted(importance.items(), key=lambda x: -x[1])}

    return round(_sigmoid(z), 4), importance


def categorize_risk(score: float) -> str:
    if score < 0.3:
        return "low"
    elif score < 0.6:
        return "moderate"
    else:
        return "high"


def predict_diabetes_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    score, importance = _compute_risk(data, DIABETES_WEIGHTS)
    category = categorize_risk(score)
    explanation = _generate_explanation("diabetes", score, category, importance)
    return {
        "disease_type": "diabetes",
        "risk_score": score,
        "risk_category": category,
        "feature_importance": importance,
        "explanation": explanation,
    }


def predict_heart_disease_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    score, importance = _compute_risk(data, HEART_DISEASE_WEIGHTS)
    category = categorize_risk(score)
    explanation = _generate_explanation("heart disease", score, category, importance)
    return {
        "disease_type": "heart_disease",
        "risk_score": score,
        "risk_category": category,
        "feature_importance": importance,
        "explanation": explanation,
    }


def _generate_explanation(disease: str, score: float, category: str, importance: Dict[str, float]) -> str:
    top_factors = list(importance.keys())[:3]
    factors_str = ", ".join(top_factors) if top_factors else "general health indicators"

    disclaimer = (
        "\n\n⚠️ DISCLAIMER: This is an AI-generated risk estimate and NOT a medical diagnosis. "
        "Please consult a healthcare professional for proper evaluation."
    )

    if category == "low":
        return (
            f"Your estimated {disease} risk is LOW ({score:.0%}). "
            f"The main contributing factors are: {factors_str}. "
            f"Keep maintaining your current healthy lifestyle.{disclaimer}"
        )
    elif category == "moderate":
        return (
            f"Your estimated {disease} risk is MODERATE ({score:.0%}). "
            f"Key contributing factors: {factors_str}. "
            f"Consider consulting a doctor for a detailed check‑up and adopting preventive measures.{disclaimer}"
        )
    else:
        return (
            f"Your estimated {disease} risk is HIGH ({score:.0%}). "
            f"The top risk factors are: {factors_str}. "
            f"We strongly recommend scheduling a medical appointment for further evaluation.{disclaimer}"
        )
