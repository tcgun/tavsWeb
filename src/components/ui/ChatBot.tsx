"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Merhaba! Ben TavsiyeBot. 👋 Sana nasıl yardımcı olabilirim? Film, kitap veya mekan önerisi ister misin?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (data.response) {
                setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.error || "Üzgünüm, şu an cevap veremiyorum. Lütfen tekrar dene." }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Bir bağlantı hatası oluştu." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${isOpen
                    ? "bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)]"
                    : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white"
                    }`}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-36 right-4 lg:bottom-24 lg:right-8 z-50 w-[90vw] lg:w-[400px] h-[500px] max-h-[60vh] bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="p-4 bg-[var(--color-primary)]/10 border-b border-[var(--color-border)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--color-text)]">TavsiyeBot</h3>
                            <p className="text-xs text-[var(--color-muted)]">Yapay Zeka Asistanı</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user"
                                        ? "bg-[var(--color-primary)] text-white rounded-br-none"
                                        : "bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-none"
                                        }`}
                                >
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                                    <div className="w-2 h-2 bg-[var(--color-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-[var(--color-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-[var(--color-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card)]">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Bir şeyler sor..."
                                className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
