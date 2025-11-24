"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Post } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { Loader2, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SavedPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<Post[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);

            try {
                // 1. Get IDs of saved posts
                const savedPostsRef = collection(db, "users", currentUser.uid, "saved_posts");
                const savedPostsSnap = await getDocs(savedPostsRef);

                const postIds = savedPostsSnap.docs.map(doc => doc.id);

                if (postIds.length === 0) {
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch actual post data
                // Note: Firestore doesn't support "where id in [...]" for large arrays efficiently or easily with document IDs in this structure sometimes.
                // Promise.all is a good solution for fetching specific documents by ID.
                const postsPromises = postIds.map(id => getDoc(doc(db, "posts", id)));
                const postsSnaps = await Promise.all(postsPromises);

                const fetchedPosts: Post[] = [];
                postsSnaps.forEach(snap => {
                    if (snap.exists()) {
                        fetchedPosts.push({ id: snap.id, ...snap.data() } as Post);
                    }
                });

                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching saved posts:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto pb-20">


                        {posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <RecommendationCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
                                <Bookmark className="h-12 w-12 text-[var(--color-muted)] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Henüz bir şey kaydetmediniz</h3>
                                <p className="text-[var(--color-muted)]">
                                    Beğendiğiniz tavsiyeleri daha sonra incelemek için kaydedebilirsiniz.
                                </p>
                            </div>
                        )}
                    </main>

                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
