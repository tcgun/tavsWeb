"use client";

import { useOverlayChat } from "@/context/OverlayChatContext";
import { X, Minus, Send, Maximize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendNotification } from "@/lib/notifications";
import ReactMarkdown from "react-markdown";

export default function ChatOverlay() {
    const { openChats, closeChat, minimizeChat, maximizeChat } = useOverlayChat();

    return (
        <div className="fixed bottom-0 right-20 z-50 flex gap-4 items-end pointer-events-none">
            {openChats.map((chat) => (
                <div key={chat.id} className="pointer-events-auto">
                    <MiniChatWindow
                        chat={chat}
                        onClose={() => closeChat(chat.id)}
                        onMinimize={() => minimizeChat(chat.id)}
                        onMaximize={() => maximizeChat(chat.id)}
                    />
                </div>
            ))}
        </div>
    );
}

function MiniChatWindow({ chat, onClose, onMinimize, onMaximize }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    const otherUserId = chat.participants.find((id: string) => id !== auth.currentUser?.uid);
    const otherUserName = chat.participantNames[otherUserId] || "Kullanıcı";

    useEffect(() => {
        if (chat.minimized) return;

        const q = query(
            collection(db, "chats", chat.id, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoading(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsubscribe();
    }, [chat.id, chat.minimized]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !auth.currentUser) return;

        const text = input.trim();
        setInput("");

        try {
            await addDoc(collection(db, "chats", chat.id, "messages"), {
                text: text,
                senderId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "chats", chat.id), {
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            });

            if (otherUserId) {
                await sendNotification(
                    otherUserId,
                    auth.currentUser.uid,
                    auth.currentUser.displayName || "Kullanıcı",
                    "message",
                    chat.id
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (chat.minimized) {
        return (
            <div
                className="w-48 bg-[var(--color-card)] border border-[var(--color-border)] rounded-t-lg shadow-lg cursor-pointer hover:bg-[var(--color-background)] transition-colors"
                onClick={onMaximize}
            >
                <div className="p-3 flex items-center justify-between">
                    <span className="font-bold text-sm truncate text-[var(--color-text)]">{otherUserName}</span>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 h-96 bg-[var(--color-card)] border border-[var(--color-border)] rounded-t-lg shadow-xl flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            {/* Header */}
            <div className="p-3 bg-[var(--color-primary)] text-white rounded-t-lg flex items-center justify-between cursor-pointer" onClick={onMinimize}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-bold text-sm truncate">{otherUserName}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="p-1 hover:bg-white/20 rounded">
                        <Minus className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-white/20 rounded">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[var(--color-background)]">
                {messages.map((msg) => {
                    const isMe = msg.senderId === auth.currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe
                                    ? "bg-[var(--color-primary)] text-white rounded-br-none"
                                    : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-none"
                                }`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Mesaj yaz..."
                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-full px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-1.5 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
