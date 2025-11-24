"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Users, Bookmark, Settings, MessageCircle, User, Bell } from "lucide-react";

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
    return (
        <aside className="hidden lg:block w-64 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto z-30">
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
                    {["Dizi/Film", "Kitap", "Müzik", "Mekan", "Teknoloji"].map((cat) => (
                        <Link
                            key={cat}
                            href={`/category/${cat.toLowerCase()}`}
                            className="block text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                        >
                            # {cat}
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
