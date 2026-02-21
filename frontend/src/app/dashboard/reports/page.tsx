"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function ReportsPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => { loadReports(); }, []);

    const loadReports = async () => {
        try {
            const data = await api("/api/v1/reports/");
            setReports(data);
        } catch { }
    };

    const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await api("/api/v1/reports/upload", { method: "POST", body: form });
            setSelected(res);
            toast("Report analyzed successfully!", "success");
            loadReports();
        } catch (err: any) {
            toast(err.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const viewReport = async (id: string) => {
        try {
            const data = await api(`/api/v1/reports/${id}`);
            setSelected(data);
        } catch (err: any) {
            toast(err.message, "error");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold">Medical Reports</h1>
                <p className="text-[var(--text-secondary)] mt-1">Upload lab reports for AI-powered analysis</p>
            </div>

            <div className="glass-card p-6 text-center">
                <label className="cursor-pointer block">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={upload} className="hidden" />
                    <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 hover:border-[var(--color-primary-500)] transition-colors">
                        <div className="text-4xl mb-3">📤</div>
                        <p className="font-semibold">{uploading ? "Analyzing..." : "Click to upload a report"}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Supports PDF, PNG, JPG — Max 10MB</p>
                    </div>
                </label>
            </div>

            {/* Report list */}
            {reports.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-3">Previous Reports</h2>
                    <div className="space-y-2">
                        {reports.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => viewReport(r.id)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--bg-card-hover)] transition text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{r.file_type === "pdf" ? "📄" : "🖼️"}</span>
                                    <div>
                                        <span className="font-medium text-sm">{r.file_name}</span>
                                        {r.abnormal_flags?.length > 0 && (
                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning-500)]/10 text-[var(--color-warning-500)]">
                                                {r.abnormal_flags.length} flags
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected report details */}
            {selected && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="glass-card p-6">
                        <h2 className="font-semibold mb-3">📊 Lab Values</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {selected.extracted_values && Object.entries(selected.extracted_values).map(([name, v]: [string, any]) => (
                                <div key={name} className={`p-3 rounded-xl border ${v.status === "normal" ? "border-[var(--color-success-500)]/20 bg-[var(--color-success-500)]/5" :
                                        v.status === "high" ? "border-[var(--color-danger-500)]/20 bg-[var(--color-danger-500)]/5" :
                                            "border-[var(--color-warning-500)]/20 bg-[var(--color-warning-500)]/5"
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm">{name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.status === "normal" ? "risk-low" : v.status === "high" ? "risk-high" : "risk-moderate"
                                            }`}>{v.status}</span>
                                    </div>
                                    <div className="text-lg font-bold mt-1">{v.value} <span className="text-xs text-[var(--text-secondary)]">{v.unit}</span></div>
                                    <div className="text-xs text-[var(--text-secondary)]">Ref: {v.ref}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selected.ai_summary && (
                        <div className="glass-card p-6">
                            <h2 className="font-semibold mb-3">🤖 AI Summary</h2>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{selected.ai_summary}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
