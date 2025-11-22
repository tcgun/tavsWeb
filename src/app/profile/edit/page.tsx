"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Camera, Save, X, Loader2 } from "lucide-react";

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);

            // Fetch additional user data from Firestore
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setDisplayName(userData.displayName || currentUser.displayName || "");
                    setBio(userData.bio || "");
                    setPhotoURL(userData.photoURL || currentUser.photoURL || "");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            let newPhotoURL = photoURL;

            // Upload image if selected
            if (selectedFile) {
                const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, selectedFile);
                newPhotoURL = await getDownloadURL(storageRef);
            }

            // Update Auth Profile
            await updateProfile(user, {
                displayName: displayName,
                photoURL: newPhotoURL
            });

            // Update Firestore Document
            await updateDoc(doc(db, "users", user.uid), {
                displayName: displayName,
                bio: bio,
                photoURL: newPhotoURL
            });

            router.push("/profile");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Profil güncellenirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto">
                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-[var(--color-text)]">Profili Düzenle</h1>
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 hover:bg-[var(--color-background)] rounded-full text-[var(--color-muted)]"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Profile Photo */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-32 h-32">
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--color-primary)] flex items-center justify-center text-white text-4xl border-4 border-[var(--color-card)] shadow-lg">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : photoURL ? (
                                                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                displayName[0]?.toUpperCase() || "?"
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 p-2 bg-[var(--color-primary)] text-white rounded-full hover:bg-opacity-90 transition-colors shadow-md"
                                        >
                                            <Camera className="h-5 w-5" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    <p className="text-sm text-[var(--color-muted)]">Profil fotoğrafını değiştirmek için tıklayın</p>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                            Görünen İsim
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                            placeholder="Adınız Soyadınız"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                            Biyografi
                                        </label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] min-h-[100px] resize-none"
                                            placeholder="Kendinizden bahsedin..."
                                            maxLength={160}
                                        />
                                        <p className="text-xs text-[var(--color-muted)] text-right mt-1">
                                            {bio.length}/160
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4 pt-4 border-t border-[var(--color-border)]">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2 rounded-full font-medium text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
                                        disabled={saving}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 rounded-full font-medium bg-[var(--color-primary)] text-white hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
