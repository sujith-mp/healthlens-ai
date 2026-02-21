"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
                    renderButton: (element: HTMLElement, config: { theme?: string; size?: string; width?: number; text?: string; shape?: string }) => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const { login, register, googleLogin } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    const handleGoogleResponse = useCallback(
        async (response: { credential: string }) => {
            setLoading(true);
            setError("");
            try {
                await googleLogin(response.credential);
                toast("Welcome to HealthLens AI!", "success");
                router.push("/dashboard");
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Google sign-in failed";
                setError(message);
                toast(message, "error");
            } finally {
                setLoading(false);
            }
        },
        [googleLogin, toast, router]
    );

    useEffect(() => {
        if (!googleClientId) return;

        const loadScript = () => {
            if (document.getElementById("gsi-script")) return;
            const script = document.createElement("script");
            script.id = "gsi-script";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        };

        const initGoogle = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleResponse,
                });
                const btnContainer = document.getElementById("google-signin-btn");
                if (btnContainer) {
                    btnContainer.innerHTML = "";
                    window.google.accounts.id.renderButton(btnContainer, {
                        theme: "outline",
                        size: "large",
                        width: 320,
                        text: "continue_with",
                        shape: "pill",
                    });
                }
            }
        };

        loadScript();
        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const checkGoogle = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(checkGoogle);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(checkGoogle);
        }
    }, [googleClientId, handleGoogleResponse]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password, name);
            }
            toast("Welcome to HealthLens AI!", "success");
            router.push("/dashboard");
        } catch (err: unknown) {
            const rawMessage = err instanceof Error ? err.message : "Something went wrong";
            const isNetworkError =
                typeof rawMessage === "string" &&
                (rawMessage.toLowerCase().includes("fetch") ||
                    rawMessage.toLowerCase().includes("network") ||
                    rawMessage === "Failed to fetch");
            const message = isNetworkError
                ? "Cannot reach the server. Check your connection and that the app is configured correctly."
                : rawMessage;
            setError(message);
            toast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--color-primary-500)]/8 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-accent-500)]/8 blur-[140px] pointer-events-none" />

            <div className="glass-card w-full max-w-md p-8 relative animate-fade-in-up">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        H
                    </div>
                    <span className="text-2xl font-bold tracking-tight">
                        Health<span className="text-[var(--color-primary-500)]">Lens</span>
                    </span>
                </div>

                <div className="flex bg-[var(--bg)] rounded-xl p-1 mb-8">
                    <button
                        onClick={() => { setIsLogin(true); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? "bg-[var(--bg-card)] shadow text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? "bg-[var(--bg-card)] shadow text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-sm bg-[var(--color-danger-500)]/10 text-[var(--color-danger-500)] border border-[var(--color-danger-500)]/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Full Name</label>
                            <input type="text" className="input-field" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Email</label>
                        <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Password</label>
                        <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                        {!isLogin && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
                            </p>
                        )}
                    </div>
                    <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
                        {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-secondary)]">or continue with</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {googleClientId ? (
                    <div id="google-signin-btn" className="flex justify-center min-h-[44px]" />
                ) : (
                    <button
                        type="button"
                        onClick={() => toast("Google OAuth requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment to enable.", "info")}
                        className="btn-secondary w-full flex items-center justify-center gap-3 py-3"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.78.01-.52z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-sm font-semibold">Google</span>
                    </button>
                )}

                <p className="text-xs text-center text-[var(--text-secondary)] mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
