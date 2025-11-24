"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, Bookmark, User } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Ana Sayfa", href: "/" },
        { icon: Search, label: "Arama", href: "/search" },
        { icon: MessageCircle, label: "Mesajlar", href: "/messages" },
        { icon: Bookmark, label: "Kaydedilenler", href: "/saved" },
        { icon: User, label: "Profil", href: "/profile" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-background)] border-t border-[var(--color-border)] z-50 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                                }`}
                        >
                            <item.icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
