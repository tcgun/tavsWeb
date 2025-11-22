import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Notification } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );

                const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const fetchedNotifications: Notification[] = [];
                    snapshot.forEach((doc) => {
                        fetchedNotifications.push({ id: doc.id, ...doc.data() } as Notification);
                    });
                    setNotifications(fetchedNotifications);
                    setLoading(false);
                });

                return () => unsubscribeSnapshot();
            } else {
                setNotifications([]);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    return { notifications, loading };
}
