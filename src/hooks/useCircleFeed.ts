import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

const POSTS_PER_PAGE = 10;

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

            // Exclude own ID to see only followed users' posts
            const allIds = [...ids];
            console.log("DEBUG: Following IDs:", allIds);
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

    // 3. Fetch posts with optimized query (Chunked)
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

            // Firestore 'in' limit is 30
            const CHUNK_SIZE = 30;
            const chunks = [];
            for (let i = 0; i < followingIds.length; i += CHUNK_SIZE) {
                chunks.push(followingIds.slice(i, i + CHUNK_SIZE));
            }

            const promises = chunks.map(async (chunk, index) => {
                try {
                    console.log(`DEBUG: Querying chunk ${index} with ${chunk.length} users:`, chunk);
                    let q = query(
                        collection(db, "posts"),
                        where("authorId", "in", chunk),
                        orderBy("createdAt", "desc"),
                        limit(POSTS_PER_PAGE)
                    );

                    if (!isInitial && lastVisibleRef.current) {
                        const lastData = lastVisibleRef.current.data();
                        if (lastData && lastData.createdAt) {
                            q = query(
                                collection(db, "posts"),
                                where("authorId", "in", chunk),
                                orderBy("createdAt", "desc"),
                                startAfter(lastData.createdAt),
                                limit(POSTS_PER_PAGE)
                            );
                        }
                    }
                    const snap = await getDocs(q);
                    console.log(`DEBUG: Chunk ${index} returned ${snap.size} docs`);
                    snap.docs.forEach(d => {
                        const data = d.data();
                        console.log(`DEBUG: Found post ${d.id} from ${data.authorName} (${data.authorId}). CreatedAt: ${data.createdAt}`);
                    });
                    return snap.docs;
                } catch (err) {
                    console.error(`DEBUG: Error fetching chunk ${index}:`, err);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            const allDocs = results.flat();

            // Sort by createdAt desc
            allDocs.sort((a, b) => {
                const getData = (doc: any) => {
                    const data = doc.data();
                    if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
                        return data.createdAt.toMillis();
                    }
                    if (data.createdAt instanceof Date) {
                        return data.createdAt.getTime();
                    }
                    // Fallback for missing or invalid date (place at bottom)
                    return 0;
                };

                const dateA = getData(a);
                const dateB = getData(b);
                return dateB - dateA;
            });

            // Take top POSTS_PER_PAGE
            const topDocs = allDocs.slice(0, POSTS_PER_PAGE);

            if (topDocs.length === 0) {
                setHasMore(false);
                if (isInitial) setPosts([]);
            } else {
                const fetchedPosts: Post[] = topDocs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Post));

                lastVisibleRef.current = topDocs[topDocs.length - 1];

                if (isInitial) {
                    setPosts(fetchedPosts);
                } else {
                    setPosts(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newPosts = fetchedPosts.filter(p => !existingIds.has(p.id));
                        return [...prev, ...newPosts];
                    });
                }

                if (topDocs.length < POSTS_PER_PAGE) {
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
