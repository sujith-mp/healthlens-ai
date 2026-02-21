"""
Vitals tracking routes — manual entry + wearable sync (protected).
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_user
from models.database import User, VitalRecord
from schemas.schemas import VitalInput, VitalOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vitals", tags=["Vitals"])


@router.post("/", response_model=VitalOut)
async def record_vital(
    data: VitalInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record vital signs (manual entry or from wearable)."""
    vital = VitalRecord(
        user_id=current_user.id,
        source=data.source,
        heart_rate=data.heart_rate,
        steps=data.steps,
        sleep_hours=data.sleep_hours,
        blood_pressure_systolic=data.blood_pressure_systolic,
        blood_pressure_diastolic=data.blood_pressure_diastolic,
        blood_glucose=data.blood_glucose,
        weight_kg=data.weight_kg,
        temperature=data.temperature,
        oxygen_saturation=data.oxygen_saturation,
    )
    db.add(vital)
    await db.flush()
    logger.info(f"Vital recorded for user {current_user.id} (source={data.source})")
    return vital


@router.get("/")
async def list_vitals(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's vital history."""
    result = await db.execute(
        select(VitalRecord).where(VitalRecord.user_id == current_user.id)
        .order_by(desc(VitalRecord.recorded_at)).limit(limit)
    )
    vitals = result.scalars().all()
    return [
        {
            "id": v.id, "source": v.source,
            "heart_rate": v.heart_rate, "steps": v.steps,
            "sleep_hours": v.sleep_hours,
            "blood_pressure_systolic": v.blood_pressure_systolic,
            "blood_pressure_diastolic": v.blood_pressure_diastolic,
            "blood_glucose": v.blood_glucose,
            "weight_kg": v.weight_kg,
            "temperature": v.temperature,
            "oxygen_saturation": v.oxygen_saturation,
            "recorded_at": v.recorded_at.isoformat() if v.recorded_at else None,
        }
        for v in vitals
    ]


@router.get("/latest")
async def get_latest_vitals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the latest vital readings."""
    result = await db.execute(
        select(VitalRecord).where(VitalRecord.user_id == current_user.id)
        .order_by(desc(VitalRecord.recorded_at)).limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        return {"message": "No vitals recorded yet."}
    return {
        "heart_rate": latest.heart_rate,
        "steps": latest.steps,
        "sleep_hours": latest.sleep_hours,
        "blood_pressure": f"{latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}" if latest.blood_pressure_systolic else None,
        "blood_glucose": latest.blood_glucose,
        "weight_kg": latest.weight_kg,
        "oxygen_saturation": latest.oxygen_saturation,
        "source": latest.source,
        "recorded_at": latest.recorded_at.isoformat() if latest.recorded_at else None,
    }
