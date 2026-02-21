"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        date_of_birth: "", gender: "", height_cm: "", weight_kg: "",
        blood_type: "", medical_conditions: "", medications: "",
        allergies: "", family_history: "",
    });

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const data = await api("/api/v1/profile/");
            setProfile(data);
            setForm({
                date_of_birth: data.date_of_birth || "",
                gender: data.gender || "",
                height_cm: data.height_cm?.toString() || "",
                weight_kg: data.weight_kg?.toString() || "",
                blood_type: data.blood_type || "",
                medical_conditions: data.medical_conditions?.join(", ") || "",
                medications: data.medications?.join(", ") || "",
                allergies: data.allergies?.join(", ") || "",
                family_history: data.family_history?.join(", ") || "",
            });
        } catch { }
        setLoading(false);
    };

    const save = async () => {
        setSaving(true);
        try {
            const body: any = {
                date_of_birth: form.date_of_birth || null,
                gender: form.gender || null,
                height_cm: form.height_cm ? Number(form.height_cm) : null,
                weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
                blood_type: form.blood_type || null,
                medical_conditions: form.medical_conditions ? form.medical_conditions.split(",").map(s => s.trim()).filter(Boolean) : [],
                medications: form.medications ? form.medications.split(",").map(s => s.trim()).filter(Boolean) : [],
                allergies: form.allergies ? form.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
                family_history: form.family_history ? form.family_history.split(",").map(s => s.trim()).filter(Boolean) : [],
            };
            await api("/api/v1/profile/", { method: "PUT", body: JSON.stringify(body) });
            toast("Profile updated!", "success");
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="animate-pulse p-8"><div className="h-8 bg-[var(--bg-card)] rounded w-48" /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-[var(--text-secondary)] mt-1">Manage your health profile and medical information</p>
            </div>

            {/* User card */}
            <div className="glass-card p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                    <h2 className="text-lg font-bold">{user?.full_name || "User"}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]">
                        {user?.auth_provider === "google" ? "Google Account" : "Email Account"}
                    </span>
                </div>
            </div>

            {/* Personal info */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Date of Birth</label>
                        <input type="date" className="input-field" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Gender</label>
                        <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Height (cm)</label>
                        <input type="number" className="input-field" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Weight (kg)</label>
                        <input type="number" className="input-field" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Blood Type</label>
                        <select className="input-field" value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })}>
                            <option value="">Select</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Medical info */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold">Medical Information</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Medical Conditions (comma separated)</label>
                        <input className="input-field" placeholder="e.g. Hypertension, Type 2 Diabetes" value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Current Medications (comma separated)</label>
                        <input className="input-field" placeholder="e.g. Metformin 500mg, Lisinopril 10mg" value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Allergies (comma separated)</label>
                        <input className="input-field" placeholder="e.g. Penicillin, Peanuts" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Family History (comma separated)</label>
                        <input className="input-field" placeholder="e.g. Heart disease (father), Diabetes (mother)" value={form.family_history} onChange={(e) => setForm({ ...form, family_history: e.target.value })} />
                    </div>
                </div>
            </div>

            <button className="btn-primary w-full py-3 text-base" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Profile"}
            </button>
        </div>
    );
}
