"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Symptom checker is now integrated into Health Assistant (chat).
 * Redirect so old links and bookmarks still work.
 */
export default function SymptomsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dashboard/chat");
    }, [router]);
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-[var(--text-secondary)]">Redirecting to Health Assistant...</p>
        </div>
    );
}
