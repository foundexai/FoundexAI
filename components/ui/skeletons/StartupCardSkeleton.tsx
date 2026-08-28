import { Skeleton } from "@/components/ui/Skeleton";
 
export function StartupCardSkeleton() {
  return (
    <div className="glass-card flex flex-col h-full p-6 rounded-3xl border border-white/60 dark:bg-zinc-900/60 dark:border-white/10 relative overflow-hidden">
      {/* Logo and Badges skeleton */}
      <div className="flex justify-between items-start mb-6">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
 
      {/* Title & Desc */}
      <div className="grow mb-4 space-y-3">
        <Skeleton className="h-6 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
      </div>
 
      {/* Tags skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
 
      {/* Footer skeleton */}
      <div className="pt-4 border-t border-gray-150/40 dark:border-white/10 flex justify-between items-center mt-auto">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
