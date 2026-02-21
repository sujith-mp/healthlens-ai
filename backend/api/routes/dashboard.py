"""
Dashboard API — aggregated user health summary.
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Dict, Any

from core.database import get_db
from core.deps import get_current_user
from models.database import User, RiskPrediction, SymptomLog, MedicalReport

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated health dashboard data for the current user."""
    user_id = current_user.id

    # Latest risk predictions
    risk_result = await db.execute(
        select(RiskPrediction).where(RiskPrediction.user_id == user_id)
        .order_by(desc(RiskPrediction.created_at)).limit(10)
    )
    risks = risk_result.scalars().all()

    latest_risks = {}
    for r in risks:
        if r.disease_type not in latest_risks:
            latest_risks[r.disease_type] = {
                "disease_type": r.disease_type,
                "risk_score": r.risk_score,
                "risk_category": r.risk_category,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }

    risk_trend = [
        {"disease_type": r.disease_type, "risk_score": r.risk_score,
         "created_at": r.created_at.isoformat() if r.created_at else None}
        for r in risks
    ]

    # Counts
    total_assessments = (await db.execute(
        select(func.count()).select_from(RiskPrediction).where(RiskPrediction.user_id == user_id)
    )).scalar() or 0

    total_symptom_checks = (await db.execute(
        select(func.count()).select_from(SymptomLog).where(SymptomLog.user_id == user_id)
    )).scalar() or 0

    total_reports = (await db.execute(
        select(func.count()).select_from(MedicalReport).where(MedicalReport.user_id == user_id)
    )).scalar() or 0

    # Recent activity
    recent_activity = []
    recent_risks = await db.execute(
        select(RiskPrediction).where(RiskPrediction.user_id == user_id)
        .order_by(desc(RiskPrediction.created_at)).limit(3)
    )
    for r in recent_risks.scalars():
        recent_activity.append({
            "type": "risk", "icon": "🫀",
            "title": f"{r.disease_type.replace('_', ' ').title()} Risk",
            "desc": f"Risk: {r.risk_score:.0%} ({r.risk_category})",
            "time": r.created_at.isoformat() if r.created_at else None,
        })

    recent_symptoms = await db.execute(
        select(SymptomLog).where(SymptomLog.user_id == user_id)
        .order_by(desc(SymptomLog.created_at)).limit(2)
    )
    for s in recent_symptoms.scalars():
        recent_activity.append({
            "type": "symptom", "icon": "🔍",
            "title": "Symptom Check",
            "desc": f"Urgency: {s.urgency_level}",
            "time": s.created_at.isoformat() if s.created_at else None,
        })

    recent_activity.sort(key=lambda x: x.get("time") or "", reverse=True)

    health_score = _compute_health_score(latest_risks)

    return {
        "user_name": current_user.full_name or current_user.email.split("@")[0],
        "health_score": health_score,
        "latest_risks": latest_risks,
        "risk_trend": risk_trend,
        "total_assessments": total_assessments,
        "total_symptom_checks": total_symptom_checks,
        "total_reports": total_reports,
        "recent_activity": recent_activity[:5],
    }


def _compute_health_score(latest_risks: Dict[str, Any]) -> int:
    if not latest_risks:
        return 85
    avg_risk = sum(r["risk_score"] for r in latest_risks.values()) / len(latest_risks)
    return max(0, min(100, int((1 - avg_risk) * 100)))
