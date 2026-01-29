import {
  ArrowRight,
  MapPin,
  Building2,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  location: string;
  logoInitial: string;
  logoColor: string;
  description: string;
  website?: string;
  traction?: string;
}

interface StartupCardProps {
  startup: Startup;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export function StartupCard({
  startup,
  isSaved,
  onToggleSave,
}: StartupCardProps) {
  return (
    <Link
      href={`/dashboard/startups/${startup.id}`}
      className="group block h-full"
    >
      <div className="glass-card h-full p-6 rounded-3xl border border-white/50 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden dark:bg-zinc-900/60 dark:border-zinc-800 dark:hover:border-yellow-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-gray-100 to-gray-200 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500 dark:from-zinc-800 dark:to-zinc-900 dark:opacity-20 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg bg-linear-to-br",
                startup.logoColor,
              )}
            >
              {startup.logoInitial}
            </div>
            <div className="flex gap-2">
              {/* Save button could go here if we implement saving for startups later */}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors dark:text-white dark:group-hover:text-yellow-500">
              {startup.name}
            </h3>
            <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded-md dark:bg-white/10 dark:text-gray-300">
                {startup.sector}
              </span>
              <span className="mx-2">•</span>
              <span className="text-yellow-600 dark:text-yellow-500">
                {startup.stage}
              </span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-4 dark:text-gray-400">
              {startup.description}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 dark:border-zinc-800">
            <div className="flex items-center text-gray-500 text-sm font-medium dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              {startup.location}
            </div>
            {startup.traction && (
              <div className="flex items-center text-gray-500 text-sm font-medium dark:text-gray-400">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                {startup.traction}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
