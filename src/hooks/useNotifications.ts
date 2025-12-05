import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Notification } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [queryLimit, setQueryLimit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    const loadMore = () => {
        setQueryLimit(prev => prev + 20);
    };

    const markAllAsRead = async () => {
        if (!auth.currentUser) return;

        const batch = writeBatch(db);
        const unreadNotifications = notifications.filter(n => !n.read);

        unreadNotifications.forEach(n => {
            const ref = doc(db, "notifications", n.id);
            batch.update(ref, { read: true });
        });

        if (unreadNotifications.length > 0) {
            await batch.commit();
        }
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(queryLimit)
                );

                const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const fetchedNotifications: Notification[] = [];
                    snapshot.forEach((doc) => {
                        fetchedNotifications.push({ id: doc.id, ...doc.data() } as Notification);
                    });

                    setNotifications(fetchedNotifications);
                    setHasMore(fetchedNotifications.length >= queryLimit);
                    setLoading(false);
                });

                return () => unsubscribeSnapshot();
            } else {
                setNotifications([]);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, [queryLimit]);

    return { notifications, loading, markAllAsRead, loadMore, hasMore };
}
