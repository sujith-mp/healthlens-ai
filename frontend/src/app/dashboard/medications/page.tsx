"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function MedicationsPage() {
    const { toast } = useToast();
    const [meds, setMeds] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { setMeds(await api("/api/v1/medications/")); } catch { }
    };

    const addMed = async () => {
        if (!name.trim()) return;
        setAdding(true);
        try {
            await api("/api/v1/medications/", {
                method: "POST",
                body: JSON.stringify({ name, dosage, frequency }),
            });
            setName(""); setDosage(""); setFrequency("");
            toast("Medication added!", "success");
            load();
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setAdding(false);
        }
    };

    const logMed = async (medId: string, taken: boolean) => {
        try {
            await api("/api/v1/medications/log", {
                method: "POST",
                body: JSON.stringify({ medication_id: medId, taken }),
            });
            toast(taken ? "Marked as taken ✅" : "Marked as missed", taken ? "success" : "warning");
        } catch (err: any) {
            toast(err.message, "error");
        }
    };

    const removeMed = async (id: string) => {
        try {
            await api(`/api/v1/medications/${id}`, { method: "DELETE" });
            toast("Medication removed", "info");
            load();
        } catch (err: any) {
            toast(err.message, "error");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Medication Tracker</h1>
                <p className="text-[var(--text-secondary)] mt-1">Track your medications and adherence</p>
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold">Add Medication</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                    <input className="input-field" placeholder="Name (e.g. Metformin)" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="input-field" placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                    <input className="input-field" placeholder="Frequency (e.g. twice daily)" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                </div>
                <button className="btn-primary" disabled={!name.trim() || adding} onClick={addMed}>
                    {adding ? "Adding..." : "➕ Add Medication"}
                </button>
            </div>

            {meds.filter(m => m.is_active).length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4">Your Medications</h2>
                    <div className="space-y-3">
                        {meds.filter(m => m.is_active).map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)]">
                                <div>
                                    <span className="font-medium">💊 {m.name}</span>
                                    <span className="text-sm text-[var(--text-secondary)] ml-2">{m.dosage} — {m.frequency}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => logMed(m.id, true)} className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-success-500)]/10 text-[var(--color-success-500)] hover:bg-[var(--color-success-500)]/20 transition font-medium">
                                        ✅ Taken
                                    </button>
                                    <button onClick={() => logMed(m.id, false)} className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-warning-500)]/10 text-[var(--color-warning-500)] hover:bg-[var(--color-warning-500)]/20 transition font-medium">
                                        ❌ Missed
                                    </button>
                                    <button onClick={() => removeMed(m.id)} className="text-xs px-2 py-1.5 rounded-lg hover:bg-[var(--color-danger-500)]/10 text-[var(--text-secondary)] transition">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
