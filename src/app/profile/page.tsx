"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "@/lib/types";
import { useUserPosts } from "@/hooks/useUserPosts";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const { posts, loading: loadingPosts } = useUserPosts(currentUser?.uid || null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch extended user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    setCurrentUser({
                        ...userData,
                        stats: userData.stats || { followers: 0, following: 0 }
                    });
                } else {
                    // Fallback if user doc doesn't exist (shouldn't happen with correct registration)
                    setCurrentUser({
                        uid: user.uid,
                        username: user.displayName || "user",
                        displayName: user.displayName || "User",
                        email: user.email || "",
                        photoURL: user.photoURL || undefined,
                        stats: { followers: 0, following: 0 },
                        createdAt: new Date().toISOString()
                    } as User);
                }
            } else {
                setCurrentUser(null);
            }
            setLoadingUser(false);
        });
        return () => unsubscribe();
    }, []);

    if (loadingUser) {
        return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text)]">Yükleniyor...</div>;
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[var(--color-background)]">
                <Header />
                <div className="container mx-auto px-4 pt-6 text-center text-[var(--color-text)]">
                    Lütfen profilinizi görmek için giriş yapın.
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto">
                        <ProfileHeader
                            user={currentUser}
                            isOwnProfile={true}
                            postCount={posts.length}
                        />

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-[var(--color-text)] mb-4">Paylaşımlar</h3>
                            {loadingPosts ? (
                                <p className="text-[var(--color-muted)]">Yükleniyor...</p>
                            ) : posts.length > 0 ? (
                                posts.map((post) => (
                                    <RecommendationCard key={post.id} post={post} />
                                ))
                            ) : (
                                <p className="text-[var(--color-muted)]">Henüz hiç paylaşım yapmadınız.</p>
                            )}
                        </div>
                    </main>

                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
