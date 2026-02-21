"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function SymptomsPage() {
    const { toast } = useToast();
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const analyze = async () => {
        if (!desc.trim()) return;
        setLoading(true);
        try {
            const res = await api("/api/v1/symptoms/analyze", {
                method: "POST",
                body: JSON.stringify({ description: desc }),
            });
            setResult(res);
            toast("Symptom analysis complete!", "success");
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const urgencyStyles: Record<string, { emoji: string; color: string }> = {
        emergency: { emoji: "🔴", color: "var(--color-danger-500)" },
        high: { emoji: "🟠", color: "var(--color-danger-400)" },
        moderate: { emoji: "🟡", color: "var(--color-warning-500)" },
        low: { emoji: "🟢", color: "var(--color-success-500)" },
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Symptom Checker</h1>
                <p className="text-[var(--text-secondary)] mt-1">Describe your symptoms and our AI will analyze them</p>
            </div>

            <div className="glass-card p-6 space-y-4">
                <label className="font-medium text-sm block">Describe how you&apos;re feeling</label>
                <textarea
                    className="input-field min-h-[120px] resize-none"
                    placeholder="e.g. I've had a persistent headache for 3 days, along with mild nausea and sensitivity to light..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />
                <button className="btn-primary w-full py-3" disabled={!desc.trim() || loading} onClick={analyze}>
                    {loading ? "Analyzing..." : "🔍 Analyze Symptoms"}
                </button>
            </div>

            {result && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">{urgencyStyles[result.urgency_level]?.emoji || "⚪"}</span>
                            <div>
                                <h2 className="font-semibold">Urgency: {result.urgency_level.toUpperCase()}</h2>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {result.classified_symptoms.length} symptoms identified
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {result.classified_symptoms.map((s: string) => (
                                <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    {result.possible_conditions.length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-3">Possible Conditions</h3>
                            <div className="space-y-3">
                                {result.possible_conditions.map((c: any, i: number) => (
                                    <div key={i} className="p-4 rounded-xl bg-[var(--bg)]">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium">{c.name}</span>
                                            <span className="text-sm font-semibold">{(c.probability * 100).toFixed(0)}% match</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-[var(--border)] mb-2">
                                            <div className="h-full rounded-full bg-[var(--color-primary-500)] transition-all" style={{ width: `${c.probability * 100}%` }} />
                                        </div>
                                        {c.description && <p className="text-xs text-[var(--text-secondary)]">{c.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-3">Recommendations</h3>
                        <ul className="space-y-2">
                            {result.recommendations.map((r: string, i: number) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                    <span className="mt-0.5">•</span>
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
