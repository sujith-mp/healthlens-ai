"""
Disease Risk Prediction routes (protected).
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_user
from models.database import User, RiskPrediction
from schemas.schemas import RiskInput, RiskResult
from services.risk_prediction import predict_diabetes_risk, predict_heart_disease_risk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/risk", tags=["Risk Prediction"])


@router.post("/diabetes", response_model=RiskResult)
async def predict_diabetes(
    data: RiskInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict diabetes risk from health metrics."""
    input_data = data.model_dump()
    result = predict_diabetes_risk(input_data)

    prediction = RiskPrediction(
        user_id=current_user.id,
        disease_type=result["disease_type"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        input_data=input_data,
        feature_importance=result["feature_importance"],
        explanation=result["explanation"],
    )
    db.add(prediction)
    await db.flush()

    logger.info(f"Diabetes risk for user {current_user.id}: {result['risk_category']}")
    return RiskResult(
        id=prediction.id,
        disease_type=result["disease_type"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        feature_importance=result["feature_importance"],
        explanation=result["explanation"],
        created_at=prediction.created_at or datetime.now(timezone.utc),
    )


@router.post("/heart-disease", response_model=RiskResult)
async def predict_heart(
    data: RiskInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict heart disease risk from health metrics."""
    input_data = data.model_dump()
    result = predict_heart_disease_risk(input_data)

    prediction = RiskPrediction(
        user_id=current_user.id,
        disease_type=result["disease_type"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        input_data=input_data,
        feature_importance=result["feature_importance"],
        explanation=result["explanation"],
    )
    db.add(prediction)
    await db.flush()

    logger.info(f"Heart risk for user {current_user.id}: {result['risk_category']}")
    return RiskResult(
        id=prediction.id,
        disease_type=result["disease_type"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        feature_importance=result["feature_importance"],
        explanation=result["explanation"],
        created_at=prediction.created_at or datetime.now(timezone.utc),
    )
