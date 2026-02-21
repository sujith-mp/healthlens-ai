"""
Gemini-powered AI health chatbot.
Falls back to rule-based responses when GEMINI_API_KEY is not set.
"""
import logging
from typing import List, Dict, Any, Optional
from services.risk_prediction import predict_diabetes_risk, predict_heart_disease_risk
from services.symptom_analyzer import analyze_symptoms
from services.nutrition_engine import generate_nutrition_plan

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are HealthLens AI, a helpful, empathetic health assistant.

CRITICAL RULES:
1. You are NOT a doctor. NEVER provide medical diagnoses.
2. ALWAYS remind users that AI insights are not a substitute for professional medical advice.
3. When a user describes symptoms, use the analyze_symptoms tool.
4. When a user asks about disease risk, use the appropriate risk prediction tool.
5. When discussing diet / lifestyle, use the get_nutrition_plan tool.
6. If the situation sounds like an emergency, tell the user to CALL EMERGENCY SERVICES IMMEDIATELY.
7. Be warm, clear, and supportive. Avoid medical jargon when possible.
8. Respect user privacy — never ask for unnecessary personal information.
9. Include the disclaimer "This is not a medical diagnosis" in relevant responses.
10. If you are uncertain, say so honestly and recommend seeing a healthcare professional.
"""

TOOL_DEFINITIONS = [
    {
        "name": "analyze_symptoms",
        "description": "Analyze user-described symptoms and return possible conditions with urgency level.",
        "parameters": {
            "type": "object",
            "properties": {
                "description": {"type": "string", "description": "User's symptom description in natural language."}
            },
            "required": ["description"],
        },
    },
    {
        "name": "get_diabetes_risk",
        "description": "Predict diabetes risk based on health metrics.",
        "parameters": {
            "type": "object",
            "properties": {
                "age": {"type": "integer"}, "bmi": {"type": "number"},
                "glucose": {"type": "number"}, "blood_pressure_systolic": {"type": "number"},
                "blood_pressure_diastolic": {"type": "number"}, "insulin": {"type": "number"},
                "smoking": {"type": "boolean"},
            },
            "required": ["age", "bmi", "glucose", "blood_pressure_systolic", "blood_pressure_diastolic"],
        },
    },
    {
        "name": "get_heart_disease_risk",
        "description": "Predict heart disease risk based on health metrics.",
        "parameters": {
            "type": "object",
            "properties": {
                "age": {"type": "integer"}, "bmi": {"type": "number"},
                "cholesterol": {"type": "number"}, "blood_pressure_systolic": {"type": "number"},
                "blood_pressure_diastolic": {"type": "number"}, "smoking": {"type": "boolean"},
            },
            "required": ["age", "bmi", "blood_pressure_systolic", "blood_pressure_diastolic"],
        },
    },
    {
        "name": "get_nutrition_plan",
        "description": "Generate personalized nutrition and lifestyle recommendations.",
        "parameters": {
            "type": "object",
            "properties": {
                "risk_predictions": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["risk_predictions"],
        },
    },
]


async def chat_with_gemini(
    user_message: str,
    chat_history: List[Dict[str, str]],
    gemini_api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process a chat message. Uses Gemini API if key is available,
    otherwise falls back to rule-based responses.
    """
    # Try Gemini API first
    if gemini_api_key:
        try:
            return await _gemini_chat(user_message, chat_history, gemini_api_key)
        except Exception as e:
            logger.warning(f"Gemini API failed, using fallback: {e}")

    # Fallback to rule-based
    return _rule_based_response(user_message)


async def _gemini_chat(
    user_message: str,
    chat_history: List[Dict[str, str]],
    api_key: str,
) -> Dict[str, Any]:
    """Use the Google Generative AI SDK to chat."""
    from google import genai

    client = genai.Client(api_key=api_key)

    # Build conversation history (exclude current message)
    contents = []
    history = list(chat_history)
    for msg in history[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config={"system_instruction": SYSTEM_PROMPT},
    )

    content = response.text if response.text else "I'm sorry, I couldn't generate a response."
    logger.info("Gemini API response received.")
    return {"role": "assistant", "content": content, "tool_calls": None}


