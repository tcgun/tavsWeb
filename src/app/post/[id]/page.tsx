"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post, Comment } from "@/lib/types";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RecommendationCard from "@/components/feed/RecommendationCard";
import { Loader2, Send, ArrowLeft, Trash2 } from "lucide-react";
import { SkeletonCard } from "@/components/feed/SkeletonCard";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { sendNotification } from "@/lib/notifications";

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, "posts", postId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                } else {
                    console.error("Post not found");
                    // router.push("/"); // Optional: redirect if not found
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();

        // Listen for comments
        const q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments: Comment[] = [];
            snapshot.forEach((doc) => {
                fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
            });
            setComments(fetchedComments);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

        try {
            await deleteDoc(doc(db, "posts", postId, "comments", commentId));

            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
                commentsCount: increment(-1)
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !newComment.trim() || !post) return;

        setSubmitting(true);
        try {
            // Add comment to subcollection
            await addDoc(collection(db, "posts", postId, "comments"), {
                postId: postId,
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName || "Kullanıcı",
                userPhotoURL: auth.currentUser.photoURL,
                text: newComment,
                createdAt: new Date().toISOString()
            });

            // Update post comment count
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
                commentsCount: increment(1)
            });

            // Send notification to post author
            if (post.authorId !== auth.currentUser.uid) {
                await sendNotification(
                    post.authorId,
                    auth.currentUser.uid,
                    auth.currentUser.displayName || "Bir kullanıcı",
                    "comment",
                    postId
                );
            }

            setNewComment("");
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmitting(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)]">
                <Header />
                <div className="container mx-auto px-4 pt-6">
                    <div className="flex gap-6">
                        <Sidebar />
                        <main className="flex-1 max-w-2xl mx-auto pb-20">
                            <SkeletonCard />
                        </main>
                        <div className="hidden xl:block w-80"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center text-[var(--color-muted)]">
                <p className="mb-4">Gönderi bulunamadı.</p>
                <button
                    onClick={() => router.back()}
                    className="text-[var(--color-primary)] hover:underline"
                >
                    Geri Dön
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto pb-20">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-text)] mb-4 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Geri Dön</span>
                        </button>

                        {/* Post Card */}
                        <RecommendationCard post={post} isDetailView={true} />

                        {/* Comments Section */}
                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 mt-6">
                            <h3 className="font-bold text-[var(--color-text)] mb-4">Yorumlar ({comments.length})</h3>

                            {/* Comment Form */}
                            <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                                    {auth.currentUser?.displayName?.[0] || "?"}
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Bir yorum yaz..."
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-full py-2 pl-4 pr-12 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submitting}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[var(--color-primary)] hover:bg-[var(--color-background)] rounded-full disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-6">
                                {comments.length === 0 ? (
                                    <p className="text-center text-[var(--color-muted)] text-sm">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                                {comment.userPhotoURL ? (
                                                    <img src={comment.userPhotoURL} alt={comment.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    comment.username[0]
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-[var(--color-background)] rounded-2xl rounded-tl-none px-4 py-2 inline-block relative pr-8">
                                                    <span className="font-semibold text-sm text-[var(--color-text)] block">{comment.username}</span>
                                                    <p className="text-sm text-[var(--color-text)]">{comment.text}</p>

                                                    {auth.currentUser?.uid === comment.userId && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="absolute right-2 top-2 text-[var(--color-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Yorumu Sil"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mt-1 ml-2 text-xs text-[var(--color-muted)]">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
