"""
Nutrition & Lifestyle routes (protected).
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_user
from models.database import User, NutritionPlan
from schemas.schemas import NutritionOut
from services.nutrition_engine import generate_nutrition_plan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/nutrition", tags=["Nutrition & Lifestyle"])


@router.post("/plan", response_model=NutritionOut)
async def get_nutrition_plan(
    risk_predictions: List[Dict[str, Any]],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a personalized nutrition and lifestyle plan."""
    result = generate_nutrition_plan(risk_predictions)

    plan = NutritionPlan(
        user_id=current_user.id,
        risk_context=result["risk_context"],
        diet_recommendations=result["diet_recommendations"],
        lifestyle_recommendations=result["lifestyle_recommendations"],
    )
    db.add(plan)
    await db.flush()

    logger.info(f"Nutrition plan for user {current_user.id}")
    return NutritionOut(
        id=plan.id,
        risk_context=result["risk_context"],
        diet_recommendations=result["diet_recommendations"],
        lifestyle_recommendations=result["lifestyle_recommendations"],
        created_at=plan.created_at or datetime.now(timezone.utc),
    )
