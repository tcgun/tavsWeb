import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";

const POSTS_PER_PAGE = 5;

export function useFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            let q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(POSTS_PER_PAGE)
            );

            if (!isInitial && lastVisible) {
                q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    limit(POSTS_PER_PAGE)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                if (isInitial) setPosts([]);
            } else {
                const fetchedPosts: Post[] = [];
                snapshot.forEach((doc) => {
                    fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
                });

                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

                if (isInitial) {
                    setPosts(fetchedPosts);
                } else {
                    setPosts(prev => [...prev, ...fetchedPosts]);
                }

                if (snapshot.docs.length < POSTS_PER_PAGE) {
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Tavsiyeler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPosts(true);
    }, []);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPosts(false);
        }
    };

    return { posts, loading, loadingMore, error, hasMore, loadMore };
}
