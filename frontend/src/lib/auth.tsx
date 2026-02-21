"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, getToken, setToken, clearToken } from "./api";

interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    auth_provider: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    googleLogin: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const userData = await api<User>("/api/v1/auth/me");
            setUser(userData);
        } catch {
            clearToken();
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const data = await api<{ access_token: string }>("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setToken(data.access_token);
        const userData = await api<User>("/api/v1/auth/me");
        setUser(userData);
    }

    async function register(email: string, password: string, name: string) {
        const data = await api<{ access_token: string }>("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, full_name: name }),
        });
        setToken(data.access_token);
        const userData = await api<User>("/api/v1/auth/me");
        setUser(userData);
    }

    async function googleLogin(token: string) {
        const data = await api<{ access_token: string }>("/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ token }),
        });
        setToken(data.access_token);
        const userData = await api<User>("/api/v1/auth/me");
        setUser(userData);
    }

    function logout() {
        clearToken();
        setUser(null);
        window.location.href = "/auth/login";
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
}
