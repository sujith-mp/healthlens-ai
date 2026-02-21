"""
AI Health Chatbot routes (protected, per-user sessions).
"""
import logging
from fastapi import APIRouter, Depends
from typing import Dict, List

from core.deps import get_current_user
from models.database import User
from schemas.schemas import ChatInput, ChatResponse
from services.chatbot import chat_with_gemini
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["AI Chatbot"])

# Per-user conversation history (keyed by user_id)
_user_sessions: Dict[str, List[dict]] = {}


@router.post("/message", response_model=ChatResponse)
async def send_message(
    data: ChatInput,
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI health chatbot."""
    user_id = current_user.id

    if user_id not in _user_sessions:
        _user_sessions[user_id] = []

    history = _user_sessions[user_id]
    history.append({"role": "user", "content": data.message})

    result = await chat_with_gemini(
        user_message=data.message,
        chat_history=history,
        gemini_api_key=settings.GEMINI_API_KEY,
    )

    history.append({"role": "assistant", "content": result["content"]})

    # Keep only last 50 messages to prevent memory bloat
    if len(history) > 50:
        _user_sessions[user_id] = history[-50:]

    return ChatResponse(
        role=result["role"],
        content=result["content"],
        tool_calls=result.get("tool_calls"),
    )


@router.delete("/history")
async def clear_history(current_user: User = Depends(get_current_user)):
    """Clear the current user's chat session."""
    user_id = current_user.id
    if user_id in _user_sessions:
        _user_sessions[user_id].clear()
    return {"message": "Chat history cleared."}
