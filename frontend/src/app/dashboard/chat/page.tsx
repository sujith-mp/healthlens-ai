"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const msg = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: msg }]);
        setLoading(true);
        try {
            const res = await api<{ role: string; content: string }>("/api/v1/chat/message", {
                method: "POST",
                body: JSON.stringify({ message: msg }),
            });
            setMessages((prev) => [...prev, { role: "assistant", content: res.content }]);
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        await api("/api/v1/chat/history", { method: "DELETE" }).catch(() => { });
        setMessages([]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">AI Health Assistant</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Powered by Gemini — ask about symptoms, risk, or nutrition</p>
                </div>
                <button onClick={clearChat} className="btn-secondary text-sm">Clear Chat</button>
            </div>

            <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 mb-4">
                {messages.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                        <div className="text-5xl mb-4">🤖</div>
                        <p className="font-medium text-lg">Hello! I&apos;m HealthLens AI</p>
                        <p className="text-sm mt-2 max-w-md mx-auto">Ask me about symptoms, disease risk, nutrition, or general health questions.</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-6">
                            {["I have a headache and nausea", "What's my diabetes risk?", "Suggest a healthy meal plan"].map((q) => (
                                <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-500)]/20 transition">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user"
                                ? "bg-[var(--color-primary-500)] text-white rounded-br-md"
                                : "bg-[var(--bg)] rounded-bl-md"
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[var(--bg)] p-3 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: "0.2s" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div className="flex gap-2">
                <input
                    className="input-field flex-1"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                />
                <button className="btn-primary px-6" onClick={send} disabled={!input.trim() || loading}>Send</button>
            </div>
        </div>
    );
}
