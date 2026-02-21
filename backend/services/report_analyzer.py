"""
Medical report analysis using Gemini Vision when API key is available.
Falls back to simulated extraction otherwise.
"""
import base64
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """You are a medical report analyst. Analyze this lab or medical report image.

Extract:
1. Any lab test names with their values, units, and reference ranges if visible.
2. Flag which values are abnormal (high/low) based on reference ranges or common norms.
3. Write a short, clear summary (2-4 sentences) for the patient: what stands out, what to discuss with a doctor.
4. Do NOT diagnose. Always end with: "This is an AI-generated summary and NOT a medical diagnosis. Please consult your physician."

Reply in this exact JSON format only, no other text:
{
  "values": {
    "Test Name": {"value": "number or string", "unit": "unit", "status": "normal|low|high|borderline", "ref": "reference range"}
  },
  "abnormal": ["Test Name1", "Test Name2"],
  "summary": "Your 2-4 sentence summary here."
}
If you cannot read the image or extract structured data, set values to {}, abnormal to [], and put an explanation in summary."""


def analyze_report_with_gemini(
    image_bytes: bytes,
    mime_type: str,
    api_key: str,
) -> Tuple[Dict[str, Any], List[str], str]:
    """
    Use Gemini Vision to analyze a medical report image.
    Returns (values dict, abnormal list, ai_summary string).
    """
    from google import genai

    client = genai.Client(api_key=api_key)
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    contents = [
        {
            "role": "user",
            "parts": [
                {"text": REPORT_SYSTEM_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": b64}},
            ],
        }
    ]

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
    )
    text = (response.text or "").strip()
    logger.info("Gemini report analysis received.")

    # Parse JSON from response (handle markdown code blocks)
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if json_match:
        text = json_match.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Gemini report response was not valid JSON, using raw as summary.")
        return {}, [], text[:2000] if len(text) > 2000 else text

    values = data.get("values") or {}
    abnormal = data.get("abnormal") or []
    summary = data.get("summary") or "Unable to generate summary."
    if not summary.endswith("medical diagnosis"):
        summary += "\n\n⚕️ This is an AI-generated summary and NOT a medical diagnosis. Please consult your physician."
    return values, abnormal, summary


def simulate_lab_extraction(_filename: str) -> Dict[str, Any]:
    """Fallback: simulated lab values when Gemini is not used."""
    values = {
        "Hemoglobin": {"value": "13.5", "unit": "g/dL", "status": "normal", "ref": "12.0-17.5"},
        "Fasting Glucose": {"value": "126", "unit": "mg/dL", "status": "high", "ref": "70-100"},
        "Total Cholesterol": {"value": "210", "unit": "mg/dL", "status": "borderline", "ref": "<200"},
        "HDL Cholesterol": {"value": "45", "unit": "mg/dL", "status": "low", "ref": ">60"},
        "LDL Cholesterol": {"value": "140", "unit": "mg/dL", "status": "borderline", "ref": "<100"},
        "Triglycerides": {"value": "180", "unit": "mg/dL", "status": "borderline", "ref": "<150"},
        "HbA1c": {"value": "6.8", "unit": "%", "status": "high", "ref": "<5.7"},
        "Creatinine": {"value": "1.0", "unit": "mg/dL", "status": "normal", "ref": "0.7-1.3"},
    }
    abnormal = [k for k, v in values.items() if v["status"] != "normal"]
    return {"values": values, "abnormal": abnormal}


def generate_ai_summary_from_values(values: Dict[str, Any], abnormal: List[str]) -> str:
    """Build a text summary from extracted values (used for fallback)."""
    if not abnormal:
        return "All lab values are within normal limits. No immediate concerns detected."
    summary = f"⚠️ {len(abnormal)} values flagged: {', '.join(abnormal)}.\n\n"
    summary += "Key findings:\n"
    for name in abnormal:
        v = values.get(name)
        if v and isinstance(v, dict):
            summary += f"• {name}: {v.get('value', '?')} {v.get('unit', '')} ({str(v.get('status', '')).upper()}) — Reference: {v.get('ref', 'N/A')}\n"
    summary += "\n📋 Recommended: Schedule a follow-up with your physician for further evaluation."
    summary += "\n\n⚕️ This is an AI-generated summary and NOT a medical diagnosis."
    return summary
