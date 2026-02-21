"""
Nutrition & Lifestyle recommendation engine.
Generates personalised plans based on user risk profile.
"""
from typing import Dict, Any, List, Optional


def generate_nutrition_plan(
    risk_predictions: List[Dict[str, Any]],
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate diet + lifestyle recommendations driven by risk prediction results.
    """
    risks = {r["disease_type"]: r["risk_category"] for r in risk_predictions}

    diet: Dict[str, Any] = {
        "general_guidelines": [
            "Eat a balanced diet rich in fruits, vegetables, whole grains, and lean proteins.",
            "Limit processed foods, added sugars, and excessive sodium.",
            "Stay hydrated — aim for 8+ glasses of water daily.",
            "Eat regular, moderate‑sized meals to maintain stable blood sugar.",
        ],
        "meal_plan": _build_meal_plan(risks, profile),
        "foods_to_increase": [],
        "foods_to_limit": [],
    }

    lifestyle: Dict[str, Any] = {
        "exercise": [],
        "sleep": [
            "Aim for 7-9 hours of quality sleep every night.",
            "Maintain a consistent sleep schedule.",
        ],
        "stress_management": [
            "Practice mindfulness or meditation for 10-15 minutes daily.",
            "Take regular breaks during work hours.",
        ],
        "habits_to_avoid": [],
    }

    # ── Tailor to diabetes risk ──
    if risks.get("diabetes") in ("moderate", "high"):
        diet["foods_to_increase"].extend([
            "High-fiber foods (oats, lentils, beans)",
            "Leafy green vegetables (spinach, kale)",
            "Berries and low-glycemic fruits",
            "Nuts and seeds (almonds, chia seeds)",
        ])
        diet["foods_to_limit"].extend([
            "Refined carbohydrates (white bread, pastries)",
            "Sugary beverages and fruit juices",
            "Processed snacks and sweets",
        ])
        lifestyle["exercise"].append("150 minutes/week of moderate aerobic exercise (brisk walking, cycling).")
        lifestyle["habits_to_avoid"].append("Avoid prolonged sitting — stand or walk every 30 minutes.")

    # ── Tailor to heart disease risk ──
    if risks.get("heart_disease") in ("moderate", "high"):
        diet["foods_to_increase"].extend([
            "Omega-3 fatty acids (salmon, sardines, flaxseed)",
            "Olive oil and healthy fats",
            "Whole grains",
            "Potassium-rich foods (bananas, sweet potatoes)",
        ])
        diet["foods_to_limit"].extend([
            "Saturated and trans fats",
            "High-sodium foods",
            "Red and processed meats",
            "Excess alcohol",
        ])
        lifestyle["exercise"].append("Aim for 30 minutes of cardiovascular exercise 5 days a week.")
        lifestyle["habits_to_avoid"].append("Quit smoking if applicable — #1 modifiable heart disease risk factor.")

    # Deduplicate
    for key in ("foods_to_increase", "foods_to_limit"):
        diet[key] = list(dict.fromkeys(diet[key]))
    lifestyle["exercise"] = list(dict.fromkeys(lifestyle["exercise"]))
    lifestyle["habits_to_avoid"] = list(dict.fromkeys(lifestyle["habits_to_avoid"]))

    if not lifestyle["exercise"]:
        lifestyle["exercise"].append("Aim for at least 150 minutes of moderate physical activity per week.")

    return {
        "risk_context": risks,
        "diet_recommendations": diet,
        "lifestyle_recommendations": lifestyle,
    }


def _build_meal_plan(risks: Dict[str, str], profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Build a sample daily meal plan."""
    is_high_risk = any(v == "high" for v in risks.values())

    return {
        "breakfast": {
            "option_a": "Oatmeal with berries, chia seeds, and a handful of almonds",
            "option_b": "Greek yogurt with fresh fruit and granola",
            "notes": "Avoid sugary cereals" if is_high_risk else None,
        },
        "lunch": {
            "option_a": "Grilled chicken salad with mixed greens, olive oil dressing",
            "option_b": "Lentil soup with whole-grain bread",
            "notes": "Watch portion sizes of carbohydrates" if is_high_risk else None,
        },
        "dinner": {
            "option_a": "Baked salmon with steamed broccoli and quinoa",
            "option_b": "Stir‑fried tofu with vegetables and brown rice",
            "notes": "Keep dinner light — eat at least 2-3 hours before bed" if is_high_risk else None,
        },
        "snacks": [
            "Apple slices with peanut butter",
            "Mixed nuts (unsalted)",
            "Carrot sticks with hummus",
        ],
    }
