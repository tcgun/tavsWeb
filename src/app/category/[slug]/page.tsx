"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { Loader2, Hash } from "lucide-react";

export default function CategoryPage() {
    const params = useParams();
    // Decode URI component to handle Turkish characters correctly if needed, 
    // though usually slugs are URL safe. Let's assume slug is the category name lowercased or similar.
    // For better matching, we might need to capitalize it back or store a slug field.
    // In Sidebar we used: href={`/category/${cat.toLowerCase()}`}
    // In Post creation we stored: category (e.g. "Kitap")
    // So we need to handle case insensitivity or mapping.
    // Firestore queries are case sensitive.
    // A simple mapping for MVP:

    const slug = decodeURIComponent(params.slug as string);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    // This is a bit naive for "dizi/film" -> "Dizi/film" but let's try to match exactly what we send.
    // Sidebar sends: "dizi/film", "kitap", "müzik", "mekan", "teknoloji"
    // DB stores: "Dizi/Film", "Kitap", "Müzik", "Mekan", "Teknoloji"

    const categoryMap: { [key: string]: string } = {
        "dizi/film": "Dizi/Film",
        "kitap": "Kitap",
        "müzik": "Müzik",
        "mekan": "Mekan",
        "teknoloji": "Teknoloji"
    };

    const categoryName = categoryMap[slug] || capitalize(slug);

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const q = query(
            collection(db, "posts"),
            where("category", "==", categoryName),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
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
                                <p className="text-[var(--color-muted)]">
                                    İlk tavsiyeyi sen paylaşabilirsin!
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
