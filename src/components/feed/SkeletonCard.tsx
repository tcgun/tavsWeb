import { Skeleton } from "@/components/ui/Skeleton";

export function SkeletonCard() {
    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 mb-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-3/4 mb-2" />

            {/* Content */}
            <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Image Placeholder */}
            <Skeleton className="w-full h-64 rounded-lg mb-4" />

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-5" />
            </div>
        </div>
    );
}
