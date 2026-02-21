"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface DashboardData {
    user_name: string;
    health_score: number;
    latest_risks: Record<string, { disease_type: string; risk_score: number; risk_category: string }>;
    total_assessments: number;
    total_symptom_checks: number;
    total_reports: number;
    recent_activity: Array<{ type: string; icon: string; title: string; desc: string; time: string }>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<DashboardData>("/api/v1/dashboard/summary")
            .then(setData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-[var(--bg-card)] rounded w-64" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[var(--bg-card)] rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const d = data!;
    const scoreColor = d.health_score >= 70 ? "var(--color-success-500)" : d.health_score >= 40 ? "var(--color-warning-500)" : "var(--color-danger-500)";

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {d.user_name} 👋</h1>
                <p className="text-[var(--text-secondary)] mt-1">Here&apos;s your health overview</p>
            </div>

            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Health Score</div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold" style={{ color: scoreColor }}>{d.health_score}</span>
                        <span className="text-sm text-[var(--text-secondary)] mb-1">/100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--border)] mt-3">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.health_score}%`, background: scoreColor }} />
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Risk Assessments</div>
                    <div className="text-3xl font-bold">{d.total_assessments}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Total completed</div>
                </div>

                <div className="glass-card p-5">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Symptom Checks</div>
                    <div className="text-3xl font-bold">{d.total_symptom_checks}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Analyses performed</div>
                </div>

                <div className="glass-card p-5">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Medical Reports</div>
                    <div className="text-3xl font-bold">{d.total_reports}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Uploaded & analyzed</div>
                </div>
            </div>

            {/* Risk Snapshot + Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Latest Risk Scores</h2>
                    {Object.keys(d.latest_risks).length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)]">No assessments yet. <a href="/dashboard/risk" className="text-[var(--color-primary-500)] underline">Run your first →</a></p>
                    ) : (
                        <div className="space-y-3">
                            {Object.values(d.latest_risks).map((r) => (
                                <div key={r.disease_type} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg)]">
                                    <div>
                                        <span className="font-medium">{r.disease_type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full risk-${r.risk_category}`}>{r.risk_category}</span>
                                    </div>
                                    <span className="font-bold">{(r.risk_score * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                    {d.recent_activity.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)]">No activity yet. Start using the platform!</p>
                    ) : (
                        <div className="space-y-3">
                            {d.recent_activity.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg)]">
                                    <span className="text-xl">{a.icon}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{a.title}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{a.desc}</div>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        {a.time ? new Date(a.time).toLocaleDateString() : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { href: "/dashboard/risk", icon: "🫀", label: "Run Risk Assessment", color: "var(--color-danger-500)" },
                    { href: "/dashboard/symptoms", icon: "🔍", label: "Check Symptoms", color: "var(--color-warning-500)" },
                    { href: "/dashboard/chat", icon: "🤖", label: "Talk to AI", color: "var(--color-primary-500)" },
                ].map((q) => (
                    <a key={q.href} href={q.href} className="glass-card p-5 flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `color-mix(in srgb, ${q.color} 12%, transparent)` }}>
                            {q.icon}
                        </div>
                        <span className="font-semibold group-hover:text-[var(--color-primary-500)] transition-colors">{q.label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
