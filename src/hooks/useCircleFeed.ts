import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

const POSTS_PER_PAGE = 5;
const MAX_FOLLOWING_IN_QUERY = 10; // Firestore 'in' limit

export function useCircleFeed() {
    const [user, setUser] = useState<any>(null);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [followingCount, setFollowingCount] = useState(0);

    const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 1. Listen for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                setFollowingIds([]);
                setPosts([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch following IDs
    useEffect(() => {
        if (!user) return;

        const followingRef = collection(db, "users", user.uid, "following");

        // Using onSnapshot to keep following list real-time
        const unsubscribe = onSnapshot(followingRef, (snap) => {
            const ids = snap.docs.map(d => d.id);
            setFollowingCount(ids.length);

            // Include own ID to see own posts
            const allIds = [user.uid, ...ids];
            setFollowingIds(allIds);

            if (allIds.length === 0) {
                setPosts([]);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching following:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Fetch posts with optimized query
    const fetchPosts = useCallback(async (isInitial = false) => {
        if (!user || followingIds.length === 0) {
            if (isInitial) setLoading(false);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            if (isInitial) {
                setLoading(true);
                lastVisibleRef.current = null;
            } else {
                setLoadingMore(true);
            }

            // Firestore 'in' query supports max 10 values.
            // We take the first 10 IDs (including self).
            // TODO: Implement chunking or separate feed collection for >10 following
            const idsToQuery = followingIds.slice(0, MAX_FOLLOWING_IN_QUERY);

            let q = query(
                collection(db, "posts"),
                where("authorId", "in", idsToQuery),
                orderBy("createdAt", "desc"),
                limit(POSTS_PER_PAGE)
            );

            if (!isInitial && lastVisibleRef.current) {
                q = query(
                    collection(db, "posts"),
                    where("authorId", "in", idsToQuery),
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
                    // Filter out duplicates just in case
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
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            console.error("Error fetching posts:", error);
        } finally {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [user, followingIds]);

    // Initial fetch when followingIds changes
    useEffect(() => {
        if (user && followingIds.length > 0) {
            fetchPosts(true);
        } else if (user && followingIds.length === 0) {
            // If user has no following (and logic above handled it), ensure loading is false
            setLoading(false);
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [user, followingIds.length, fetchPosts]);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPosts(false);
        }
    };

    return {
        posts,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        followingCount,
        user
    };
}
