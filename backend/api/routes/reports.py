"""
Medical Report upload and analysis routes (protected).
"""
import logging
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from core.database import get_db
from core.deps import get_current_user
from core.config import settings
from models.database import User, MedicalReport

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Medical Reports"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}


@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a medical report for AI analysis."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, PNG, and JPG files are allowed.")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size cannot exceed 10MB.")

    # Save file
    ext = file.filename.split(".")[-1] if file.filename else "bin"
    saved_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, saved_name)

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    # AI analysis (MVP: simulate extraction for now, will be replaced with Gemini Vision)
    extracted = _simulate_lab_extraction(file.filename or "report")
    ai_summary = _generate_ai_summary(extracted["values"])

    report = MedicalReport(
        user_id=current_user.id,
        file_name=file.filename or "unknown",
        file_url=f"/uploads/{saved_name}",
        file_type="pdf" if "pdf" in (file.content_type or "") else "image",
        extracted_values=extracted["values"],
        ai_summary=ai_summary,
        abnormal_flags=extracted["abnormal"],
    )
    db.add(report)
    await db.flush()

    logger.info(f"Report uploaded for user {current_user.id}: {file.filename}")
    return {
        "id": report.id,
        "file_name": report.file_name,
        "file_type": report.file_type,
        "extracted_values": report.extracted_values,
        "ai_summary": report.ai_summary,
        "abnormal_flags": report.abnormal_flags,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@router.get("/")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all reports for the current user."""
    result = await db.execute(
        select(MedicalReport).where(MedicalReport.user_id == current_user.id)
        .order_by(desc(MedicalReport.created_at))
    )
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "file_type": r.file_type,
            "abnormal_flags": r.abnormal_flags,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific report's details."""
    result = await db.execute(
        select(MedicalReport).where(
            MedicalReport.id == report_id,
            MedicalReport.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {
        "id": report.id,
        "file_name": report.file_name,
        "file_type": report.file_type,
        "extracted_values": report.extracted_values,
        "ai_summary": report.ai_summary,
        "abnormal_flags": report.abnormal_flags,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


def _simulate_lab_extraction(filename: str) -> dict:
    """MVP: simulated lab value extraction. Replace with Gemini Vision / OCR."""
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


def _generate_ai_summary(values: dict) -> str:
    abnormal = [k for k, v in values.items() if v["status"] != "normal"]
    if not abnormal:
        return "All lab values are within normal limits. No immediate concerns detected."

    summary = f"⚠️ {len(abnormal)} values flagged: {', '.join(abnormal)}.\n\n"
    summary += "Key findings:\n"
    for name in abnormal:
        v = values[name]
        summary += f"• {name}: {v['value']} {v['unit']} ({v['status'].upper()}) — Reference: {v['ref']}\n"
    summary += "\n📋 Recommended: Schedule a follow-up with your physician for further evaluation."
    summary += "\n\n⚕️ This is an AI-generated summary and NOT a medical diagnosis."
    return summary
