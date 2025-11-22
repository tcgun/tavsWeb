"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChat } from "@/hooks/useChat";
import { auth } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function MessagesPage() {
    const { chats, activeChat, setActiveChat, messages, loadingChats, loadingMessages, sendMessage } = useChat();

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Chat List Sidebar */}
                            <div className="hidden md:block bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl h-[calc(100vh-10rem)] overflow-y-auto">
                                <div className="p-4 border-b border-[var(--color-border)]">
                                    <h2 className="font-bold text-[var(--color-text)]">Mesajlar</h2>
                                </div>
                                <div className="divide-y divide-[var(--color-border)]">
                                    {loadingChats ? (
                                        <div className="p-4 text-center text-[var(--color-muted)]">Yükleniyor...</div>
                                    ) : chats.length === 0 ? (
                                        <div className="p-4 text-center text-[var(--color-muted)]">Henüz mesajınız yok.</div>
                                    ) : (
                                        chats.map((chat) => {
                                            const otherUserId = chat.participants.find(id => id !== auth.currentUser?.uid);
                                            const otherUserName = otherUserId ? chat.participantNames[otherUserId] : "Kullanıcı";

                                            return (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => setActiveChat(chat)}
                                                    className={`p-4 hover:bg-[var(--color-background)] cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-[var(--color-background)]' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                                                            {otherUserName[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm text-[var(--color-text)] truncate">{otherUserName}</h4>
                                                            <p className="text-xs text-[var(--color-muted)] truncate">{chat.lastMessage || "Resim/Dosya"}</p>
                                                        </div>
                                                        {chat.lastMessageTime && (
                                                            <span className="text-xs text-[var(--color-muted)]">
                                                                {formatDistanceToNow(chat.lastMessageTime.toDate(), { addSuffix: false, locale: tr })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div className="md:col-span-2">
                                <ChatWindow
                                    chat={activeChat}
                                    messages={messages}
                                    onSendMessage={sendMessage}
                                    loading={loadingMessages}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
