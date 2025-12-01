"use client";

import Link from "next/link";
import { Search, User, LogOut, Sparkles, Bell, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import CreatePostModal from "@/components/ui/CreatePostModal";
import { useAIChat } from "@/context/AIChatContext";

export default function Header() {
    const router = useRouter();
    const { toggleChat } = useAIChat();
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setIsMobileSearchOpen(false);
        }
    };

    // ... existing code ...
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const pathname = usePathname();
    const isHome = pathname === "/";
    const isPostDetail = pathname?.startsWith("/post/");
    const showMobileShareButton = !isHome && !isPostDetail;

    return (
        <>
            <header className="sticky top-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-[var(--color-primary)]">
                        t a v s
                    </Link>

                    <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-muted)] h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Tavsiye ara..."
                                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="hidden sm:block px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
                                >
                                    Tavsiye Paylaş
                                </button>

                                {showMobileShareButton && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="sm:hidden p-2 hover:bg-[var(--color-card)] rounded-full text-[var(--color-primary)]"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                )}

                                <button
                                    onClick={toggleChat}
                                    className="md:hidden p-2 hover:bg-[var(--color-card)] rounded-full text-[var(--color-primary)]"
                                >
                                    <Sparkles className="h-5 w-5" />
                                </button>

                                <Link href="/notifications" className="md:hidden p-2 hover:bg-[var(--color-card)] rounded-full text-[var(--color-text)]">
                                    <Bell className="h-5 w-5" />
                                </Link>

                                <button onClick={handleLogout} className="p-2 hover:bg-[var(--color-card)] rounded-full text-[var(--color-text)]">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
