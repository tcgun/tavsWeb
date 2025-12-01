"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChat } from "@/hooks/useChat";
import { auth, db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Plus, X, Search } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";

export default function MessagesPage() {
    const { chats, activeChat, setActiveChat, messages, loadingChats, loadingMessages, sendMessage, startChat } = useChat();
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchParams = useSearchParams();
    const targetUserId = searchParams.get("userId");
    const targetUserName = searchParams.get("userName");

    // Auto-open chat from URL
    useEffect(() => {
        const initChat = async () => {
            if (targetUserId && !loadingChats) {
                // Prevent loop if already active
                if (activeChat?.participants.includes(targetUserId)) return;

                const existingChat = chats.find(c => c.participants.includes(targetUserId));
                if (existingChat) {
                    setActiveChat(existingChat);
                } else if (targetUserName) {
                    // Start new chat if user name is provided
                    await startChat(targetUserId, targetUserName);
                }
            }
        };
        initChat();
    }, [targetUserId, targetUserName, loadingChats, chats, activeChat, startChat, setActiveChat]);

    // Debounced Search Effect
    useEffect(() => {
        let isActive = true;
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                if (isActive) {
                    setSearchResults([]);
                    setIsSearching(false);
                }
                return;
            }

            if (isActive) setIsSearching(true);
            try {
                const usersRef = collection(db, "users");
                const term = searchQuery.trim();

                // Search by username
                const qUsername = query(usersRef, where("username", ">=", term), where("username", "<=", term + '\uf8ff'));

                // Search by displayName
                const qDisplayName = query(usersRef, where("displayName", ">=", term), where("displayName", "<=", term + '\uf8ff'));

                const [usernameSnap, displayNameSnap] = await Promise.all([
                    getDocs(qUsername),
                    getDocs(qDisplayName)
                ]);

                if (!isActive) return;

                const usersMap = new Map();

                usernameSnap.forEach((doc) => {
                    if (doc.id !== auth.currentUser?.uid) {
                        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
                    }
                });

                displayNameSnap.forEach((doc) => {
                    if (doc.id !== auth.currentUser?.uid) {
                        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
                    }
                });

                const results = Array.from(usersMap.values());
                console.log("Search results:", results);

                if (isActive) {
                    setSearchResults(results);
                }
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                if (isActive) setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    const handleStartNewChat = async (userId: string, userName: string) => {
        await startChat(userId, userName);
        setIsNewChatModalOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Chat List Sidebar */}
                            <div className={`${activeChat ? 'hidden md:block' : 'block'} bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl h-[calc(100vh-10rem)] overflow-y-auto`}>
                                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                                    <h2 className="font-bold text-[var(--color-text)]">Mesajlar</h2>
                                    <button
                                        onClick={() => setIsNewChatModalOpen(true)}
                                        className="p-2 hover:bg-[var(--color-background)] rounded-full text-[var(--color-primary)] transition-colors"
                                        title="Yeni Mesaj"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
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
                                                            <p className="text-xs text-[var(--color-muted)] truncate">{chat.lastMessage || "Yeni Sohbet"}</p>
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
                            <div className={`${!activeChat ? 'hidden md:block' : 'block'} md:col-span-2`}>
                                <ChatWindow
                                    chat={activeChat}
                                    messages={messages}
                                    onSendMessage={sendMessage}
                                    loading={loadingMessages}
                                    onBack={() => setActiveChat(null)}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-[var(--color-text)]">Yeni Mesaj</h3>
                            <button
                                onClick={() => setIsNewChatModalOpen(false)}
                                className="p-1 hover:bg-[var(--color-background)] rounded-full text-[var(--color-muted)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4 relative">
                                <input
                                    type="text"
                                    placeholder="Kullanıcı adı veya İsim ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-muted)] h-4 w-4" />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {isSearching ? (
                                    <div className="text-center text-[var(--color-muted)] py-4">Aranıyor...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleStartNewChat(user.id, user.displayName || user.username)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-[var(--color-background)] rounded-lg transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                                                {(user.displayName && user.displayName[0]) || "?"}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[var(--color-text)]">{user.displayName || user.username}</h4>
                                                <p className="text-xs text-[var(--color-muted)]">@{user.username}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : searchQuery && (
                                    <div className="text-center text-[var(--color-muted)] py-4">Kullanıcı bulunamadı.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