def _rule_based_response(message: str) -> Dict[str, Any]:
    """Fallback rule-based responses when Gemini is unavailable."""
    msg_lower = message.lower()
    tool_calls = []

    # Emergency detection
    emergency_keywords = ["chest pain", "can't breathe", "heart attack", "stroke", "unconscious", "bleeding heavily"]
    if any(kw in msg_lower for kw in emergency_keywords):
        return {
            "role": "assistant",
            "content": "🚨 **EMERGENCY**: Based on what you've described, this sounds like a medical emergency. "
                       "Please **CALL 911 (or your local emergency number) IMMEDIATELY**.\n\n"
                       "While waiting for help:\n"
                       "• Stay calm and try to remain still\n"
                       "• If someone is with you, let them know\n"
                       "• Do not drive yourself to the hospital\n\n"
                       "⚕️ This is not a medical diagnosis. When in doubt, always call emergency services.",
            "tool_calls": [],
        }

    # Symptom-related
    symptom_triggers = ["headache", "pain", "fever", "nausea", "tired", "fatigue", "cough", "sore", "ache", "dizzy",
                        "symptom", "feeling sick", "not feeling well", "hurt"]
    if any(kw in msg_lower for kw in symptom_triggers):
        result = analyze_symptoms(message)
        formatted = _format_symptom_result(result)
        return {"role": "assistant", "content": formatted, "tool_calls": [{"name": "analyze_symptoms"}]}

    # Risk-related
    if any(kw in msg_lower for kw in ["diabetes", "blood sugar", "glucose", "insulin"]):
        return {
            "role": "assistant",
            "content": "I'd be happy to help assess your diabetes risk! 🩺\n\n"
                       "To provide an accurate assessment, I'll need some health metrics:\n"
                       "• **Age**\n• **BMI** (or height and weight)\n• **Fasting glucose** (mg/dL)\n"
                       "• **Blood pressure** (systolic/diastolic)\n\n"
                       "You can also use the **Risk Assessment** page in the sidebar for a comprehensive analysis.\n\n"
                       "⚕️ This is not a medical diagnosis.",
            "tool_calls": [],
        }

    if any(kw in msg_lower for kw in ["heart", "cardiac", "cholesterol", "cardiovascular"]):
        return {
            "role": "assistant",
            "content": "Let's look at your heart health! 💓\n\n"
                       "For a heart disease risk assessment, I'll need:\n"
                       "• **Age**\n• **BMI**\n• **Cholesterol** levels\n"
                       "• **Blood pressure**\n• **Smoking status**\n\n"
                       "Head to the **Risk Assessment** page for a detailed analysis.\n\n"
                       "⚕️ This is not a medical diagnosis.",
            "tool_calls": [],
        }

    # Nutrition-related
    if any(kw in msg_lower for kw in ["diet", "nutrition", "meal", "eat", "food", "healthy eating"]):
        return {
            "role": "assistant",
            "content": "Great question about nutrition! 🥗\n\n"
                       "I can create a personalized nutrition plan based on your health profile. "
                       "Visit the **Nutrition Plan** page to get customized meal plans and dietary recommendations "
                       "tailored to your risk factors.\n\n"
                       "Key tips for everyone:\n"
                       "• Eat plenty of fruits and vegetables\n"
                       "• Choose whole grains over refined grains\n"
                       "• Limit added sugars and sodium\n"
                       "• Stay hydrated (aim for 8 glasses of water)\n\n"
                       "⚕️ For specific dietary needs, consult a registered dietitian.",
            "tool_calls": [],
        }

    # Greeting
    if any(kw in msg_lower for kw in ["hello", "hi", "hey", "morning", "evening"]):
        return {
            "role": "assistant",
            "content": "Hello! 👋 I'm HealthLens AI, your personal health assistant.\n\n"
                       "I can help you with:\n"
                       "🔍 **Symptom Analysis** — describe what you're feeling\n"
                       "🫀 **Risk Assessment** — check your disease risk\n"
                       "🥗 **Nutrition Plans** — get dietary advice\n"
                       "📄 **Report Analysis** — understand your lab results\n\n"
                       "How can I help you today?\n\n"
                       "⚕️ Remember: I'm an AI assistant, not a doctor.",
            "tool_calls": [],
        }

    # Default
    return {
        "role": "assistant",
        "content": "Thank you for your message! 🤖\n\n"
                   "I can help with:\n"
                   "• **Symptom analysis** — tell me how you're feeling\n"
                   "• **Disease risk prediction** — diabetes, heart disease\n"
                   "• **Nutrition advice** — personalized meal plans\n"
                   "• **Lab report analysis** — upload your reports\n\n"
                   "Could you share more about what you'd like help with?\n\n"
                   "⚕️ This is not a medical diagnosis. Always consult a healthcare provider for medical decisions.",
        "tool_calls": [],
    }


def _format_symptom_result(result: Dict[str, Any]) -> str:
    """Format symptom analysis results for chat."""
    urgency_emoji = {"emergency": "🔴", "high": "🟠", "moderate": "🟡", "low": "🟢"}
    emoji = urgency_emoji.get(result["urgency_level"], "⚪")

    text = f"{emoji} **Urgency Level: {result['urgency_level'].upper()}**\n\n"

    if result["classified_symptoms"]:
        text += "**Symptoms identified:**\n"
        for s in result["classified_symptoms"]:
            text += f"• {s}\n"
        text += "\n"

    if result["possible_conditions"]:
        text += "**Possible conditions:**\n"
        for c in result["possible_conditions"][:3]:
            prob = f"{c['probability'] * 100:.0f}%"
            text += f"• {c['name']} ({prob} match)\n"
        text += "\n"

    if result["recommendations"]:
        text += "**Recommendations:**\n"
        for r in result["recommendations"]:
            text += f"• {r}\n"

    text += "\n⚕️ **This is not a medical diagnosis.** Please consult a healthcare professional for proper evaluation."
    return text
