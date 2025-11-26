"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Users, Bookmark, Settings, MessageCircle, User, Bell } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

const navItems = [
    { icon: Home, label: "Ana Sayfa", href: "/" },
    { icon: MessageCircle, label: "Mesajlar", href: "/messages" },
    { icon: Bell, label: "Bildirimler", href: "/notifications" },
    { icon: User, label: "Profil", href: "/profile" },
    { icon: Bookmark, label: "Kaydedilenler", href: "/saved" },
    { icon: Settings, label: "Ayarlar", href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { categories: fetchedCategories, loading } = useCategories();

    // Only use default categories if we are NOT loading and have NO fetched categories
    // This prevents the "flash" of default content during initial load
    const defaultCategories = ["Dizi/Film", "Kitap", "Müzik", "Mekan", "Teknoloji"];

    let categoriesToShow: string[] = [];
    if (!loading) {
        categoriesToShow = fetchedCategories.length > 0
            ? fetchedCategories.map(c => c.name)
            : defaultCategories;
    }

    return (
        <aside className="hidden lg:block w-64 z-30 pb-20">
            <nav className="space-y-2">
                {navItems.map((item) => {
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(item.href) ?? false;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                ? "bg-[var(--color-card)] text-[var(--color-primary)] font-bold shadow-sm"
                                : "text-[var(--color-text)] hover:bg-[var(--color-card)]"
                                }`}
                        >
                            <item.icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 px-4">
                <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">Kategoriler</h3>
                <div className="space-y-2">
                    {loading ? (
                        // Skeleton loading state
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-5 bg-[var(--color-card)] rounded animate-pulse w-3/4" />
                        ))
                    ) : (
                        categoriesToShow.map((cat) => (
                            <Link
                                key={cat}
                                href={`/category/${encodeURIComponent(cat.toLowerCase())}`}
                                className="block text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                # {cat}
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
