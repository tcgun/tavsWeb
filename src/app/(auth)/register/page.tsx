"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
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

    return (
        <div className="bg-[var(--color-card)] p-8 rounded-xl border border-[var(--color-border)] shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-6 text-[var(--color-text)]">Kayıt Ol</h3>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-[var(--color-muted)]">
                        Kullanıcı Adı
                    </label>
                    <input
                        id="username"
                        type="text"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--color-muted)]">
                        E-posta
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--color-muted)]">
                        Şifre
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
        </div>
    );
}
