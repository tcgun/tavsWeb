"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SimpleUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    username?: string;
}

interface UserListComponentProps {
    userId: string;
    type: "followers" | "following";
    title: string;
}

export default function UserListComponent({ userId, type, title }: UserListComponentProps) {
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!userId) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "users", userId, type));

                const querySnapshot = await getDocs(q);
                const fetchedUsers: SimpleUser[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedUsers.push({
                        uid: data.uid || doc.id,
                        displayName: data.displayName || "Kullanıcı",
                        photoURL: data.photoURL,
                        username: data.username
                    });
                });

                setUsers(fetchedUsers);
            } catch (error) {
                console.error(`Error fetching ${type}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [userId, type]);

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-[var(--color-card)] transition-colors text-[var(--color-text)]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-[var(--color-text)]">{title}</h1>
            </div>

            {/* List */}
            <div className="container max-w-2xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[var(--color-muted)]">Yükleniyor...</p>
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <Link
                                key={user.uid}
                                href={`/profile/${user.uid}`}
                                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-text)] overflow-hidden shrink-0 border border-[var(--color-border)]">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-lg">{(user.displayName && user.displayName[0]) || "?"}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[var(--color-text)] text-lg truncate group-hover:text-[var(--color-primary)] transition-colors">{user.displayName}</p>
                                    <p className="text-sm text-[var(--color-muted)] truncate">@{user.username || "kullanici"}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] border-dashed">
                        <p className="text-[var(--color-muted)] text-lg">Henüz kimse yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
