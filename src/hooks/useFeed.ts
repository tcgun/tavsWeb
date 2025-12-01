import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

const POSTS_PER_PAGE = 10;

export function useFeed() {
    const [user, setUser] = useState<any>(null);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 1. Listen for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch following IDs (to exclude them)
    useEffect(() => {
        if (!user) {
            setFollowingIds([]);
            return;
        }

        const followingRef = collection(db, "users", user.uid, "following");
        const unsubscribe = onSnapshot(followingRef, (snap) => {
            const ids = snap.docs.map(d => d.id);
            setFollowingIds(ids);
        });

        return () => unsubscribe();
    }, [user]);

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

            // Fetch more posts than needed to account for client-side filtering
            // We fetch 3x the page size to have a buffer
            const FETCH_LIMIT = POSTS_PER_PAGE * 3;

            let q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(FETCH_LIMIT)
            );

            if (!isInitial && lastVisibleRef.current) {
                q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisibleRef.current),
                    limit(FETCH_LIMIT)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                if (isInitial) setPosts([]);
            } else {
                let fetchedPosts: Post[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Post));

                // Filter out followed users and self
                if (user) {
                    const excludedIds = new Set([user.uid, ...followingIds]);
                    console.log(`DEBUG: Filtering with ${excludedIds.size} IDs. Following:`, followingIds);

                    fetchedPosts = fetchedPosts.filter(post => {
                        const isExcluded = excludedIds.has(post.authorId);
                        if (!isExcluded) {
                            // Check why it wasn't excluded if user thinks it should be
                            const match = followingIds.find(id => id == post.authorId); // loose check
                            const strictMatch = followingIds.find(id => id === post.authorId); // strict check

                            if (match || strictMatch) {
                                console.error(`DEBUG: CRITICAL! ID ${post.authorId} found in list but Set.has failed? Match: ${match}, Strict: ${strictMatch}`);
                            } else {
                                // Check for partial matches or whitespace
                                const trimmedMatch = followingIds.find(id => id.trim() === post.authorId.trim());
                                if (trimmedMatch) {
                                    console.warn(`DEBUG: Whitespace mismatch! List: '${trimmedMatch}' vs Post: '${post.authorId}'`);
                                }
                            }
                            console.log(`DEBUG: Explore KEEPING ${post.authorName} (ID: '${post.authorId}', Len: ${post.authorId.length})`);
                        }
                        return !isExcluded;
                    });
                }

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

                // If we fetched less than limit, we are probably at the end
                if (snapshot.docs.length < FETCH_LIMIT) {
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
    }, [user, followingIds]);

    useEffect(() => {
        // Wait for user and followingIds to be ready (or user to be null)
        // We add a small delay or check if we are ready to avoid double fetch
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
