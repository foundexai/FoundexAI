import { Skeleton } from "@/components/ui/Skeleton";

export function InvestorCardSkeleton() {
  return (
    <div className="glass-card flex flex-col p-6 rounded-3xl border border-white/60 bg-white/40 h-full dark:bg-zinc-900/40 dark:border-zinc-800">
      {/* Header: Logo & Type */}
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
      </div>

      {/* Content: Name & Desc */}
      <div className="mb-4 grow space-y-3">
        <Skeleton className="h-7 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>

      {/* Footer: Action */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center dark:border-zinc-800">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
