"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { User } from "@/lib/types";
import { useUserPosts } from "@/hooks/useUserPosts";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { user: currentUser } = useAuth();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const { posts, loading: loadingPosts } = useUserPosts(userId);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;

            try {
                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    setProfileUser({
                        ...userData,
                        uid: userDoc.id,
                        stats: userData.stats || { followers: 0, following: 0 }
                    });
                } else {
                    // Handle user not found
                    setProfileUser(null);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUser();
    }, [userId]);

    if (loadingUser) {
        return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text)]">Yükleniyor...</div>;
    }

    if (!profileUser) {
        return (
            <div className="min-h-screen bg-[var(--color-background)]">
                <Header />
                <div className="container mx-auto px-4 pt-6 text-center text-[var(--color-text)]">
                    Kullanıcı bulunamadı.
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
                        <ProfileHeader user={profileUser} isOwnProfile={currentUser?.uid === userId} />

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-[var(--color-text)] mb-4">Paylaşımlar</h3>
                            {loadingPosts ? (
                                <p className="text-[var(--color-muted)]">Yükleniyor...</p>
                            ) : posts.length > 0 ? (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <RecommendationCard key={post.id} post={post} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--color-muted)]">Bu kullanıcı henüz hiç paylaşım yapmamış.</p>
                            )}
                        </div>
                    </main>

                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
