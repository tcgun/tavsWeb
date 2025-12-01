"use client";

import { Send, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Chat, Message } from "@/hooks/useChat";
import { auth } from "@/lib/firebase";

interface ChatWindowProps {
    chat: Chat | null;
    messages: Message[];
    onSendMessage: (text: string) => void;
    loading: boolean;
    onBack?: () => void;
}

export default function ChatWindow({ chat, messages, onSendMessage, loading, onBack }: ChatWindowProps) {
    const [newMessage, setNewMessage] = useState("");
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        onSendMessage(newMessage);
        setNewMessage("");
    };

    if (!chat) {
        return (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl h-[calc(100vh-10rem)] flex items-center justify-center text-[var(--color-muted)]">
                Bir sohbet seçin veya yeni bir sohbet başlatın.
            </div>
        );
    }

    const otherUserId = chat.participants.find(id => id !== auth.currentUser?.uid);
    const otherUserName = otherUserId ? chat.participantNames[otherUserId] : "Kullanıcı";

    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl h-[calc(100vh-10rem)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-1 -ml-2 text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                )}
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                    {otherUserName[0]}
                </div>
                <div>
                    <h3 className="font-bold text-[var(--color-text)]">{otherUserName}</h3>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-[var(--color-muted)]">Yükleniyor...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-[var(--color-muted)]">Henüz mesaj yok. İlk mesajı gönderin!</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === auth.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                    ? "bg-[var(--color-primary)] text-white rounded-br-none"
                                    : "bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-none"
                                    }`}>
                                    <p>{msg.text}</p>
                                    <span className={`text-[10px] block mt-1 ${isMe ? "text-white/70" : "text-[var(--color-muted)]"}`}>
                                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}

            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border)] flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Bir mesaj yazın..."
                    className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-[var(--color-primary)] text-white rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
