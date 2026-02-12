import { Skeleton } from "@/components/ui/Skeleton";

export function StartupSmallCardSkeleton() {
  return (
    <div className="glass-card border border-white/60 rounded-2xl p-4 flex flex-col bg-white dark:bg-white/5 dark:border-white/10">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-full rounded-sm" />
        <Skeleton className="h-3 w-2/3 rounded-sm" />
      </div>
    </div>
  );
}
