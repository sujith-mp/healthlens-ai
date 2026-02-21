"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function VitalsPage() {
    const { toast } = useToast();
    const [vitals, setVitals] = useState<any[]>([]);
    const [latest, setLatest] = useState<any>(null);
    const [form, setForm] = useState({
        heart_rate: "", steps: "", sleep_hours: "",
        blood_pressure_systolic: "", blood_pressure_diastolic: "",
        blood_glucose: "", weight_kg: "", temperature: "", oxygen_saturation: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setVitals(await api("/api/v1/vitals/?limit=10"));
            setLatest(await api("/api/v1/vitals/latest"));
        } catch { }
    };

    const update = (k: string, v: string) => setForm({ ...form, [k]: v });

    const save = async () => {
        setSaving(true);
        try {
            const body: any = { source: "manual" };
            Object.entries(form).forEach(([k, v]) => {
                if (v) body[k] = Number(v);
            });
            await api("/api/v1/vitals/", { method: "POST", body: JSON.stringify(body) });
            toast("Vitals recorded!", "success");
            setForm({ heart_rate: "", steps: "", sleep_hours: "", blood_pressure_systolic: "", blood_pressure_diastolic: "", blood_glucose: "", weight_kg: "", temperature: "", oxygen_saturation: "" });
            load();
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const vitalCards = [
        { key: "heart_rate", label: "Heart Rate", unit: "bpm", icon: "❤️", color: "var(--color-danger-500)" },
        { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: "🩸", color: "var(--color-primary-500)" },
        { key: "blood_glucose", label: "Blood Glucose", unit: "mg/dL", icon: "🍬", color: "var(--color-warning-500)" },
        { key: "oxygen_saturation", label: "SpO2", unit: "%", icon: "🫁", color: "var(--color-primary-400)" },
        { key: "weight_kg", label: "Weight", unit: "kg", icon: "⚖️", color: "var(--color-accent-500)" },
        { key: "steps", label: "Steps", unit: "steps", icon: "🚶", color: "var(--color-success-500)" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Vitals Tracking</h1>
                <p className="text-[var(--text-secondary)] mt-1">Manual entry or wearable sync — track your health vitals</p>
            </div>

            {/* Latest vitals overview */}
            {latest && !latest.message && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vitalCards.map((vc) => {
                        const val = latest[vc.key];
                        return (
                            <div key={vc.key} className="glass-card p-4">
                                <div className="text-xl mb-1">{vc.icon}</div>
                                <div className="text-sm text-[var(--text-secondary)]">{vc.label}</div>
                                <div className="text-xl font-bold" style={{ color: vc.color }}>
                                    {val !== null && val !== undefined ? val : "—"}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">{vc.unit}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Manual entry */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold">Record Vitals (Manual Entry)</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { k: "heart_rate", l: "Heart Rate (bpm)" },
                        { k: "blood_pressure_systolic", l: "Systolic BP" },
                        { k: "blood_pressure_diastolic", l: "Diastolic BP" },
                        { k: "blood_glucose", l: "Blood Glucose (mg/dL)" },
                        { k: "oxygen_saturation", l: "SpO2 (%)" },
                        { k: "weight_kg", l: "Weight (kg)" },
                        { k: "steps", l: "Steps" },
                        { k: "sleep_hours", l: "Sleep (hours)" },
                        { k: "temperature", l: "Temperature (°C)" },
                    ].map((f) => (
                        <div key={f.k}>
                            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{f.l}</label>
                            <input type="number" className="input-field" value={(form as any)[f.k]} onChange={(e) => update(f.k, e.target.value)} />
                        </div>
                    ))}
                </div>
                <button className="btn-primary w-full py-3" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "📊 Record Vitals"}
                </button>
            </div>

            {/* History */}
            {vitals.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-3">Recent Readings</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[var(--text-secondary)] text-left border-b border-[var(--border)]">
                                    <th className="pb-2 pr-4">Date</th>
                                    <th className="pb-2 pr-4">HR</th>
                                    <th className="pb-2 pr-4">BP</th>
                                    <th className="pb-2 pr-4">Glucose</th>
                                    <th className="pb-2 pr-4">SpO2</th>
                                    <th className="pb-2">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vitals.map((v) => (
                                    <tr key={v.id} className="border-b border-[var(--border)]/50">
                                        <td className="py-2 pr-4">{v.recorded_at ? new Date(v.recorded_at).toLocaleDateString() : "—"}</td>
                                        <td className="py-2 pr-4">{v.heart_rate || "—"}</td>
                                        <td className="py-2 pr-4">{v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : "—"}</td>
                                        <td className="py-2 pr-4">{v.blood_glucose || "—"}</td>
                                        <td className="py-2 pr-4">{v.oxygen_saturation || "—"}</td>
                                        <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-[var(--bg)]">{v.source}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
