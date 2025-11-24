"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: username,
            });

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username: username,
                email: email,
                displayName: username,
                photoURL: user.photoURL || "",
                bio: "",
                stats: {
                    followers: 0,
                    following: 0,
                },
                createdAt: new Date().toISOString(),
            });

            router.push("/");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.");
            } else if (err.code === 'auth/weak-password') {
                setError("Şifre çok zayıf. En az 6 karakter olmalı.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Geçersiz e-posta adresi.");
            } else {
                setError("Kayıt başarısız. Lütfen tekrar deneyin.");
            }
        }
    };

    const handleSocialLogin = async (provider: GoogleAuthProvider | OAuthProvider) => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Create new user profile
                await setDoc(userDocRef, {
                    uid: user.uid,
                    username: user.displayName?.replace(/\s+/g, '').toLowerCase() || `user${user.uid.slice(0, 5)}`,
                    email: user.email,
                    displayName: user.displayName || "İsimsiz Kullanıcı",
                    photoURL: user.photoURL || "",
                    bio: "",
                    stats: {
                        followers: 0,
                        following: 0,
                    },
                    createdAt: new Date().toISOString(),
                });
            }

            router.push("/");
        } catch (err: any) {
            console.error("Social login error:", err);
            setError("Giriş yapılırken bir hata oluştu.");
        }
    };

    return (
        <>
            <h3 className="text-3xl font-bold text-center mb-8 text-[var(--color-text)] tracking-tight">Kayıt Ol</h3>
            {error && <p className="text-red-500 text-sm text-center mb-4 bg-red-500/10 py-2 rounded-lg">{error}</p>}

            <div className="space-y-3 mb-8">
                <button
                    onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Google ile devam et
                </button>
                <button
                    onClick={() => handleSocialLogin(new OAuthProvider('apple.com'))}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-[var(--color-border)] rounded-lg bg-black text-white hover:bg-gray-900 transition-colors font-medium text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.64 3.4 1.63-3.12 1.88-2.6 5.75.35 7.1-.93 2.33-2.22 4.64-3.4 5.28zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.54 4.33-3.74 4.25z" />
                    </svg>
                    Apple ile devam et
                </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        Kullanıcı Adı
                    </label>
                    <input
                        id="username"
                        type="text"
                        required
                        className="block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        E-posta
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        className="block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        Şifre
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        className="block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                >
                    Kayıt Ol
                </button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                    Zaten hesabın var mı?{" "}
                    <Link href="/login" className="font-medium text-[var(--color-accent)] hover:text-opacity-80">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </>
    );
}
