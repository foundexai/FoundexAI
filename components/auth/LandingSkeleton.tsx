import { Skeleton } from "@/components/ui/Skeleton";

export default function LandingSkeleton() {
  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-2xl">
      <div className="mb-8 text-center">
        {/* Logo Placeholder */}
        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 dark:bg-white/5">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>
        {/* Title Placeholder */}
        <Skeleton className="h-9 w-48 mx-auto mb-2 rounded-lg" />
        {/* Subtitle Placeholder */}
        <Skeleton className="h-4 w-64 mx-auto rounded-md" />
      </div>

      <div className="space-y-4">
        {/* Input Placeholders */}
        <div className="relative">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="relative">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Button Placeholder */}
        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>

      <div className="mt-6 text-center">
        <Skeleton className="h-4 w-40 mx-auto rounded-md" />
      </div>
    </div>
  );
}
