import { Skeleton } from "@/components/ui/Skeleton";

export function StartupCardSkeleton() {
  return (
    <div className="glass-card h-full p-6 rounded-3xl border border-white/50 dark:bg-zinc-900/60 dark:border-zinc-800">
      <div className="flex justify-between items-start mb-6">
        <Skeleton className="w-14 h-14 rounded-2xl" />
      </div>

      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-2 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 dark:border-zinc-800">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}
