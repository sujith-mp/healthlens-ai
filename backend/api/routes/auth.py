"""
Authentication routes — email/password & Google OAuth.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt

from core.database import get_db
from core.security import create_access_token, validate_email, validate_password_strength
from core.deps import get_current_user
from models.database import User, UserProfile
from schemas.schemas import (
    UserCreate, UserLogin, GoogleAuthRequest,
    TokenResponse, UserOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user with email/password."""
    # Validate email format
    if not validate_email(data.email):
        raise HTTPException(status_code=422, detail="Invalid email format.")

    # Validate password strength
    pwd_error = validate_password_strength(data.password)
    if pwd_error:
        raise HTTPException(status_code=422, detail=pwd_error)

    # Check if email already registered
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        auth_provider="email",
    )
    db.add(user)
    await db.flush()

    profile = UserProfile(user_id=user.id)
    db.add(profile)

    logger.info(f"New user registered: {user.email}")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == data.email.lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    logger.info(f"User logged in: {user.email}")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate via Google OAuth ID token."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from core.config import settings

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None,
        )
    except Exception as e:
        logger.warning(f"Google OAuth failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    email = idinfo.get("email")
    google_id = idinfo.get("sub")
    name = idinfo.get("name")
    picture = idinfo.get("picture")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        # Check if email already exists with email auth
        email_result = await db.execute(select(User).where(User.email == email))
        existing = email_result.scalar_one_or_none()
        if existing:
            # Link Google to existing account
            existing.google_id = google_id
            existing.avatar_url = picture
            existing.is_verified = True
            user = existing
        else:
            user = User(
                email=email,
                google_id=google_id,
                full_name=name,
                avatar_url=picture,
                auth_provider="google",
                is_verified=True,
            )
            db.add(user)
            await db.flush()
            profile = UserProfile(user_id=user.id)
            db.add(profile)

    logger.info(f"Google auth: {user.email}")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user


@router.post("/logout")
async def logout():
    """Client-side logout — just acknowledges. Token invalidation is client-side."""
    return {"message": "Logged out successfully. Clear your token on the client."}
