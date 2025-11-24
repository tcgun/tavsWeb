"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CreatePostModal from "@/components/ui/CreatePostModal";

export default function FloatingActionButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="lg:hidden fixed bottom-20 right-6 z-50 group"
                aria-label="Yeni gönderi oluştur"
            >
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                    {/* Button */}
                    <div className="relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full p-4 shadow-2xl transform group-hover:scale-110 transition-all duration-300 group-active:scale-95">
                        <PlusCircle className="h-7 w-7 text-white" strokeWidth={2.5} />
                    </div>
                </div>
            </button>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
