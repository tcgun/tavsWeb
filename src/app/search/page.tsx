"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Post } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import Link from "next/link";
import { Loader2, User as UserIcon } from "lucide-react";

function SearchContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q");
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchTerm, setSearchTerm] = useState(q || "");

    useEffect(() => {
        if (!q) {
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            const searchTermLower = q.toLowerCase();

            try {
                // Fetch Users
                const usersRef = collection(db, "users");
                const usersSnapshot = await getDocs(usersRef);
                const filteredUsers: User[] = [];
                usersSnapshot.forEach((doc) => {
                    const userData = doc.data() as User;
                    if (
                        userData.username.toLowerCase().includes(searchTermLower) ||
                        (userData.displayName && userData.displayName.toLowerCase().includes(searchTermLower))
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
                        postData.title.toLowerCase().includes(searchTermLower) ||
                        postData.detail.toLowerCase().includes(searchTermLower) ||
                        postData.category.toLowerCase().includes(searchTermLower)
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="flex gap-6">
                <Sidebar />

                <main className="flex-1 max-w-2xl mx-auto pb-20">
                    {/* Search Input for Mobile/All */}
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ne aramak istersin?"
                                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-full py-3 pl-5 pr-12 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </button>
                        </div>
                    </form>

                    {!q ? (
                        <div className="text-center text-[var(--color-muted)] py-10">
                            {/* Empty state */}
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <Suspense fallback={
                <div className="container mx-auto px-4 pt-6 flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                </div>
            }>
                <SearchContent />
            </Suspense>
        </div>
    );
}
