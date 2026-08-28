import { MapPin, TrendUp, Check, PencilSimple, ArrowRight, CircleNotch, Heart, Star } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

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
  logo_url?: string;
  isFeatured?: boolean;
}

interface StartupCardProps {
  startup: Startup;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isSaving?: boolean;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  onEdit?: (startup: Startup) => void;
  variant?: "default" | "mini";
}

export function StartupCard({
  startup,
  isSaved = false,
  onToggleSave,
  isSaving = false,
  onSelect,
  isSelected = false,
  onEdit,
  variant = "default",
}: StartupCardProps) {
  const router = useRouter();

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(startup.id);
    }
  };

  const cardContent = (
    <div 
      className={cn(
        "glass-card group flex flex-col rounded-3xl border border-white/60 bg-white/40 hover:bg-white/60 transition-all duration-300 relative overflow-hidden h-full dark:bg-zinc-900/60 dark:border-white/10 dark:hover:bg-white/10",
        variant === "mini" ? "p-4" : "p-6",
        isSelected && "ring-2 ring-yellow-500 border-transparent",
        !onEdit && "hover:-translate-y-1 hover:shadow-xl cursor-pointer"
      )}
    >
      {/* Checkbox for Select */}
      {onSelect && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(startup.id);
          }}
          className={cn(
            "absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
            isSelected 
              ? "bg-yellow-500 border-yellow-500 text-black" 
              : "bg-white/50 border-white/50 hover:border-yellow-500/50 dark:bg-white/10 dark:border-white/20"
          )}
        >
          {isSelected && <Check weight="bold" className="w-4 h-4" />}
        </button>
      )}

      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-white/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500 dark:from-white/5 pointer-events-none"></div>

      {/* Header: Logo & Badges */}
      <div className={cn("flex justify-between items-start z-10", variant === "mini" ? "mb-3" : "mb-4")}>
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden bg-yellow-455 border border-gray-100 dark:border-white/5",
            variant === "mini" ? "w-10 h-10" : "w-14 h-14"
          )}
        >
          <BrandLogo 
            name={startup.name}
            website={startup.website}
            logo_url={startup.logo_url}
            initial={startup.logoInitial}
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          {onToggleSave && (
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="p-2 rounded-full bg-white/50 border border-white/50 hover:bg-white transition-all shadow-sm hover:shadow-md dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20 disabled:opacity-50 cursor-pointer"
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
          )}
          <div className="px-3 py-1 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-gray-300 dark:border-white/10">
            {startup.stage}
          </div>
          {startup.isFeatured && (
            <div className="px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Star weight="fill" className="w-3 h-3" />
              Featured
            </div>
          )}
        </div>
      </div>

      {/* Content: Name & Desc */}
      <div className={cn("z-10 grow", variant === "mini" ? "mb-3" : "mb-4")}>
        <h3 className={cn(
          "font-bold text-gray-900 leading-tight mb-1 group-hover:text-black transition-colors dark:text-white dark:group-hover:text-white",
          variant === "mini" ? "text-base" : "text-xl"
        )}>
          {startup.name}
        </h3>
        <div className="flex items-center text-xs text-gray-500 mb-3 font-medium dark:text-gray-400">
          <MapPin className="w-3.5 h-3.5 mr-1" weight="bold" />
          {startup.location}
        </div>
        <p className={cn(
          "text-sm text-gray-600 leading-relaxed dark:text-gray-300",
          variant === "mini" ? "line-clamp-2" : "line-clamp-3"
        )}>
          {startup.description}
        </p>
      </div>

      {/* Tags / Sector & Traction */}
      <div className={cn("flex flex-wrap gap-2 z-10", variant === "mini" ? "mb-4" : "mb-6")}>
        <span
          className="px-2.5 py-1 rounded-lg bg-gray-100/50 text-[10px] sm:text-xs font-semibold text-gray-600 border border-gray-100/50 group-hover:bg-white/80 transition-colors dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:group-hover:bg-white/10"
        >
          {startup.sector}
        </span>
        {startup.traction && (
          <span
            className="px-2.5 py-1 rounded-lg bg-green-50/50 text-[10px] sm:text-xs font-semibold text-green-700 border border-green-100/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-550/20 flex items-center gap-1"
          >
            <TrendUp className="w-3.5 h-3.5" weight="bold" />
            {startup.traction}
          </span>
        )}
      </div>

      {/* Footer: Action */}
      <div className={cn("mt-auto flex justify-between items-center z-10", variant !== "mini" && "pt-4 border-t border-gray-100/50 dark:border-white/10")}>
        <div className="text-xs font-medium text-gray-500">
          {/* Space reserved for extra footer metadata */}
        </div>

        <div className="flex gap-2">
          {onEdit ? (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(startup);
                }}
                type="button"
                className={cn(
                  "rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white hover:border-transparent transition-all shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white dark:hover:text-black cursor-pointer",
                  variant === "mini" ? "w-8 h-8" : "w-10 h-10"
                )}
                title="Edit Profile"
              >
                <PencilSimple className={variant === "mini" ? "w-3 h-3" : "w-4 h-4"} weight="bold" />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/startups/${startup.id}`);
                }}
                type="button"
                className={cn(
                  "rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-white hover:border-transparent transition-all shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-gray-300 dark:hover:bg-yellow-500 dark:hover:text-black cursor-pointer",
                  variant === "mini" ? "w-8 h-8" : "w-10 h-10"
                )}
                title="View Profile"
              >
                <ArrowRight className={variant === "mini" ? "w-3 h-3" : "w-4 h-4"} weight="bold" />
              </button>
            </>
          ) : (
            <div className={cn(
              "rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-transparent transition-all shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-gray-300 dark:group-hover:bg-white dark:group-hover:text-black",
              variant === "mini" ? "w-8 h-8" : "w-10 h-10"
            )}>
              <ArrowRight className={variant === "mini" ? "w-3 h-3" : "w-4 h-4"} weight="bold" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (onEdit) {
    return cardContent;
  }

  return (
    <Link href={`/dashboard/startups/${startup.id}`} className="block h-full">
      {cardContent}
    </Link>
  );
}
