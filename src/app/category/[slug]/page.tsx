"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { Loader2, Hash } from "lucide-react";
import CreatePostModal from "@/components/ui/CreatePostModal";
import { useCategories } from "@/hooks/useCategories";

export default function CategoryPage() {
    const params = useParams();
    const { categories, loading: categoriesLoading } = useCategories();
    const slug = decodeURIComponent(params.slug as string);

    // Find the matching category name from the fetched categories
    // This ensures we query Firestore with the exact case-sensitive name (e.g. "Dizi/Film")
    const categoryName = useMemo(() => {
        // If categories are still loading, don't try to guess yet to avoid flickering
        if (categoriesLoading && categories.length === 0) return "";

        const found = categories.find(c => c.name.toLowerCase() === slug.toLowerCase());
        if (found) return found.name;

        // Fallback for legacy/hardcoded URLs if not in DB yet
        const categoryMap: { [key: string]: string } = {
            "dizi/film": "Dizi/Film",
            "kitap": "Kitap",
            "müzik": "Müzik",
            "mekan": "Mekan",
            "teknoloji": "Teknoloji"
        };

        // If we have categories but didn't find a match, try the map or format the slug
        // But if categories are empty (and not loading), it might be a network issue or empty DB, 
        // so we still try to format the slug to show something.
        return categoryMap[slug.toLowerCase()] || (slug.charAt(0).toUpperCase() + slug.slice(1));
    }, [categories, slug, categoriesLoading]);

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!categoryName) return;

        setLoading(true);

        // Generate variations to handle "Dizi/Film" vs "Dizi / Film" mismatch
        const variations = [categoryName];
        if (categoryName.includes("/")) {
            if (categoryName.includes(" / ")) {
                variations.push(categoryName.replace(" / ", "/"));
            } else {
                variations.push(categoryName.replace("/", " / "));
            }
        }

        const q = query(
            collection(db, "posts"),
            where("category", "in", variations),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedPosts.push({
                    id: doc.id,
                    ...data,
                    // Handle Firestore Timestamp or String
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
                } as Post);
            });
            setPosts(fetchedPosts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching category posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [categoryName]);

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto pb-20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
                                <Hash className="h-6 w-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text)]">{categoryName}</h1>
                                <p className="text-[var(--color-muted)]">Bu kategorideki tüm tavsiyeler</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="space-y-6">
                                {posts.map((post) => (
                                    <RecommendationCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
                                <Hash className="h-12 w-12 text-[var(--color-muted)] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Bu kategoride henüz içerik yok</h3>
                                <p className="text-[var(--color-muted)] mb-6">
                                    İlk tavsiyeyi sen paylaşabilirsin!
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                                >
                                    Tavsiye Paylaş
                                </button>
                            </div>
                        )}
                    </main>

                    <RightSidebar />
                </div>
            </div>

            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialCategory={categoryName}
            />
        </div>
    );
}
