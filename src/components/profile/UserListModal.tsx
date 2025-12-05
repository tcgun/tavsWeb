"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

interface SimpleUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    username?: string;
}

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: "followers" | "following";
    title: string;
}

export default function UserListModal({ isOpen, onClose, userId, type, title }: UserListModalProps) {
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Determine collection path: users/{userId}/{type}
                // type is 'followers' or 'following'
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
    }, [isOpen, userId, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-md h-[500px] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--color-text)] text-lg">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[var(--color-background)] rounded-full text-[var(--color-muted)] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[var(--color-muted)] text-sm">Yükleniyor...</p>
                        </div>
                    ) : users.length > 0 ? (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <Link
                                    key={user.uid}
                                    href={`/profile/${user.uid}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-background)] transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-text)] overflow-hidden shrink-0">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-sm">{(user.displayName && user.displayName[0]) || "?"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[var(--color-text)] truncate">{user.displayName}</p>
                                        <p className="text-xs text-[var(--color-muted)] truncate">@{user.username || "kullanici"}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <p className="text-[var(--color-muted)]">Henüz kimse yok.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
