"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { useFeed } from "@/hooks/useFeed";
import { Loader2, Compass } from "lucide-react";
import Link from "next/link";

import { SkeletonCard } from "@/components/feed/SkeletonCard";

export default function ExplorePage() {
    const { posts, loading, loadingMore, error, hasMore, loadMore } = useFeed();

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto pb-20">
                        {/* Feed Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-[var(--color-text)]">Keşfet</h1>
                            <div className="flex gap-2">
                                <Link href="/" className="px-3 py-1 bg-[var(--color-card)] text-[var(--color-text)] text-sm rounded-full hover:bg-[var(--color-border)] transition-colors">
                                    Takip Ettiklerim
                                </Link>
                                <Link href="/explore" className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-full">
                                    Keşfet
                                </Link>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-6">
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">{error}</div>
                        ) : posts.length > 0 ? (
                            <div className="space-y-6">
                                {posts.map((post) => (
                                    <RecommendationCard key={post.id} post={post} />
                                ))}

                                {hasMore && (
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                                        >
                                            {loadingMore ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                "Daha Fazla Yükle"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
                                <Compass className="h-12 w-12 text-[var(--color-muted)] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Henüz hiç tavsiye yok</h3>
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
