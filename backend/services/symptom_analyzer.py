"""
Symptom analysis service.

Uses keyword-based NLP classification for the MVP.
In production, integrate a trained NLP model or use Gemini for classification.
"""
from typing import Dict, Any, List, Optional

# ── Symptom → Condition mapping (MVP knowledge base) ──
CONDITION_DB: List[Dict[str, Any]] = [
    {
        "name": "Common Cold",
        "keywords": ["cough", "runny nose", "sneeze", "sore throat", "congestion", "mild fever"],
        "urgency": "low",
        "description": "Viral upper respiratory tract infection. Usually resolves within 7-10 days.",
    },
    {
        "name": "Influenza (Flu)",
        "keywords": ["fever", "body ache", "chills", "fatigue", "cough", "headache", "muscle pain"],
        "urgency": "moderate",
        "description": "Viral infection that can cause severe symptoms. Rest and fluids are essential.",
    },
    {
        "name": "Migraine",
        "keywords": ["headache", "nausea", "light sensitivity", "throbbing", "aura", "vision"],
        "urgency": "moderate",
        "description": "Recurrent headache disorder. May require prescription medication.",
    },
    {
        "name": "Gastroenteritis",
        "keywords": ["diarrhea", "vomiting", "nausea", "stomach", "abdominal pain", "cramp"],
        "urgency": "moderate",
        "description": "Inflammation of the stomach and intestines. Stay hydrated.",
    },
    {
        "name": "Allergic Reaction",
        "keywords": ["rash", "itching", "hives", "swelling", "watery eyes", "sneeze"],
        "urgency": "moderate",
        "description": "Immune system response to an allergen. May range from mild to severe.",
    },
    {
        "name": "Urinary Tract Infection",
        "keywords": ["burning urination", "frequent urination", "pelvic pain", "cloudy urine", "urgency"],
        "urgency": "moderate",
        "description": "Bacterial infection of the urinary system. Requires antibiotic treatment.",
    },
    {
        "name": "Pneumonia",
        "keywords": ["chest pain", "breathing difficulty", "high fever", "productive cough", "shortness of breath"],
        "urgency": "high",
        "description": "Lung infection that can be serious. Seek medical attention.",
    },
    {
        "name": "Heart Attack Warning Signs",
        "keywords": ["chest pain", "left arm pain", "jaw pain", "shortness of breath", "sweating", "nausea"],
        "urgency": "emergency",
        "description": "Potential cardiac emergency. Call emergency services immediately.",
    },
    {
        "name": "Stroke Warning Signs",
        "keywords": ["sudden numbness", "confusion", "trouble speaking", "vision loss", "severe headache", "dizziness", "face drooping"],
        "urgency": "emergency",
        "description": "Potential neurological emergency. Call emergency services immediately.",
    },
    {
        "name": "Type 2 Diabetes Symptoms",
        "keywords": ["frequent urination", "excessive thirst", "blurred vision", "fatigue", "slow healing", "tingling"],
        "urgency": "moderate",
        "description": "Metabolic disorder affecting blood sugar regulation. Requires medical evaluation.",
    },
]


def _extract_symptoms(text: str) -> List[str]:
    """Extract keywords from user text (simple tokenization)."""
    text_lower = text.lower()
    # Flatten all known keywords
    all_keywords = set()
    for condition in CONDITION_DB:
        all_keywords.update(condition["keywords"])

    found = []
    for kw in all_keywords:
        if kw in text_lower:
            found.append(kw)
    return found


def _match_conditions(symptoms: List[str]) -> List[Dict[str, Any]]:
    """Score each condition against the extracted symptoms."""
    results = []
    for condition in CONDITION_DB:
        matched = [s for s in symptoms if s in condition["keywords"]]
        if matched:
            score = len(matched) / len(condition["keywords"])
            results.append({
                "name": condition["name"],
                "probability": round(min(score, 0.95), 2),  # cap at 95% — never 100%
                "description": condition["description"],
                "urgency": condition["urgency"],
            })

    # Sort by probability descending, take top 3
    results.sort(key=lambda x: -x["probability"])
    return results[:3]


def _determine_urgency(conditions: List[Dict[str, Any]]) -> str:
    """Return the highest urgency from matched conditions."""
    priority = {"emergency": 4, "high": 3, "moderate": 2, "low": 1}
    if not conditions:
        return "low"
    return max(conditions, key=lambda c: priority.get(c.get("urgency", "low"), 0))["urgency"]


def _generate_recommendations(urgency: str, conditions: List[Dict[str, Any]]) -> List[str]:
    """Produce actionable recommendations based on urgency."""
    recs = []
    if urgency == "emergency":
        recs.append("🚨 SEEK IMMEDIATE MEDICAL ATTENTION — call emergency services (911 / local emergency number) NOW.")
        recs.append("Do not drive yourself — ask someone to take you or call an ambulance.")
    elif urgency == "high":
        recs.append("⚠️ Schedule an urgent appointment with your doctor as soon as possible.")
        recs.append("If symptoms worsen rapidly, go to the nearest emergency room.")
    elif urgency == "moderate":
        recs.append("📋 Consider booking a doctor's appointment within the next few days.")
        recs.append("Monitor your symptoms and note any changes.")
    else:
        recs.append("💊 Your symptoms appear mild. Rest, stay hydrated, and monitor for changes.")

    recs.append(
        "⚕️ DISCLAIMER: This is an AI-based assessment and NOT a medical diagnosis. "
        "Always consult a qualified healthcare professional."
    )
    return recs


def analyze_symptoms(description: str) -> Dict[str, Any]:
    """Main entry point for symptom analysis."""
    symptoms = _extract_symptoms(description)
    conditions = _match_conditions(symptoms)
    urgency = _determine_urgency(conditions)
    recommendations = _generate_recommendations(urgency, conditions)

    return {
        "classified_symptoms": symptoms,
        "possible_conditions": [
            {"name": c["name"], "probability": c["probability"], "description": c.get("description")}
            for c in conditions
        ],
        "urgency_level": urgency,
        "recommendations": recommendations,
    }
