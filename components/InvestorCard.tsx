import { MapPin, ArrowRight, Buildings, GlobeSimple, Heart, Star, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Investor {
  id: string;
  name: string;
  type: "VC" | "Angel" | "Accelerator" | "PE";
  focus: string[];
  location: string;
  logoInitial: string;
  logoColor: string;
  description: string;
  investmentRange?: string;
  website?: string;
  logo_url?: string;
  isFeatured?: boolean;
}

interface InvestorCardProps {
  investor: Investor;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isSaving?: boolean;
}

export function InvestorCard({
  investor,
  isSaved = false,
  onToggleSave,
  isSaving = false,
}: InvestorCardProps) {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(investor.id);
    }
  };

  return (
    <Link href={`/dashboard/investors/${investor.id}`} className="block h-full">
      <div className="glass-card group flex flex-col p-6 rounded-3xl border border-white/60 bg-white/40 hover:bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden h-full dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
        {/* Decorative gradient blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-white/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500 dark:from-white/5"></div>

        {/* Header: Logo & Type */}
        <div className="flex justify-between items-start mb-4 z-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-yellow-400 shadow-lg shrink-0"
          >
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="p-2 rounded-full bg-white/50 border border-white/50 hover:bg-white transition-all shadow-sm hover:shadow-md dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20 disabled:opacity-50"
            >
              {isSaving ? (
                <CircleNotch className="w-5 h-5 animate-spin text-yellow-500" weight="bold" />
              ) : (
                <Heart
                  weight={isSaved ? "fill" : "bold"}
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isSaved
                      ? "text-red-500"
                      : "text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400",
                  )}
                />
              )}
            </button>
            <div className="px-3 py-1 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
              {investor.type}
            </div>
            {investor.isFeatured && (
               <div className="px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Star weight="fill" className="w-3 h-3" />
                Featured
              </div>
            )}
          </div>
        </div>

        {/* Content: Name & Desc */}
        <div className="mb-4 z-10 grow">
          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-black transition-colors dark:text-white dark:group-hover:text-white">
            {investor.name}
          </h3>
          <div className="flex items-center text-xs text-gray-500 mb-3 font-medium dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5 mr-1" weight="bold" />
            {investor.location}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed dark:text-gray-300">
            {investor.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6 z-10">
          {investor.focus.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg bg-gray-100/50 text-xs font-semibold text-gray-600 border border-gray-100/50 group-hover:bg-white/80 transition-colors dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:group-hover:bg-white/10"
            >
              {tag}
            </span>
          ))}
          {investor.focus.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              +{investor.focus.length - 3} more
            </span>
          )}
        </div>

        {/* Footer: Action */}
        <div className="mt-auto pt-4 border-t border-gray-100/50 flex justify-between items-center z-10 dark:border-white/10">
          <div className="text-xs font-medium text-gray-500">
            {investor.investmentRange && (
              <span className="block text-gray-400 text-[10px] uppercase tracking-wide dark:text-gray-500">
                Range: {investor.investmentRange}
              </span>
            )}
          </div>

          <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-transparent transition-all shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-gray-300 dark:group-hover:bg-white dark:group-hover:text-black">
            <ArrowRight className="w-4 h-4" weight="bold" />
          </div>
        </div>
      </div>
    </Link>
  );
}
