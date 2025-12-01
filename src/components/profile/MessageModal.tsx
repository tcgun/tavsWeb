"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { User } from "@/lib/types";
import { useChat } from "@/hooks/useChat";

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export default function MessageModal({ isOpen, onClose, user }: MessageModalProps) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const { startChat, sendMessage } = useChat();

    if (!isOpen) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        try {
            const chat = await startChat(user.uid, user.displayName || "Kullanıcı");
            if (chat) {
                await sendMessage(message, chat);
                setMessage("");
                onClose();
                // Optional: Show toast
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--color-text)]">Mesaj Gönder: {user.displayName}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[var(--color-background)] rounded-full text-[var(--color-muted)]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSend} className="p-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="w-full h-32 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none mb-4"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={!message.trim() || sending}
                            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {sending ? "Gönderiliyor..." : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Gönder
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
