import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post } from "@/lib/types";
import { onAuthStateChanged } from "firebase/auth";

export function useCircleFeed() {
    const [user, setUser] = useState<any>(null);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

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

        const unsubscribe = onSnapshot(followingRef, (snap) => {
            const ids = snap.docs.map(d => d.id);
            setFollowingIds(ids);
            // If no following, stop loading
            if (ids.length === 0) {
                setPosts([]);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching following:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Fetch and filter posts
    useEffect(() => {
        if (!user || followingIds.length === 0) return;

        setLoading(true);
        // Note: Fetching all posts and filtering client-side is an MVP solution.
        // For production with many posts, use 'where' with chunks or a dedicated feed collection.
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                const post = { id: doc.id, ...doc.data() } as Post;
                // Include posts from followed users OR own posts
                if (followingIds.includes(post.authorId) || post.authorId === user.uid) {
                    fetchedPosts.push(post);
                }
            });
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, followingIds]);

    // 4. Pagination Logic
    const [visibleCount, setVisibleCount] = useState(5);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadMore = () => {
        if (visibleCount < posts.length) {
            setLoadingMore(true);
            setTimeout(() => {
                setVisibleCount(prev => prev + 5);
                setLoadingMore(false);
            }, 500); // Fake delay for better UX
        }
    };

    const hasMore = visibleCount < posts.length;
    const visiblePosts = posts.slice(0, visibleCount);

    return { posts: visiblePosts, loading, loadingMore, hasMore, loadMore, followingCount: followingIds.length, user };
}
