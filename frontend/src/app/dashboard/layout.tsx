"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/auth/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            setIsDark(true);
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/dashboard/risk", label: "Risk Assessment", icon: "🫀" },
        { href: "/dashboard/chat", label: "Health Assistant", icon: "🤖" },
        { href: "/dashboard/nutrition", label: "Nutrition Plan", icon: "🥗" },
        { href: "/dashboard/reports", label: "Medical Reports", icon: "📄" },
        { href: "/dashboard/medications", label: "Medications", icon: "💊" },
        { href: "/dashboard/vitals", label: "Vitals", icon: "❤️" },
        { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          ${sidebarOpen ? "w-64" : "w-20"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          fixed md:static inset-y-0 left-0 z-50
          bg-[var(--bg-card)] border-r border-[var(--border)]
          flex flex-col transition-all duration-300 shrink-0
        `}
            >
                <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--border)]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                        H
                    </div>
                    {sidebarOpen && (
                        <span className="text-lg font-bold tracking-tight">
                            Health<span className="text-[var(--color-primary-500)]">Lens</span>
                        </span>
                    )}
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="text-xl shrink-0">{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-[var(--border)] space-y-2">
                    <button onClick={toggleTheme} className="sidebar-link w-full">
                        <span className="text-xl">{isDark ? "☀️" : "🌙"}</span>
                        {sidebarOpen && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
                    </button>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-link w-full hidden md:flex">
                        <span className="text-xl">{sidebarOpen ? "◀️" : "▶️"}</span>
                        {sidebarOpen && <span>Collapse</span>}
                    </button>
                    <button onClick={logout} className="sidebar-link w-full text-[var(--color-danger-500)]">
                        <span className="text-xl">🚪</span>
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile header */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <button onClick={() => setMobileOpen(true)} className="text-2xl">☰</button>
                    <span className="font-bold">
                        Health<span className="text-[var(--color-primary-500)]">Lens</span>
                    </span>
                    <button onClick={toggleTheme} className="text-xl">{isDark ? "☀️" : "🌙"}</button>
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
