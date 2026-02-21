# HealthLens AI — Digital Health Platform

AI-powered health assistant platform providing disease risk prediction, symptom analysis, nutrition guidance, medical report interpretation, and conversational AI health chatbot.

---

## 🏗️ Architecture

```
digital-health-platform/
├── backend/               # FastAPI (Python)
│   ├── api/routes/        # REST endpoints
│   ├── core/              # Config, DB, Security
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic validation
│   ├── services/          # Business logic + AI
│   └── main.py            # App entry point
├── frontend/              # Next.js (React + TypeScript)
│   └── src/app/
│       ├── page.tsx               # Landing page
│       ├── auth/login/page.tsx    # Auth
│       └── dashboard/             # Protected pages
│           ├── page.tsx           # Dashboard
│           ├── risk/              # Risk Assessment
│           ├── symptoms/          # Symptom Checker
│           ├── chat/              # AI Chatbot
│           ├── nutrition/         # Nutrition Plans
│           └── reports/           # Medical Reports
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or use SQLite for local dev)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Edit with your values
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App available at: `http://localhost:3000`

---

## 🧠 Features

| Module | Description |
|--------|-------------|
| 🫀 Risk Prediction | ML-based diabetes & heart disease risk scoring |
| 🔍 Symptom Checker | NLP-powered symptom analysis with urgency detection |
| 🤖 AI Chatbot | Gemini-powered conversational assistant with tool calling |
| 🥗 Nutrition Engine | Personalized diet & lifestyle recommendations |
| 📄 Report Scanner | OCR + AI interpretation of medical lab reports |
| 📊 Dashboard | Unified health overview with trends & history |

---

## 🔐 Security

- JWT-based authentication
- Google OAuth 2.0 support
- CORS-protected API
- Medical disclaimers on all AI outputs
- Emergency escalation in high-risk scenarios

---

## ⚠️ Medical Disclaimer

This platform provides AI-assisted health insights only and does **NOT** constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions.

---

## 📦 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL
- **AI**: Google Gemini, custom ML models
- **Auth**: JWT + Google OAuth
- **Charts**: Recharts
- **Icons**: Lucide React
