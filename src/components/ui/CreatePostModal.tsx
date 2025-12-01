"use client";

import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { X, ImagePlus, ChevronDown, Sparkles } from "lucide-react";

import { uploadImage } from "@/services/imageUpload";
import { useCategories } from "@/hooks/useCategories";

import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-[var(--color-card)] animate-pulse rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">Harita yükleniyor...</div>
});

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: string;
}

export default function CreatePostModal({ isOpen, onClose, initialCategory }: CreatePostModalProps) {
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");
    const [category, setCategory] = useState(initialCategory || "Dizi/Film");
    const [image, setImage] = useState<File | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number, address?: string } | null>(null);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialCategory) {
            setCategory(initialCategory);
        }
    }, [initialCategory]);

    const { categories: fetchedCategories, loading: categoriesLoading } = useCategories();

    // Fallback categories if database is empty or loading
    const defaultCategories = [
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

    const categories = fetchedCategories.length > 0 ? fetchedCategories.map(c => c.name) : defaultCategories;

    // Check if we should show the map based on category
    const shouldShowMap = ["kafe", "restoran", "mekan", "seyahat", "tadilat", "tamirat"].some(keyword =>
        category.toLowerCase().includes(keyword)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setLoading(true);
        setError(null);

        try {
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImage(image, `posts/${auth.currentUser.uid}`);
            }

            await addDoc(collection(db, "posts"), {
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Anonim",
                authorPhotoURL: auth.currentUser.photoURL,
                title,
                detail,
                category,
                imageUrl,
                location: location ? { lat: location.lat, lng: location.lng, address: location.address } : null,
                likesCount: 0,
                commentsCount: 0,
                savesCount: 0,
                createdAt: new Date().toISOString(),
            });

            // Reset form
            setTitle("");
            setDetail("");
            setCategory("Dizi/Film");
            setImage(null);
            setLocation(null);
            setShowImageUpload(false);
            onClose();
        } catch (err) {
            console.error("Error adding document: ", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Paylaşım yapılırken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
                onClick={onClose}
            />

            {/* Modal - Bottom sheet on mobile, centered modal on desktop */}
            <div className="fixed inset-x-0 bottom-0 lg:inset-0 lg:flex lg:items-center lg:justify-center z-[70] animate-slide-up">
                <div className="bg-[var(--color-card)] lg:rounded-[40px] rounded-t-[40px] border-t lg:border border-[var(--color-border)] lg:max-w-2xl lg:w-full mx-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between shrink-0">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">Tavsiye Paylaş</h2>
                        <button
                            onClick={onClose}
                            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="custom-scroll overflow-y-auto p-4 space-y-3 flex-1">

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                    Başlık
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-sm"
                                    placeholder={(() => {
                                        switch (category) {
                                            case "Dizi/Film": return "Hangi filmi veya diziyi izledin? 🎬";
                                            case "Kitap": return "Hangi kitabı okudun? 📚";
                                            case "Müzik": return "Hangi şarkıyı veya albümü dinledin? 🎵";
                                            case "Mekan": return "Nereyi keşfettin? 📍";
                                            case "Teknoloji": return "Hangi teknolojik ürünü denedin? 📱";
                                            case "Yeme/İçme": return "Ne yedin, ne içtin? 🍔";
                                            case "Oyun": return "Hangi oyunu oynadın? 🎮";
                                            default: return "Tavsiyen nedir? ✨";
                                        }
                                    })()}
                                />
                            </div>
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                    Kategori
                                </label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="custom-scroll w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-sm appearance-none"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)] pointer-events-none" />
                                </div>
                            </div>

                            {/* Map Picker */}
                            {shouldShowMap && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                        Konum Seç
                                    </label>
                                    <MapPicker onLocationSelect={setLocation} />
                                    <p className="text-xs text-[var(--color-muted)] mt-1">
                                        {location ? (location.address || "Konum seçildi.") : "Haritadan bir konum işaretleyin."}
                                    </p>
                                </div>
                            )}

                            {/* Details */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-[var(--color-muted)]">
                                        Detaylar
                                    </label>
                                    {title && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!title) return;
                                                setGeneratingContent(true);
                                                try {
                                                    const response = await fetch('/api/generate-content', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ title, category }),
                                                    });
                                                    const data = await response.json();
                                                    if (data.content) {
                                                        setDetail(data.content);
                                                    } else {
                                                        setError(data.error || 'İçerik oluşturulamadı.');
                                                    }
                                                } catch (err) {
                                                    setError('İçerik oluşturulurken bir hata oluştu.');
                                                } finally {
                                                    setGeneratingContent(false);
                                                }
                                            }}
                                            disabled={generatingContent}
                                            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors disabled:opacity-50"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            {generatingContent ? 'Oluşturuluyor...' : 'Sihirli Değnek'}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    required
                                    value={detail}
                                    onChange={(e) => setDetail(e.target.value)}
                                    rows={3}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none transition-all text-sm"
                                    placeholder="Deneyimlerini ve neden tavsiye ettiğini anlat..."
                                />
                            </div>

                            {/* Image Upload - Collapsible */}
                            {!showImageUpload && !image ? (
                                <button
                                    type="button"
                                    onClick={() => setShowImageUpload(true)}
                                    className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    <span>Fotoğraf ekle (opsiyonel)</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors text-[var(--color-text)] text-sm flex-1">
                                        <ImagePlus className="h-4 w-4" />
                                        <span>{image ? image.name : "Fotoğraf Seç"}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                setImage(e.target.files?.[0] || null);
                                                setError(null);
                                            }}
                                        />
                                    </label>
                                    {image && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImage(null);
                                                setShowImageUpload(false);
                                            }}
                                            className="p-2 text-[var(--color-muted)] hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-2 pb-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                                >
                                    {loading ? "Paylaşılıyor..." : "Tavsiyeyi Paylaş"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
