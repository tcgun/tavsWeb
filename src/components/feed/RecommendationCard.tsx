"use client";

import { Heart, MessageCircle, Bookmark, Share2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Post } from "@/lib/types";
import { useState, useEffect } from "react";
import { doc, updateDoc, increment, setDoc, deleteDoc, serverTimestamp, writeBatch, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendNotification } from "@/lib/notifications";
import { useRouter } from "next/navigation";

interface RecommendationCardProps {
    post: Post;
    isDetailView?: boolean;
}

export default function RecommendationCard({ post, isDetailView = false }: RecommendationCardProps) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [savesCount, setSavesCount] = useState(post.savesCount);

    useEffect(() => {
        if (!auth.currentUser) return; // FIX: Don't check if not logged in

        const checkStatus = async () => {
            try {
                const userLikeRef = doc(db, "users", auth.currentUser!.uid, "likes", post.id);
                const userSaveRef = doc(db, "users", auth.currentUser!.uid, "saved_posts", post.id);

                const [likeDoc, saveDoc] = await Promise.all([
                    getDoc(userLikeRef),
                    getDoc(userSaveRef)
                ]);

                setLiked(likeDoc.exists());
                setSaved(saveDoc.exists());
            } catch (error) {
                console.error("Error checking status:", error);
            }
        };

        checkStatus();
    }, [post.id]);

    const handleLike = async () => {
        if (!auth.currentUser) return;

        const postRef = doc(db, "posts", post.id);
        const userLikeRef = doc(db, "users", auth.currentUser.uid, "likes", post.id);
        const newLikedState = !liked;

        setLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            const batch = writeBatch(db);

            batch.update(postRef, {
                likesCount: increment(newLikedState ? 1 : -1)
            });

            if (newLikedState) {
                batch.set(userLikeRef, {
                    postId: post.id,
                    likedAt: serverTimestamp()
                });
            } else {
                batch.delete(userLikeRef);
            }

            await batch.commit();

            if (newLikedState) {
                await sendNotification(
                    post.authorId,
                    auth.currentUser.uid,
                    auth.currentUser.displayName || "Bir kullanıcı",
                    "like",
                    post.id
                );
            }
        } catch (error) {
            console.error("Error updating like:", error);
            setLiked(!newLikedState);
            setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleSave = async () => {
        if (!auth.currentUser) return;

        const postRef = doc(db, "posts", post.id);
        const userSavedPostRef = doc(db, "users", auth.currentUser.uid, "saved_posts", post.id);
        const newSavedState = !saved;

        setSaved(newSavedState);
        setSavesCount(prev => newSavedState ? prev + 1 : prev - 1);

        try {
            const batch = writeBatch(db);

            batch.update(postRef, {
                savesCount: increment(newSavedState ? 1 : -1)
            });

            if (newSavedState) {
                batch.set(userSavedPostRef, {
                    postId: post.id,
                    savedAt: serverTimestamp()
                });
            } else {
                batch.delete(userSavedPostRef);
            }

            await batch.commit();
        } catch (error) {
            console.error("Error updating save:", error);
            setSaved(!newSavedState);
            setSavesCount(prev => newSavedState ? prev - 1 : prev + 1);
        }
    };

    const router = useRouter();

    const handleDelete = async () => {
        if (!window.confirm("Bu tavsiyeyi silmek istediğinize emin misiniz?")) return;

        try {
            await deleteDoc(doc(db, "posts", post.id));
            if (isDetailView) {
                router.push("/");
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Silme işlemi sırasında bir hata oluştu.");
        }
    };

    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 mb-4 relative group">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                    {(post.authorName && post.authorName[0]) || "?"}
                </div>
                <div>
                    <h4 className="font-semibold text-[var(--color-text)]">{post.authorName || "İsimsiz Kullanıcı"}</h4>
                    <p className="text-xs text-[var(--color-muted)]">
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs bg-[var(--color-background)] px-2 py-1 rounded-full text-[var(--color-primary)] border border-[var(--color-border)]">
                        {post.category}
                    </span>
                    {auth.currentUser?.uid === post.authorId && (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-[var(--color-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Tavsiyeyi Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {isDetailView ? (
                <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">{post.title}</h3>
            ) : (
                <Link href={`/post/${post.id}`}>
                    <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2 hover:underline cursor-pointer">{post.title}</h3>
                </Link>
            )}

            <p className={`text-[var(--color-text)] mb-4 text-sm leading-relaxed ${!isDetailView && "line-clamp-3"}`}>
                {post.detail}
            </p>

            {post.imageUrl && (
                <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-colors ${liked ? "text-red-500" : "text-[var(--color-muted)] hover:text-red-500"}`}
                >
                    <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                    <span className="text-sm">{likesCount}</span>
                </button>
                <Link href={`/post/${post.id}`}>
                    <button className="flex items-center gap-2 text-[var(--color-muted)] hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{post.commentsCount}</span>
                    </button>
                </Link>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 transition-colors ${saved ? "text-yellow-500" : "text-[var(--color-muted)] hover:text-yellow-500"}`}
                >
                    <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
                    <span className="text-sm">{savesCount}</span>
                </button>
                <button className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
                    <Share2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
