import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any;
}

export interface Chat {
    id: string;
    participants: string[];
    participantNames: { [key: string]: string }; // Map userId to displayName
    lastMessage: string;
    lastMessageTime: any;
}

export function useChat() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // 1. Listen for user's chats
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "chats"),
                    where("participants", "array-contains", user.uid),
                    orderBy("lastMessageTime", "desc")
                );

                const unsubscribeChats = onSnapshot(q, (snapshot) => {
                    const fetchedChats: Chat[] = [];
                    snapshot.forEach((doc) => {
                        fetchedChats.push({ id: doc.id, ...doc.data() } as Chat);
                    });
                    setChats(fetchedChats);
                    setLoadingChats(false);
                });

                return () => unsubscribeChats();
            } else {
                setChats([]);
                setLoadingChats(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. Listen for messages in active chat
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        setLoadingMessages(true);
        const q = query(
            collection(db, "chats", activeChat.id, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const fetchedMessages: Message[] = [];
            snapshot.forEach((doc) => {
                fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(fetchedMessages);
            setLoadingMessages(false);
        });

        return () => unsubscribeMessages();
    }, [activeChat]);

    // 3. Send Message Function
    const sendMessage = async (text: string) => {
        if (!auth.currentUser || !activeChat || !text.trim()) return;

        try {
            // Add message to subcollection
            await addDoc(collection(db, "chats", activeChat.id, "messages"), {
                text: text,
                senderId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            // Update chat summary
            await updateDoc(doc(db, "chats", activeChat.id), {
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // 4. Create or Get Chat (Helper)
    const startChat = async (targetUserId: string, targetUserName: string) => {
        if (!auth.currentUser) return;

        // Check if chat already exists (simplified check)
        // In a real app, you might query for existing chat with these 2 participants
        // For now, we'll just create a new one if not found in local list (which is not perfect but works for simple cases)

        const existingChat = chats.find(c => c.participants.includes(targetUserId));
        if (existingChat) {
            setActiveChat(existingChat);
            return;
        }

        try {
            const newChatData = {
                participants: [auth.currentUser.uid, targetUserId],
                participantNames: {
                    [auth.currentUser.uid]: auth.currentUser.displayName || "Ben",
                    [targetUserId]: targetUserName
                },
                lastMessage: "",
                lastMessageTime: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "chats"), newChatData);
            setActiveChat({ id: docRef.id, ...newChatData } as Chat);
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    return {
        chats,
        activeChat,
        setActiveChat,
        messages,
        loadingChats,
        loadingMessages,
        sendMessage,
        startChat
    };
}
