"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
        }
    };

    return (
        <div className="bg-[var(--color-card)] p-8 rounded-xl border border-[var(--color-border)] shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-6 text-[var(--color-text)]">Giriş Yap</h3>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-6">
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
                    Giriş Yap
                </button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                    Hesabın yok mu?{" "}
                    <Link href="/register" className="font-medium text-[var(--color-accent)] hover:text-opacity-80">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
