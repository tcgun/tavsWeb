"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Post } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import Link from "next/link";
import { Loader2, User as UserIcon } from "lucide-react";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q");
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        if (!q) return;

        const fetchResults = async () => {
            setLoading(true);
            const searchTerm = q.toLowerCase();

            try {
                // Fetch Users
                // Note: Firestore doesn't support full-text search natively.
                // For a real app, use Algolia or similar.
                // Here we fetch all (or limited) and filter client-side for demo purposes.
                const usersRef = collection(db, "users");
                const usersSnapshot = await getDocs(usersRef);
                const filteredUsers: User[] = [];
                usersSnapshot.forEach((doc) => {
                    const userData = doc.data() as User;
                    if (
                        userData.username.toLowerCase().includes(searchTerm) ||
                        (userData.displayName && userData.displayName.toLowerCase().includes(searchTerm))
                    ) {
                        filteredUsers.push(userData);
                    }
                });
                setUsers(filteredUsers);

                // Fetch Posts
                const postsRef = collection(db, "posts");
                const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
                const postsSnapshot = await getDocs(postsQuery);
                const filteredPosts: Post[] = [];
                postsSnapshot.forEach((doc) => {
                    const postData = { id: doc.id, ...doc.data() } as Post;
                    if (
                        postData.title.toLowerCase().includes(searchTerm) ||
                        postData.detail.toLowerCase().includes(searchTerm) ||
                        postData.category.toLowerCase().includes(searchTerm)
                    ) {
                        filteredPosts.push(postData);
                    }
                });
                setPosts(filteredPosts);

            } catch (error) {
                console.error("Error searching:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [q]);

    if (!q) {
        return (
            <div className="min-h-screen bg-[var(--color-background)]">
                <Header />
                <div className="container mx-auto px-4 pt-6 flex justify-center text-[var(--color-muted)]">
                    Bir arama terimi girin.
                </div>
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
                        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
                            "{q}" için arama sonuçları
                        </h1>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Users Section */}
                                {users.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Kullanıcılar</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {users.map((user) => (
                                                <Link href={`/profile/${user.uid}`} key={user.uid}>
                                                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-3 hover:bg-[var(--color-background)] transition-colors">
                                                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold overflow-hidden">
                                                            {user.photoURL ? (
                                                                <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                user.displayName?.[0] || "?"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[var(--color-text)]">{user.displayName || user.username}</h4>
                                                            <p className="text-sm text-[var(--color-muted)]">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Posts Section */}
                                <section>
                                    <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                                        {posts.length > 0 ? "Tavsiyeler" : users.length === 0 ? "Sonuç Bulunamadı" : ""}
                                    </h2>
                                    {posts.length > 0 ? (
                                        <div className="space-y-4">
                                            {posts.map((post) => (
                                                <RecommendationCard key={post.id} post={post} />
                                            ))}
                                        </div>
                                    ) : (
                                        users.length === 0 && (
                                            <p className="text-[var(--color-muted)]">Aradığınız kriterlere uygun içerik bulunamadı.</p>
                                        )
                                    )}
                                </section>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
