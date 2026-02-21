"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = ++_id;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const icons: Record<ToastType, string> = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️",
    };

    const colors: Record<ToastType, string> = {
        success: "var(--color-success-500)",
        error: "var(--color-danger-500)",
        info: "var(--color-primary-500)",
        warning: "var(--color-warning-500)",
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div
                style={{
                    position: "fixed",
                    bottom: "1.5rem",
                    right: "1.5rem",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxWidth: "400px",
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            background: "var(--bg-card)",
                            border: `1px solid ${colors[t.type]}`,
                            borderLeft: `4px solid ${colors[t.type]}`,
                            borderRadius: "0.75rem",
                            padding: "0.75rem 1rem",
                            boxShadow: "var(--shadow-lg)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            animation: "fadeInUp 0.3s ease",
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                        }}
                    >
                        <span>{icons[t.type]}</span>
                        <span style={{ flex: 1 }}>{t.message}</span>
                        <button
                            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-secondary)",
                                cursor: "pointer",
                                fontSize: "1rem",
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be inside ToastProvider");
    return ctx;
}
