"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        const isAuthPage = pathname === "/login" || pathname === "/register";

        if (!user && !isAuthPage) {
            router.push("/login");
        } else if (user && isAuthPage) {
            router.push("/");
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    // Prevent flashing of protected content while redirecting
    const isAuthPage = pathname === "/login" || pathname === "/register";
    if (!user && !isAuthPage) {
        return null;
    }

    return <>{children}</>;
}
