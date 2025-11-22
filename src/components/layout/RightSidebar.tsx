"use client";

import { useSuggestedUsers } from "@/hooks/useSuggestedUsers";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, increment, arrayUnion, arrayRemove, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { sendNotification } from "@/lib/notifications";

export default function RightSidebar() {
    const { users, loading } = useSuggestedUsers();

    if (loading) {
        return (
            <aside className="hidden xl:block w-80 sticky top-20 h-[calc(100vh-5rem)]">
                <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
                    <h3 className="font-bold text-[var(--color-text)] mb-4">Önerilen Kişiler</h3>
                    <p className="text-[var(--color-muted)] text-sm">Yükleniyor...</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden xl:block w-80 sticky top-20 h-[calc(100vh-5rem)]">
            <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
                <h3 className="font-bold text-[var(--color-text)] mb-4">Önerilen Kişiler</h3>
                <div className="space-y-4">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <UserItem key={user.uid} user={user} />
                        ))
                    ) : (
                        <p className="text-[var(--color-muted)] text-sm">Önerilecek kimse yok.</p>
                    )}
                </div>
            </div>
        </aside>
    );
}

function UserItem({ user }: { user: any }) {
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;

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
    }, [user.uid]);

    const handleFollow = async () => {
        if (!auth.currentUser) return;

        const currentUserRef = doc(db, "users", auth.currentUser.uid);
        const targetUserRef = doc(db, "users", user.uid);

        const followingRef = doc(db, "users", auth.currentUser.uid, "following", user.uid);
        const followerRef = doc(db, "users", user.uid, "followers", auth.currentUser.uid);

        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);

        try {
            const batch = writeBatch(db);

            batch.update(currentUserRef, {
                "stats.following": increment(newIsFollowing ? 1 : -1)
            });

            batch.update(targetUserRef, {
                "stats.followers": increment(newIsFollowing ? 1 : -1)
            });

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
            setIsFollowing(!newIsFollowing);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Link href={`/profile?uid=${user.uid}`} className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold overflow-hidden">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                        (user.displayName && user.displayName[0]) || "?"
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-[var(--color-text)] truncate">{user.displayName || "Kullanıcı"}</h4>
                    <p className="text-xs text-[var(--color-muted)] truncate">@{user.username}</p>
                </div>
            </Link>
            <button
                onClick={handleFollow}
                className={`text-xs font-medium hover:underline ${isFollowing ? "text-[var(--color-muted)]" : "text-[var(--color-primary)]"}`}
            >
                {isFollowing ? "Takip Ediliyor" : "Takip Et"}
            </button>
        </div>
    );
}
