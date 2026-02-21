"""
User Profile routes (protected).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.deps import get_current_user
from models.database import User, UserProfile
from schemas.schemas import ProfileUpdate, ProfileOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.get("/", response_model=ProfileOut)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        # Auto-create profile if missing
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.flush()
    return profile


@router.put("/", response_model=ProfileOut)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    await db.flush()
    logger.info(f"Profile updated for user {current_user.id}")
    return profile


@router.put("/name")
async def update_name(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's display name."""
    current_user.full_name = name
    await db.flush()
    return {"message": "Name updated.", "full_name": name}
