"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── AUTH ──────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    token: str  # Google ID token


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "email"
    is_verified: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── PROFILE ──────────────────────────────────────────

class ProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    family_history: Optional[List[str]] = None
    lifestyle: Optional[Dict[str, Any]] = None
    emergency_contact: Optional[Dict[str, str]] = None


class ProfileOut(BaseModel):
    id: str
    user_id: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    family_history: Optional[List[str]] = None
    lifestyle: Optional[Dict[str, Any]] = None
    emergency_contact: Optional[Dict[str, str]] = None

    model_config = {"from_attributes": True}


# ── RISK PREDICTION ──────────────────────────────────

class RiskInput(BaseModel):
    age: int
    bmi: float
    glucose: Optional[float] = None
    cholesterol: Optional[float] = None
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    insulin: Optional[float] = None
    skin_thickness: Optional[float] = None
    pregnancies: Optional[int] = None
    smoking: Optional[bool] = False
    alcohol: Optional[bool] = False


class RiskResult(BaseModel):
    id: str
    disease_type: str
    risk_score: float
    risk_category: str
    feature_importance: Dict[str, float]
    explanation: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── SYMPTOM ANALYSIS ─────────────────────────────────

class SymptomInput(BaseModel):
    description: str


class ConditionMatch(BaseModel):
    name: str
    probability: float
    description: Optional[str] = None


class SymptomResult(BaseModel):
    id: str
    raw_input: str
    classified_symptoms: List[str]
    possible_conditions: List[ConditionMatch]
    urgency_level: str
    recommendations: List[str]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── CHAT ─────────────────────────────────────────────

class ChatInput(BaseModel):
    message: str


class ChatResponse(BaseModel):
    role: str
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None


# ── NUTRITION ────────────────────────────────────────

class NutritionOut(BaseModel):
    id: str
    risk_context: Dict[str, Any]
    diet_recommendations: Dict[str, Any]
    lifestyle_recommendations: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── VITALS ───────────────────────────────────────────

class VitalInput(BaseModel):
    source: str = "manual"  # "manual", "googlefit"
    heart_rate: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    blood_glucose: Optional[float] = None
    weight_kg: Optional[float] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[float] = None


class VitalOut(BaseModel):
    id: str
    source: str
    heart_rate: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    blood_glucose: Optional[float] = None
    weight_kg: Optional[float] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    recorded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
