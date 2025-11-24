import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";

const POSTS_PER_PAGE = 5;

export function useFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            if (isInitial) {
                setLoading(true);
                setError(null);
                lastVisibleRef.current = null;
            } else {
                setLoadingMore(true);
            }

            let q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(POSTS_PER_PAGE)
            );

            if (!isInitial && lastVisibleRef.current) {
                q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisibleRef.current),
                    limit(POSTS_PER_PAGE)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                if (isInitial) setPosts([]);
            } else {
                const fetchedPosts: Post[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Post));

                lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];

                if (isInitial) {
                    setPosts(fetchedPosts);
                } else {
                    setPosts(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newPosts = fetchedPosts.filter(p => !existingIds.has(p.id));
                        return [...prev, ...newPosts];
                    });
                }

                if (snapshot.docs.length < POSTS_PER_PAGE) {
                    setHasMore(false);
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error("Error fetching posts:", err);
            setError("Tavsiyeler yüklenirken bir hata oluştu.");
        } finally {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchPosts(true);
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchPosts]);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPosts(false);
        }
    };

    return { posts, loading, loadingMore, error, hasMore, loadMore };
}
