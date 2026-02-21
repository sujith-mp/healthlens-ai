"""
HealthLens AI — FastAPI Backend Application.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from api.routes import auth, risk, symptoms, chat, nutrition
from api.routes import dashboard, profile, reports, medications, vitals
from core.database import init_db

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    logger.info("Starting HealthLens AI backend...")
    await init_db()
    logger.info("Database initialized — tables created.")
    yield
    logger.info("Shutting down HealthLens AI backend.")


app = FastAPI(
    title="HealthLens AI",
    description="AI-Powered Digital Health Platform API",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploads) ──────────────────────────
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# ── Routes ───────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(symptoms.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(nutrition.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(medications.router, prefix="/api/v1")
app.include_router(vitals.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "HealthLens AI API v2.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
