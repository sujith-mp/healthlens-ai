"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function RiskPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [form, setForm] = useState({
        age: "", bmi: "", glucose: "", cholesterol: "",
        blood_pressure_systolic: "", blood_pressure_diastolic: "",
        insulin: "", smoking: false, alcohol: false,
    });

    const update = (k: string, v: any) => setForm({ ...form, [k]: v });

    const assess = async (type: "diabetes" | "heart-disease") => {
        setLoading(true);
        try {
            const body: any = {
                age: Number(form.age), bmi: Number(form.bmi),
                blood_pressure_systolic: Number(form.blood_pressure_systolic),
                blood_pressure_diastolic: Number(form.blood_pressure_diastolic),
                smoking: form.smoking, alcohol: form.alcohol,
            };
            if (form.glucose) body.glucose = Number(form.glucose);
            if (form.cholesterol) body.cholesterol = Number(form.cholesterol);
            if (form.insulin) body.insulin = Number(form.insulin);

            const res = await api(`/api/v1/risk/${type}`, { method: "POST", body: JSON.stringify(body) });
            setResult(res);
            toast("Assessment complete! Results saved.", "success");
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Disease Risk Assessment</h1>
                <p className="text-[var(--text-secondary)] mt-1">Enter your health metrics to predict risk levels</p>
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold text-lg">Health Metrics</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        { k: "age", l: "Age", p: "e.g. 35", t: "number" },
                        { k: "bmi", l: "BMI", p: "e.g. 24.5", t: "number" },
                        { k: "glucose", l: "Fasting Glucose (mg/dL)", p: "e.g. 95", t: "number" },
                        { k: "cholesterol", l: "Total Cholesterol (mg/dL)", p: "e.g. 190", t: "number" },
                        { k: "blood_pressure_systolic", l: "Systolic BP (mmHg)", p: "e.g. 120", t: "number" },
                        { k: "blood_pressure_diastolic", l: "Diastolic BP (mmHg)", p: "e.g. 80", t: "number" },
                        { k: "insulin", l: "Insulin (µIU/mL)", p: "e.g. 15", t: "number" },
                    ].map((f) => (
                        <div key={f.k}>
                            <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">{f.l}</label>
                            <input type={f.t} className="input-field" placeholder={f.p} value={(form as any)[f.k]} onChange={(e) => update(f.k, e.target.value)} />
                        </div>
                    ))}
                </div>

                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.smoking} onChange={(e) => update("smoking", e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm">Smoker</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.alcohol} onChange={(e) => update("alcohol", e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm">Drinks Alcohol</span>
                    </label>
                </div>

                <div className="flex gap-3 pt-2">
                    <button className="btn-primary flex-1" disabled={loading || !form.age || !form.bmi} onClick={() => assess("diabetes")}>
                        {loading ? "Analyzing..." : "🫀 Diabetes Risk"}
                    </button>
                    <button className="btn-secondary flex-1" disabled={loading || !form.age || !form.bmi} onClick={() => assess("heart-disease")}>
                        {loading ? "Analyzing..." : "💓 Heart Disease Risk"}
                    </button>
                </div>
            </div>

            {result && (
                <div className="glass-card p-6 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-lg">{result.disease_type.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} Risk</h2>
                        <span className={`text-sm px-3 py-1 rounded-full font-semibold risk-${result.risk_category}`}>
                            {result.risk_category.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-bold" style={{ color: result.risk_category === "high" ? "var(--color-danger-500)" : result.risk_category === "moderate" ? "var(--color-warning-500)" : "var(--color-success-500)" }}>
                            {(result.risk_score * 100).toFixed(0)}%
                        </div>
                        <div className="flex-1">
                            <div className="w-full h-3 rounded-full bg-[var(--border)]">
                                <div className="h-full rounded-full transition-all duration-700" style={{
                                    width: `${result.risk_score * 100}%`,
                                    background: result.risk_category === "high" ? "var(--color-danger-500)" : result.risk_category === "moderate" ? "var(--color-warning-500)" : "var(--color-success-500)",
                                }} />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium text-sm mb-2">Top Contributing Factors</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(result.feature_importance).slice(0, 6).map(([k, v]: [string, any]) => (
                                <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)]">
                                    <span className="text-sm capitalize">{k.replace("_", " ")}</span>
                                    <span className="text-xs font-semibold">{(v * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.explanation}</p>
                </div>
            )}
        </div>
    );
}
