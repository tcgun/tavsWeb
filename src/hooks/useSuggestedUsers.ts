import { useState, useEffect } from "react";
import { collection, query, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { User } from "@/lib/types";

export function useSuggestedUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            try {
                let currentUsername = "";

                // 1. Get current user's username if logged in
                if (currentUser) {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        currentUsername = userDoc.data().username;
                    }
                }

                const usersRef = collection(db, "users");
                // Fetch more users to allow for client-side filtering
                const q = query(usersRef, limit(20));

                const snapshot = await getDocs(q);

                const uniqueUsernames = new Set<string>();
                const fetchedUsers: User[] = [];
                const currentUserId = currentUser?.uid;

                // Add current username to set to ensure we don't show it
                if (currentUsername) {
                    uniqueUsernames.add(currentUsername);
                }

                snapshot.forEach((doc) => {
                    const userData = doc.data() as User;
                    const userUid = userData.uid || doc.id;
                    const username = userData.username;

                    // Skip if no username
                    if (!username) return;

                    // 1. Filter out current user by UID
                    if (currentUserId && userUid === currentUserId) {
                        return;
                    }

                    // 2. Filter out current user by Username (if we found it)
                    if (currentUsername && username === currentUsername) {
                        return;
                    }

                    // 3. Deduplicate by Username
                    if (!uniqueUsernames.has(username)) {
                        uniqueUsernames.add(username);
                        fetchedUsers.push({ ...userData, uid: userUid });
                    }
                });

                // Limit to 5 after filtering
                setUsers(fetchedUsers.slice(0, 5));
            } catch (error) {
                console.error("Error fetching suggested users:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { users, loading };
}
