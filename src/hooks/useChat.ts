import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { sendNotification } from "@/lib/notifications";

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
                        const chatData = doc.data();
                        // Only include chats that have a last message (or if we want to show empty chats, handle it differently)
                        // User requested: "mesaj göndermesek bile kayıtlı kalıyor" -> implies they don't want to see it.
                        if (chatData.lastMessage && chatData.lastMessage.trim() !== "") {
                            fetchedChats.push({ id: doc.id, ...chatData } as Chat);
                        }
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
    // 3. Send Message Function
    const sendMessage = async (text: string, targetChat?: Chat) => {
        const chat = targetChat || activeChat;
        if (!auth.currentUser || !chat || !text.trim()) return;

        try {
            // Add message to subcollection
            await addDoc(collection(db, "chats", chat.id, "messages"), {
                text: text,
                senderId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            // Update chat summary
            await updateDoc(doc(db, "chats", chat.id), {
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            });
            // Send notification to other participants
            const otherParticipants = chat.participants.filter(id => id !== auth.currentUser!.uid);
            for (const participantId of otherParticipants) {
                await sendNotification(
                    participantId,
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

    // 4. Create or Get Chat (Helper)
    // 4. Create or Get Chat (Helper)
    const startChat = async (targetUserId: string, targetUserName: string) => {
        if (!auth.currentUser) return null;

        const existingChat = chats.find(c => c.participants.includes(targetUserId));
        if (existingChat) {
            setActiveChat(existingChat);
            return existingChat;
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
            const newChat = { id: docRef.id, ...newChatData } as Chat;
            setActiveChat(newChat);
            return newChat;
        } catch (error) {
            console.error("Error starting chat:", error);
            return null;
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
