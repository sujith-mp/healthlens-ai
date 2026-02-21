"""
Symptom Checker routes (protected).
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_user
from models.database import User, SymptomLog
from schemas.schemas import SymptomInput, SymptomResult, ConditionMatch
from services.symptom_analyzer import analyze_symptoms

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/symptoms", tags=["Symptom Checker"])


@router.post("/analyze", response_model=SymptomResult)
async def check_symptoms(
    data: SymptomInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze user-described symptoms and return possible conditions."""
    result = analyze_symptoms(data.description)

    log = SymptomLog(
        user_id=current_user.id,
        raw_input=data.description,
        classified_symptoms=result["classified_symptoms"],
        possible_conditions=result["possible_conditions"],
        urgency_level=result["urgency_level"],
        recommendations=result["recommendations"],
    )
    db.add(log)
    await db.flush()

    logger.info(f"Symptom check for user {current_user.id}: urgency={result['urgency_level']}")
    return SymptomResult(
        id=log.id,
        raw_input=data.description,
        classified_symptoms=result["classified_symptoms"],
        possible_conditions=[ConditionMatch(**c) for c in result["possible_conditions"]],
        urgency_level=result["urgency_level"],
        recommendations=result["recommendations"],
        created_at=log.created_at or datetime.now(timezone.utc),
    )
