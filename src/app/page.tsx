import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import Feed from "@/components/feed/Feed";
import { SkeletonCard } from "@/components/feed/SkeletonCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <div className="container mx-auto px-4 pt-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="flex-1 max-w-2xl mx-auto pb-20">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-8 w-32 bg-[var(--color-card)] rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-[var(--color-card)] rounded-full animate-pulse" />
                      <div className="h-8 w-24 bg-[var(--color-card)] rounded-full animate-pulse" />
                    </div>
                  </div>
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }
            >
              <Feed />
            </Suspense>
          </main>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
