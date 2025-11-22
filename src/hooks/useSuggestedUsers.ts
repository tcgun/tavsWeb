import { useState, useEffect } from "react";
import { collection, query, limit, getDocs, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { User } from "@/lib/types";

export function useSuggestedUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                // Basit bir öneri mantığı: Son kayıt olan 5 kullanıcıyı getir
                // Gerçek uygulamada daha karmaşık bir algoritma olabilir (ilgi alanlarına göre vb.)
                const q = query(usersRef, limit(5));

                const snapshot = await getDocs(q);
                const fetchedUsers: User[] = [];

                const currentUserId = auth.currentUser?.uid;

                snapshot.forEach((doc) => {
                    const userData = doc.data() as User;
                    // Kendisini listede gösterme
                    if (userData.uid !== currentUserId) {
                        fetchedUsers.push(userData);
                    }
                });

                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching suggested users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, loading };
}
