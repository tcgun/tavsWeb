import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";

export function useUserPosts(userId: string | null) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "posts"),
            where("authorId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
            });
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { posts, loading };
}
