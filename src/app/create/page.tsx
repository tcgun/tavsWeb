"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Image as ImageIcon, X } from "lucide-react";
import Header from "@/components/layout/Header";

export default function CreatePostPage() {
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");
    const [category, setCategory] = useState("Dizi/Film");
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const categories = [
        "Dizi/Film",
        "Kitap",
        "Müzik",
        "Mekan",
        "Teknoloji",
        "Emlak/Vasıta",
        "İkinci El",
        "Kişisel",
        "Diğer",
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            // Image upload logic would go here (Firebase Storage)
            // For now, we'll skip actual image upload and just use a placeholder if needed or null

            await addDoc(collection(db, "posts"), {
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Anonim",
                authorPhotoURL: auth.currentUser.photoURL,
                title,
                detail,
                category,
                imageUrl: image ? URL.createObjectURL(image) : null, // Mocking image URL for local preview if needed, but for DB we need real URL
                likesCount: 0,
                commentsCount: 0,
                savesCount: 0,
                createdAt: new Date().toISOString(),
            });

            router.push("/");
        } catch (error) {
            console.error("Error adding document: ", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
                    <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Tavsiye Paylaş</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                                Başlık
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                placeholder="Örn: Harika bir film izledim..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                                Kategori
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                                Detaylar
                            </label>
                            <textarea
                                required
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                                rows={6}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                placeholder="Deneyimlerini ve neden tavsiye ettiğini anlat..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                                Fotoğraf (İsteğe Bağlı)
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors text-[var(--color-text)]">
                                    <ImageIcon className="h-5 w-5" />
                                    <span>Fotoğraf Seç</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                                    />
                                </label>
                                {image && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                                        <span>{image.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setImage(null)}
                                            className="text-[var(--color-muted)] hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Paylaşılıyor..." : "Tavsiyeyi Paylaş"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
