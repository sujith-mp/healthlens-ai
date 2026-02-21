"use client";

import { useState } from "react";

export default function HomePage() {
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.setAttribute(
            "data-theme",
            !isDark ? "dark" : "light"
        );
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── HEADER / NAV ── */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-card)]/80 border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            H
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            Health<span className="text-[var(--color-primary-500)]">Lens</span>{" "}
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]">
                                AI
                            </span>
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
                        <a href="#features" className="hover:text-[var(--color-primary-500)] transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-[var(--color-primary-500)] transition-colors">How It Works</a>
                        <a href="#safety" className="hover:text-[var(--color-primary-500)] transition-colors">Safety</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-secondary)]"
                            aria-label="Toggle Theme"
                        >
                            {isDark ? "☀️" : "🌙"}
                        </button>
                        <a href="/auth/login" className="btn-secondary text-sm hidden sm:inline-block">
                            Sign In
                        </a>
                        <a href="/auth/login" className="btn-primary text-sm">
                            Get Started
                        </a>
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <main className="flex-1">
                <section className="relative overflow-hidden py-24 md:py-32">
                    {/* gradient orbs */}
                    <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--color-primary-500)]/10 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[var(--color-accent-500)]/10 blur-[120px] pointer-events-none" />

                    <div className="max-w-5xl mx-auto text-center px-6 relative">
                        <div className="animate-fade-in-up">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)] text-sm font-semibold mb-6">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-success-500)] animate-pulse" />
                                AI-Powered &bull; Preventive Care
                            </span>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mt-4">
                                Your Health,{" "}
                                <span className="bg-gradient-to-r from-[var(--color-primary-500)] via-[var(--color-accent-500)] to-[var(--color-primary-400)] bg-clip-text text-transparent">
                                    Understood
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mt-6 leading-relaxed">
                                HealthLens AI uses advanced machine learning to predict disease risk,
                                analyze symptoms, interpret medical reports, and provide personalized
                                health guidance — all in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                                <a href="/auth/login" className="btn-primary text-base px-8 py-3">
                                    Start Free Assessment →
                                </a>
                                <a href="#features" className="btn-secondary text-base px-8 py-3">
                                    Explore Features
                                </a>
                            </div>
                        </div>

                        {/* KPI strip */}
                        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                            {[
                                { value: "AI", label: "Powered" },
                                { value: "10+", label: "Health Tools" },
                                { value: "<2s", label: "Response Time" },
                            ].map((s) => (
                                <div key={s.label} className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] bg-clip-text text-transparent">
                                        {s.value}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section id="features" className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Comprehensive Health Intelligence
                            </h2>
                            <p className="text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
                                Six powerful modules working together to give you a complete picture of your health.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
                            {[
                                {
                                    icon: "🫀",
                                    title: "Disease Risk Prediction",
                                    desc: "AI models analyze your vitals and history to predict risk for diabetes, heart disease, and more.",
                                    color: "var(--color-danger-500)",
                                },
                                {
                                    icon: "🔍",
                                    title: "Symptom Checker",
                                    desc: "Describe your symptoms naturally. Our NLP engine identifies possible conditions and urgency level.",
                                    color: "var(--color-warning-500)",
                                },
                                {
                                    icon: "🤖",
                                    title: "AI Health Chatbot",
                                    desc: "Conversational assistant powered by Google Gemini with access to your health data and ML tools.",
                                    color: "var(--color-primary-500)",
                                },
                                {
                                    icon: "🥗",
                                    title: "Nutrition & Lifestyle",
                                    desc: "Personalized meal plans and lifestyle recommendations based on your risk profile.",
                                    color: "var(--color-success-500)",
                                },
                                {
                                    icon: "📄",
                                    title: "Medical Report Scanner",
                                    desc: "Upload lab reports — AI extracts values, highlights abnormalities, and generates summaries.",
                                    color: "var(--color-accent-500)",
                                },
                                {
                                    icon: "📊",
                                    title: "Health Dashboard",
                                    desc: "Track your risk trends, symptom history, and health journey over time in one unified view.",
                                    color: "var(--color-primary-400)",
                                },
                            ].map((f) => (
                                <div
                                    key={f.title}
                                    className="glass-card p-6 animate-fade-in-up opacity-0"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                                        style={{
                                            background: `color-mix(in srgb, ${f.color} 12%, transparent)`,
                                        }}
                                    >
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                        {f.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ── */}
                <section id="how-it-works" className="py-20 px-6 bg-[var(--bg-card)]">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-14">
                            How HealthLens Works
                        </h2>
                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { step: "01", title: "Sign Up", desc: "Create your account securely with Google." },
                                { step: "02", title: "Input Data", desc: "Enter your vitals, symptoms, or upload reports." },
                                { step: "03", title: "AI Analyzes", desc: "Our ML models and Gemini process your data." },
                                { step: "04", title: "Get Insights", desc: "Receive risk scores, recommendations, and guidance." },
                            ].map((s) => (
                                <div key={s.step} className="animate-fade-in-up opacity-0">
                                    <div className="text-4xl font-extrabold bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] bg-clip-text text-transparent">
                                        {s.step}
                                    </div>
                                    <h4 className="text-lg font-semibold mt-3">{s.title}</h4>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SAFETY ── */}
                <section id="safety" className="py-20 px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Safety First, Always
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-10 max-w-xl mx-auto">
                            HealthLens AI assists — it never replaces a medical professional.
                            Every interaction carries proper medical disclaimers.
                        </p>
                        <div className="glass-card p-8 text-left space-y-4">
                            {[
                                "🛡️ All predictions include a clear 'Not a medical diagnosis' disclaimer",
                                "🚨 Emergency escalation: high-risk results prompt immediate recommendations to see a doctor",
                                "🔒 Data encrypted in transit (HTTPS) and at rest — your health data is yours",
                                "🤝 AI-assisted, never AI-replacing-doctors — preventive care philosophy",
                                "✅ Transparent predictions with feature importance and explainability",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                                    <span className="text-base">{item.slice(0, 2)}</span>
                                    <span>{item.slice(3)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-500)]/5 to-[var(--color-accent-500)]/5 pointer-events-none" />
                        <h2 className="text-3xl font-bold relative">
                            Ready to understand your health?
                        </h2>
                        <p className="text-[var(--text-secondary)] mt-3 relative">
                            Join thousands who use AI-powered insights for proactive health management.
                        </p>
                        <a href="/auth/login" className="btn-primary text-base px-10 py-3 inline-block mt-8 relative">
                            Get Started Free
                        </a>
                    </div>
                </section>
            </main>

            {/* ── FOOTER ── */}
            <footer className="border-t border-[var(--border)] py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-secondary)]">
                    <span>© 2026 HealthLens AI. All rights reserved.</span>
                    <span className="text-xs">
                        ⚕️ This platform does not provide medical diagnoses. Consult a healthcare professional for medical advice.
                    </span>
                </div>
            </footer>
        </div>
    );
}
