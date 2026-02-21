"""
Medication tracking routes (protected).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_user
from models.database import User, Medication, MedicationLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/medications", tags=["Medication Tracker"])


class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str  # e.g., "twice daily", "once at bedtime"
    notes: Optional[str] = None


class MedicationLogEntry(BaseModel):
    medication_id: str
    taken: bool = True
    notes: Optional[str] = None


@router.get("/")
async def list_medications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all medications for the current user."""
    result = await db.execute(
        select(Medication).where(Medication.user_id == current_user.id)
        .order_by(Medication.name)
    )
    meds = result.scalars().all()
    return [
        {"id": m.id, "name": m.name, "dosage": m.dosage,
         "frequency": m.frequency, "notes": m.notes, "is_active": m.is_active}
        for m in meds
    ]


@router.post("/")
async def add_medication(
    data: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new medication."""
    med = Medication(
        user_id=current_user.id,
        name=data.name,
        dosage=data.dosage,
        frequency=data.frequency,
        notes=data.notes,
    )
    db.add(med)
    await db.flush()
    return {"id": med.id, "name": med.name, "dosage": med.dosage, "frequency": med.frequency}


@router.delete("/{med_id}")
async def remove_medication(
    med_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate a medication."""
    result = await db.execute(
        select(Medication).where(Medication.id == med_id, Medication.user_id == current_user.id)
    )
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    med.is_active = False
    return {"message": "Medication deactivated."}


@router.post("/log")
async def log_medication(
    data: MedicationLogEntry,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log that a medication was taken (or missed)."""
    result = await db.execute(
        select(Medication).where(
            Medication.id == data.medication_id, Medication.user_id == current_user.id
        )
    )
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    log = MedicationLog(
        medication_id=data.medication_id,
        user_id=current_user.id,
        taken=data.taken,
        notes=data.notes,
    )
    db.add(log)
    await db.flush()
    return {"message": "Medication logged.", "taken": data.taken}


@router.get("/history")
async def medication_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get medication adherence history."""
    result = await db.execute(
        select(MedicationLog).where(MedicationLog.user_id == current_user.id)
        .order_by(desc(MedicationLog.logged_at)).limit(50)
    )
    logs = result.scalars().all()
    return [
        {"medication_id": l.medication_id, "taken": l.taken,
         "notes": l.notes, "logged_at": l.logged_at.isoformat() if l.logged_at else None}
        for l in logs
    ]
