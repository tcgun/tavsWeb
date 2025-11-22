"use client";

import { User } from "@/lib/types";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, updateDoc, increment, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
}

export default function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(user.stats?.followers || 0);

    const router = useRouter();
    const { startChat } = useChat();

    useEffect(() => {
        if (!auth.currentUser || isOwnProfile) return;

        const checkFollowStatus = async () => {
            try {
                const followingRef = doc(db, "users", auth.currentUser!.uid, "following", user.uid);
                const docSnap = await getDoc(followingRef);
                setIsFollowing(docSnap.exists());
            } catch (error) {
                console.error("Error checking follow status:", error);
            }
        };

        checkFollowStatus();
    }, [user.uid, isOwnProfile]);

    const handleFollow = async () => {
        if (!auth.currentUser) return;

        const currentUserRef = doc(db, "users", auth.currentUser.uid);
        const targetUserRef = doc(db, "users", user.uid);

        // Subcollection refs
        const followingRef = doc(db, "users", auth.currentUser.uid, "following", user.uid);
        const followerRef = doc(db, "users", user.uid, "followers", auth.currentUser.uid);

        const newIsFollowing = !isFollowing;

        // Optimistic UI update
        setIsFollowing(newIsFollowing);
        setFollowersCount(prev => newIsFollowing ? prev + 1 : prev - 1);

        try {
            const batch = writeBatch(db);

            // 1. Update current user's following count
            batch.update(currentUserRef, {
                "stats.following": increment(newIsFollowing ? 1 : -1)
            });

            // 2. Update target user's followers count
            batch.update(targetUserRef, {
                "stats.followers": increment(newIsFollowing ? 1 : -1)
            });

            // 3. Manage relationships
            if (newIsFollowing) {
                batch.set(followingRef, {
                    uid: user.uid,
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || "",
                    username: user.username || "",
                    followedAt: serverTimestamp()
                });
                batch.set(followerRef, {
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.displayName || "",
                    photoURL: auth.currentUser.photoURL || "",
                    // username is not available in auth.currentUser directly usually, but we can skip or fetch. 
                    // For simplicity/speed, we might omit username or rely on what we have.
                    // Ideally we should fetch current user profile first, but let's use what we have.
                    followedAt: serverTimestamp()
                });
            } else {
                batch.delete(followingRef);
                batch.delete(followerRef);
            }

            await batch.commit();
        } catch (error) {
            console.error("Error updating follow status:", error);
            // Revert UI
            setIsFollowing(!newIsFollowing);
            setFollowersCount(prev => newIsFollowing ? prev - 1 : prev + 1);
        }
    };

    const handleMessage = async () => {
        if (!auth.currentUser) return;

        await startChat(user.uid, user.displayName || "Kullanıcı");
        router.push("/messages");
    };

    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                    ) : (
                        (user.displayName && user.displayName[0]) || "?"
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">{user.displayName || "İsimsiz Kullanıcı"}</h1>
                        {isOwnProfile && (
                            <Link href="/profile/edit">
                                <button className="text-[var(--color-muted)] hover:text-[var(--color-text)] p-1">
                                    <Settings className="h-5 w-5" />
                                </button>
                            </Link>
                        )}
                    </div>
                    <p className="text-[var(--color-muted)] mb-4">@{user.username}</p>
                    <p className="text-[var(--color-text)] mb-6 max-w-md">{user.bio || "Henüz bir biyografi eklenmemiş."}</p>

                    <div className="flex items-center justify-center md:justify-start gap-8">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-[var(--color-primary)]">{followersCount}</span>
                            <span className="text-sm text-[var(--color-muted)]">Takipçi</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-[var(--color-primary)]">{user.stats?.following || 0}</span>
                            <span className="text-sm text-[var(--color-muted)]">Takip</span>
                        </div>
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleFollow}
                            className={`px-6 py-2 rounded-full font-medium transition-colors ${isFollowing
                                ? "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)]"
                                : "bg-[var(--color-primary)] text-white hover:bg-opacity-90"
                                }`}
                        >
                            {isFollowing ? "Takibi Bırak" : "Takip Et"}
                        </button>
                        <button
                            onClick={handleMessage}
                            className="px-4 py-2 rounded-full font-medium bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
                        >
                            Mesaj Gönder
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
