import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function sendNotification(
    receiverId: string,
    senderId: string,
    senderName: string,
    type: 'like' | 'comment' | 'follow' | 'message',
    sourceId: string // Post ID or User ID
) {
    if (receiverId === senderId) return; // Don't notify self

    try {
        await addDoc(collection(db, "notifications"), {
            userId: receiverId,
            senderId: senderId,
            sourceName: senderName, // Store name to avoid extra fetch
            type: type,
            sourceId: sourceId,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}
