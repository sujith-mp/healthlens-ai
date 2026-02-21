"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function NutritionPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [risks, setRisks] = useState<{ disease_type: string; risk_category: string }[]>([]);

    const generate = async () => {
        setLoading(true);
        try {
            const res = await api("/api/v1/nutrition/plan", {
                method: "POST",
                body: JSON.stringify(risks),
            });
            setResult(res);
            toast("Nutrition plan generated!", "success");
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Nutrition & Lifestyle Plan</h1>
                <p className="text-[var(--text-secondary)] mt-1">Daily nutrition and lifestyle tips — for everyone or tailored to your risk profile</p>
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold">Who is this plan for?</h2>
                <p className="text-sm text-[var(--text-secondary)]">Choose &quot;General wellness&quot; for everyday tips, or add risk areas if you&apos;ve done a risk assessment.</p>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => setRisks([])}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${risks.length === 0 ? "bg-[var(--color-primary-500)] text-white" : "bg-[var(--bg)] text-[var(--text-secondary)]"}`}
                    >
                        🌱 General wellness (everyone)
                    </button>
                    {["diabetes", "heart_disease"].map((d) => {
                        const active = risks.some(r => r.disease_type === d);
                        return (
                            <button
                                key={d}
                                onClick={() => {
                                    if (active) setRisks(risks.filter(r => r.disease_type !== d));
                                    else setRisks([...risks, { disease_type: d, risk_category: "moderate" }]);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? "bg-[var(--color-primary-500)] text-white" : "bg-[var(--bg)] text-[var(--text-secondary)]"}`}
                            >
                                {d === "diabetes" ? "🫀 Diabetes focus" : "💓 Heart health focus"}
                            </button>
                        );
                    })}
                </div>
                <button className="btn-primary w-full py-3" onClick={generate} disabled={loading}>
                    {loading ? "Generating..." : "🥗 Generate Nutrition & Lifestyle Plan"}
                </button>
            </div>

            {result && (
                <div className="space-y-4 animate-fade-in-up">
                    {result.diet_recommendations?.general_guidelines && (
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-3">📋 General Guidelines</h3>
                            <ul className="space-y-2">
                                {result.diet_recommendations.general_guidelines.map((g: string, i: number) => (
                                    <li key={i} className="text-sm flex items-start gap-2"><span>•</span><span>{g}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result.diet_recommendations?.meal_plan && (
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-3">🍽️ Daily Meal Plan</h3>
                            {["breakfast", "lunch", "dinner"].map((meal) => {
                                const m = result.diet_recommendations.meal_plan[meal];
                                if (!m) return null;
                                return (
                                    <div key={meal} className="mb-4 p-4 rounded-xl bg-[var(--bg)]">
                                        <span className="font-medium capitalize text-sm">{meal}</span>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">A: {m.option_a}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">B: {m.option_b}</p>
                                        {m.notes && <p className="text-xs text-[var(--color-warning-500)] mt-1">⚠️ {m.notes}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                        {result.diet_recommendations?.foods_to_increase?.length > 0 && (
                            <div className="glass-card p-6">
                                <h3 className="font-semibold mb-3 text-[var(--color-success-500)]">✅ Foods to Increase</h3>
                                <ul className="space-y-1">
                                    {result.diet_recommendations.foods_to_increase.map((f: string, i: number) => (
                                        <li key={i} className="text-sm text-[var(--text-secondary)]">• {f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {result.diet_recommendations?.foods_to_limit?.length > 0 && (
                            <div className="glass-card p-6">
                                <h3 className="font-semibold mb-3 text-[var(--color-danger-500)]">❌ Foods to Limit</h3>
                                <ul className="space-y-1">
                                    {result.diet_recommendations.foods_to_limit.map((f: string, i: number) => (
                                        <li key={i} className="text-sm text-[var(--text-secondary)]">• {f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {result.lifestyle_recommendations && (
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-3">🏃 Lifestyle Recommendations</h3>
                            <div className="space-y-2">
                                {result.lifestyle_recommendations.exercise?.map((e: string, i: number) => (
                                    <p key={i} className="text-sm text-[var(--text-secondary)]">🏋️ {e}</p>
                                ))}
                                {result.lifestyle_recommendations.sleep?.map((s: string, i: number) => (
                                    <p key={i} className="text-sm text-[var(--text-secondary)]">😴 {s}</p>
                                ))}
                                {result.lifestyle_recommendations.stress_management?.map((s: string, i: number) => (
                                    <p key={i} className="text-sm text-[var(--text-secondary)]">🧘 {s}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
