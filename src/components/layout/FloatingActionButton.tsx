"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CreatePostModal from "@/components/ui/CreatePostModal";

import { usePathname } from "next/navigation";

export default function FloatingActionButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isPostDetail = pathname?.startsWith("/post/");

    // Show FAB only on Home and Post Detail (where header button is hidden)
    // Or rather, user said "chatbotun solunda görünen sayfalarda sağ altta tavsiye paylaş butonu olmasın"
    // Header button is shown if (!isHome && !isPostDetail).
    // So FAB should be hidden if (!isHome && !isPostDetail).
    // Which means FAB should be shown if (isHome || isPostDetail).

    if (!isHome && !isPostDetail) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 z-40 group"
                aria-label="Yeni gönderi oluştur"
            >
                <div className="relative bg-[var(--color-primary)] rounded-full p-3 shadow-lg transform group-hover:scale-105 transition-all duration-300 group-active:scale-95">
                    <PlusCircle className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
            </button>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
