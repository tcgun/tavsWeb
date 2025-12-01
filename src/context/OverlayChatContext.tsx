"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/lib/types";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

interface ChatWindowData {
    id: string; // Chat ID
    participants: string[];
    participantNames: { [key: string]: string };
    minimized: boolean;
}

interface OverlayChatContextType {
    openChats: ChatWindowData[];
    openChat: (targetUser: User) => Promise<void>;
    closeChat: (chatId: string) => void;
    minimizeChat: (chatId: string) => void;
    maximizeChat: (chatId: string) => void;
}

const OverlayChatContext = createContext<OverlayChatContextType | undefined>(undefined);

export function OverlayChatProvider({ children }: { children: ReactNode }) {
    const [openChats, setOpenChats] = useState<ChatWindowData[]>([]);

    const openChat = async (targetUser: User) => {
        if (!auth.currentUser) return;

        // 1. Check if chat is already open in overlay
        const existingOpenChat = openChats.find(c => c.participants.includes(targetUser.uid));
        if (existingOpenChat) {
            if (existingOpenChat.minimized) {
                maximizeChat(existingOpenChat.id);
            }
            return;
        }

        // 2. Check if chat exists in Firestore (we need the ID)
        let chatId = "";
        let chatData: any = null;

        try {
            const q = query(
                collection(db, "chats"),
                where("participants", "array-contains", auth.currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const foundDoc = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.participants.includes(targetUser.uid);
            });

            if (foundDoc) {
                chatId = foundDoc.id;
                chatData = foundDoc.data();
            } else {
                // Create new chat
                const newChatData = {
                    participants: [auth.currentUser.uid, targetUser.uid],
                    participantNames: {
                        [auth.currentUser.uid]: auth.currentUser.displayName || "Ben",
                        [targetUser.uid]: targetUser.displayName || "Kullanıcı"
                    },
                    lastMessage: "",
                    lastMessageTime: serverTimestamp()
                };
                const docRef = await addDoc(collection(db, "chats"), newChatData);
                chatId = docRef.id;
                chatData = newChatData;
            }

            // 3. Add to openChats
            // Limit to 3 open chats for UI space
            setOpenChats(prev => {
                const newState = [...prev];
                if (newState.length >= 3) {
                    newState.shift(); // Remove oldest
                }
                return [...newState, {
                    id: chatId,
                    participants: chatData.participants,
                    participantNames: chatData.participantNames,
                    minimized: false
                }];
            });

        } catch (error) {
            console.error("Error opening chat:", error);
        }
    };

    const closeChat = (chatId: string) => {
        setOpenChats(prev => prev.filter(c => c.id !== chatId));
    };

    const minimizeChat = (chatId: string) => {
        setOpenChats(prev => prev.map(c => c.id === chatId ? { ...c, minimized: true } : c));
    };

    const maximizeChat = (chatId: string) => {
        setOpenChats(prev => prev.map(c => c.id === chatId ? { ...c, minimized: false } : c));
    };

    return (
        <OverlayChatContext.Provider value={{ openChats, openChat, closeChat, minimizeChat, maximizeChat }}>
            {children}
        </OverlayChatContext.Provider>
    );
}

export function useOverlayChat() {
    const context = useContext(OverlayChatContext);
    if (context === undefined) {
        throw new Error("useOverlayChat must be used within a OverlayChatProvider");
    }
    return context;
}
