"use client";

import RecommendationCard from "@/components/feed/RecommendationCard";
import { useCircleFeed } from "@/hooks/useCircleFeed";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { SkeletonCard } from "@/components/feed/SkeletonCard";

export default function Feed() {
    const { posts, loading, loadingMore, hasMore, loadMore, followingCount, user } = useCircleFeed();

    return (
        <>
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">Çemberim</h1>
                <div className="flex gap-2">
                    <Link href="/" className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-full">
                        Takip Ettiklerim
                    </Link>
                    <Link href="/explore" className="px-3 py-1 bg-[var(--color-card)] text-[var(--color-text)] text-sm rounded-full hover:bg-[var(--color-border)] transition-colors">
                        Keşfet
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : !user ? (
                <div className="text-center py-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
                    <Users className="h-12 w-12 text-[var(--color-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Hoş Geldiniz</h3>
                    <p className="text-[var(--color-muted)] mb-6">
                        Kendi güven çemberinizi oluşturmak için giriş yapın.
                    </p>
                    <Link href="/login" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-medium hover:bg-opacity-90">
                        Giriş Yap
                    </Link>
                </div>
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
                    <Users className="h-12 w-12 text-[var(--color-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
                        {followingCount === 0 ? "Henüz kimseyi takip etmiyorsunuz" : "Çemberinizde henüz paylaşım yok"}
                    </h3>
                    <p className="text-[var(--color-muted)] mb-6">
                        Yeni insanlar keşfetmek ve tavsiyeler görmek için Keşfet sayfasına göz atın.
                    </p>
                    <Link href="/explore" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-medium hover:bg-opacity-90">
                        Keşfet'e Git
                    </Link>
                </div>
            )}
        </>
    );
}
