"""
Medical Report upload and analysis routes (protected).
Uses Gemini Vision for AI analysis when GEMINI_API_KEY is set and file is an image.
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
from services.report_analyzer import (
    analyze_report_with_gemini,
    simulate_lab_extraction,
    generate_ai_summary_from_values,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Medical Reports"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg"}


@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a medical report for AI analysis (Gemini Vision for images when API key is set)."""
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

    # AI analysis: Gemini Vision for images when key is set, else simulated
    values: dict = {}
    abnormal: list = []
    ai_summary: str

    if file.content_type in IMAGE_TYPES and settings.GEMINI_API_KEY:
        try:
            values, abnormal, ai_summary = analyze_report_with_gemini(
                content,
                file.content_type or "image/jpeg",
                settings.GEMINI_API_KEY,
            )
            logger.info("Report analyzed with Gemini Vision.")
        except Exception as e:
            logger.warning(f"Gemini report analysis failed, using fallback: {e}")
            extracted = simulate_lab_extraction(file.filename or "report")
            values = extracted["values"]
            abnormal = extracted["abnormal"]
            ai_summary = generate_ai_summary_from_values(values, abnormal)
    else:
        # PDF or no Gemini key: use simulated extraction
        extracted = simulate_lab_extraction(file.filename or "report")
        values = extracted["values"]
        abnormal = extracted["abnormal"]
        ai_summary = generate_ai_summary_from_values(values, abnormal)

    report = MedicalReport(
        user_id=current_user.id,
        file_name=file.filename or "unknown",
        file_url=f"/uploads/{saved_name}",
        file_type="pdf" if "pdf" in (file.content_type or "") else "image",
        extracted_values=values,
        ai_summary=ai_summary,
        abnormal_flags=abnormal,
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


