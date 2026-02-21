"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const urgencyEmoji: Record<string, string> = {
    emergency: "🔴",
    high: "🟠",
    moderate: "🟡",
    low: "🟢",
};

function formatSymptomResult(res: {
    urgency_level: string;
    classified_symptoms: string[];
    possible_conditions: { name: string; probability: number; description?: string }[];
    recommendations: string[];
}): string {
    let text = `**Urgency: ${(urgencyEmoji[res.urgency_level] || "⚪")} ${res.urgency_level.toUpperCase()}**\n\n`;
    if (res.classified_symptoms?.length) {
        text += `**Symptoms identified:** ${res.classified_symptoms.join(", ")}\n\n`;
    }
    if (res.possible_conditions?.length) {
        text += "**Possible conditions:**\n";
        res.possible_conditions.forEach((c) => {
            text += `- ${c.name} (${(c.probability * 100).toFixed(0)}% match)${c.description ? ` — ${c.description}` : ""}\n`;
        });
        text += "\n";
    }
    if (res.recommendations?.length) {
        text += "**Recommendations:**\n";
        res.recommendations.forEach((r) => { text += `- ${r}\n`; });
    }
    text += "\n⚕️ *This is not a medical diagnosis. Please see a healthcare professional for proper evaluation.*";
    return text;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [symptomText, setSymptomText] = useState("");
    const [symptomLoading, setSymptomLoading] = useState(false);
    const [showSymptomCard, setShowSymptomCard] = useState(true);
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

    const analyzeSymptoms = async () => {
        if (!symptomText.trim() || symptomLoading) return;
        const desc = symptomText.trim();
        setMessages((prev) => [...prev, { role: "user", content: `[Symptom check] ${desc}` }]);
        setSymptomLoading(true);
        try {
            const res = await api<{
                urgency_level: string;
                classified_symptoms: string[];
                possible_conditions: { name: string; probability: number; description?: string }[];
                recommendations: string[];
            }>("/api/v1/symptoms/analyze", {
                method: "POST",
                body: JSON.stringify({ description: desc }),
            });
            const formatted = formatSymptomResult(res);
            setMessages((prev) => [...prev, { role: "assistant", content: formatted }]);
            setSymptomText("");
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "Symptom analysis failed. Please try again or ask in the chat below." }]);
        } finally {
            setSymptomLoading(false);
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
                    <h1 className="text-2xl font-bold">Health Assistant</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Symptom checker + AI chat (Google Gemini) — one place for symptoms, risk, and nutrition</p>
                </div>
                <button onClick={clearChat} className="btn-secondary text-sm">Clear Chat</button>
            </div>

            {/* Symptom checker + Chat in one view */}
            {showSymptomCard && (
                <div className="glass-card p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-sm">🔍 Quick symptom check</h3>
                        <button type="button" onClick={() => setShowSymptomCard(false)} className="text-xs text-[var(--text-secondary)] hover:underline">Collapse</button>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">Describe how you feel; results appear in the conversation below.</p>
                    <div className="flex gap-2">
                        <textarea
                            className="input-field flex-1 min-h-[72px] resize-none text-sm"
                            placeholder="e.g. Headache for 3 days, mild nausea, sensitivity to light..."
                            value={symptomText}
                            onChange={(e) => setSymptomText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), analyzeSymptoms())}
                        />
                        <button
                            className="btn-primary self-end px-4 py-2"
                            disabled={!symptomText.trim() || symptomLoading}
                            onClick={analyzeSymptoms}
                        >
                            {symptomLoading ? "..." : "Analyze"}
                        </button>
                    </div>
                </div>
            )}
            {!showSymptomCard && (
                <button onClick={() => setShowSymptomCard(true)} className="text-sm text-[var(--color-primary-500)] mb-2">+ Show quick symptom check</button>
            )}

            <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 mb-4">
                {messages.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                        <div className="text-5xl mb-4">🤖</div>
                        <p className="font-medium text-lg">Hello! I&apos;m HealthLens AI</p>
                        <p className="text-sm mt-2 max-w-md mx-auto">Use the symptom check above, or ask me about symptoms, disease risk, nutrition, or general health.</p>
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
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === "user"
                            ? "bg-[var(--color-primary-500)] text-white rounded-br-md whitespace-pre-wrap"
                            : "bg-[var(--bg)] rounded-bl-md border border-[var(--border)] shadow-sm"
                            }`}>
                            {m.role === "assistant" ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--bg-secondary)]">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {m.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                m.content
                            )}
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
