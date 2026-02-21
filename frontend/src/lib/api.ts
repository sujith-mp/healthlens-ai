/**
 * API utility — centralized fetch wrapper for the HealthLens backend.
 * In development, defaults to http://localhost:8000 when NEXT_PUBLIC_API_URL is unset.
 */
const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

export function setToken(token: string): void {
    localStorage.setItem("token", token);
}

export function clearToken(): void {
    localStorage.removeItem("token");
}

function headersToRecord(h: Headers): Record<string, string> {
    const r: Record<string, string> = {};
    h.forEach((v, k) => {
        r[k] = v;
    });
    return r;
}

export async function api<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const initialHeaders =
        options.headers instanceof Headers
            ? headersToRecord(options.headers)
            : { ...(options.headers as Record<string, string>) };
    const headers: Record<string, string> = {
        ...initialHeaders,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (let browser set boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        clearToken();
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
        throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const error = await res.json().catch(() => ({ detail: "Request failed" }));
            throw new Error(error.detail || `Error ${res.status}`);
        } else {
            const text = await res.text();
            if (process.env.NODE_ENV === "development") {
                console.error(`Backend returned non-JSON error (${res.status}):`, text);
            }
            throw new Error(`Server Error ${res.status}. Please check console.`);
        }
    }

    return res.json();
}
