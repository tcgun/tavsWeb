"use client";

import { User } from "@/lib/types";
import Link from "next/link";
import { Settings, UserPlus, UserMinus, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, increment, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useOverlayChat } from "@/context/OverlayChatContext";

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    postCount: number;
}

export default function ProfileHeader({ user, isOwnProfile, postCount }: ProfileHeaderProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(user.stats?.followers || 0);

    const router = useRouter();

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

    const { openChat } = useOverlayChat();

    const handleMessage = async () => {
        if (!auth.currentUser) return;
        await openChat(user);
    };

    const handleSocialClick = (type: 'followers' | 'following') => {
        if (isOwnProfile) {
            router.push(`/profile/${user.uid}/${type}`);
        }
    };

    return (
        <div className="mb-0 pt-8 animate-in fade-in duration-500">
            {/* New Layout: Centered Container */}
            <div className="flex flex-col md:flex-row gap-8 md:items-center md:justify-between max-w-5xl mx-auto px-6">

                {/* LEFT: User Info & Actions */}
                <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        {/* Profile Picture */}
                        <div className="relative shrink-0">
                            <div className="w-28 h-28 rounded-full p-0.5 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] shadow-lg">
                                <div className="w-full h-full rounded-full bg-[var(--color-card)] p-1">
                                    <div className="w-full h-full rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-text)] text-4xl font-bold overflow-hidden">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                        ) : (
                                            (user.displayName && user.displayName[0]) || "?"
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Name & Username */}
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight truncate">
                                    {user.displayName || "İsimsiz Kullanıcı"}
                                </h1>
                                {isOwnProfile && (
                                    <Link href="/profile/edit" className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
                                        <Settings className="h-6 w-6" />
                                    </Link>
                                )}
                            </div>
                            <p className="text-[var(--color-muted)] font-medium text-lg">@{user.username || "kullanici"}</p>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-[var(--color-text)] text-lg leading-relaxed opacity-90 mb-6 max-w-lg">
                            {user.bio}
                        </p>
                    )}

                    {/* Actions */}
                    {!isOwnProfile && (
                        <div className="flex gap-4 w-full md:w-auto mt-2 mb-6 md:mb-0 justify-center md:justify-start">
                            <button
                                onClick={handleFollow}
                                className={`px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${isFollowing
                                    ? "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)]"
                                    : "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-md hover:shadow-lg active:scale-95"
                                    }`}
                            >
                                {isFollowing ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                {isFollowing ? "Takip" : "Takip Et"}
                            </button>
                            <button
                                onClick={handleMessage}
                                className="px-8 py-3 rounded-full font-semibold text-base bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)] transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Mesaj
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Stats */}
                <div className="flex gap-8 md:gap-12 justify-center md:justify-end shrink-0 md:pt-0">
                    {/* Recommendations */}
                    <div className="flex flex-col items-center cursor-default group p-2">
                        <span className="text-2xl md:text-3xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                            {postCount}
                        </span>
                        <span className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wide mt-1">Tavsiye</span>
                    </div>

                    {/* Followers */}
                    <div
                        onClick={() => handleSocialClick('followers')}
                        className={`flex flex-col items-center group p-2 ${isOwnProfile ? "cursor-pointer hover:bg-[var(--color-background)] rounded-xl transition-colors" : "cursor-default"}`}
                    >
                        <span className="text-2xl md:text-3xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                            {followersCount}
                        </span>
                        <span className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wide mt-1">Takipçi</span>
                    </div>

                    {/* Following */}
                    <div
                        onClick={() => handleSocialClick('following')}
                        className={`flex flex-col items-center group p-2 ${isOwnProfile ? "cursor-pointer hover:bg-[var(--color-background)] rounded-xl transition-colors" : "cursor-default"}`}
                    >
                        <span className="text-2xl md:text-3xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                            {user.stats?.following || 0}
                        </span>
                        <span className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wide mt-1">Takip</span>
                    </div>
                </div>

            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--color-border)] my-8 max-w-5xl mx-auto opacity-50"></div>
        </div>
    );
}
