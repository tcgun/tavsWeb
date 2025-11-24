"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { User, Moon, LogOut, Info, ChevronRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header />
            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 max-w-2xl mx-auto pb-20">


                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">

                            {/* Profil */}
                            <Link href="/profile/edit" className="flex items-center justify-between p-4 hover:bg-[var(--color-background)] transition-colors border-b border-[var(--color-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">Profili Düzenle</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[var(--color-muted)]" />
                            </Link>

                            {/* Görünüm (Placeholder) */}
                            <div className="flex items-center justify-between p-4 hover:bg-[var(--color-background)] transition-colors border-b border-[var(--color-border)] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Moon className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">Görünüm</span>
                                </div>
                                <span className="text-sm text-[var(--color-muted)]">Karanlık Mod (Otomatik)</span>
                            </div>

                            {/* Hakkında */}
                            <div className="flex items-center justify-between p-4 hover:bg-[var(--color-background)] transition-colors border-b border-[var(--color-border)] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">Hakkında</span>
                                </div>
                                <span className="text-sm text-[var(--color-muted)]">v1.0.0</span>
                            </div>

                            {/* Çıkış Yap */}
                            <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <LogOut className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-red-600">Çıkış Yap</span>
                                </div>
                            </button>

                        </div>
                    </main>

                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
