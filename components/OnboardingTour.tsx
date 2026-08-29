"use client";
import { useState, useEffect } from "react";
import { X, CaretRight, CaretLeft, RocketLaunch } from "@phosphor-icons/react";

interface Step {
  title: string;
  description: string;
  targetId?: string;
}

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; position: "fixed" | "center" } | null>(null);

  useEffect(() => {
    // Check if the user has already completed the tour
    const completed = localStorage.getItem("foundex_tour_completed");
    if (!completed) {
      // Small delay to let the dashboard render and settle
      const timer = setTimeout(() => {
        setActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      title: "Welcome to FoundexAI 🚀",
      description: "Let's take a quick 1-minute walkthrough to get you familiar with your new dashboard workspace."
    },
    {
      title: "Your Navigation Hub 📂",
      description: "This is your main sidebar navigation. Switch between documents, cap tables, tasks, and notes instantly. On mobile, tap the top menu icon to open this menu.",
      targetId: "sidebar-nav"
    },
    {
      title: "Startup Switcher 🔄",
      description: "Switch between multiple startup profiles or create new ones using this selector dropdown.",
      targetId: "startup-switcher"
    },
    {
      title: "Readiness & Strategic Hub ⚡",
      description: "Review your startup readiness score, legal structure, business model notes, and tasks in real-time.",
      targetId: "dashboard-core"
    },
    {
      title: "Updates & Reporting 📈",
      description: "Share updates with investors, download professional monthly PDF reports, and receive warning alerts for runway anomalies.",
      targetId: "investor-updates"
    }
  ];

  // Effect to calculate coordinates dynamically
  useEffect(() => {
    if (!active) return;
    const step = steps[currentStep];
    
    if (!step.targetId) {
      setCoords({ top: 0, left: 0, position: "center" });
      return;
    }

    const updateCoords = () => {
      const el = document.getElementById(step.targetId!);
      if (el) {
        const rect = el.getBoundingClientRect();
        const isMobile = window.innerWidth < 768; // responsive breakpoint
        
        if (isMobile) {
          setCoords({ top: 0, left: 0, position: "center" });
        } else {
          // Adjust vertical centering relative to target
          let top = rect.top + (rect.height / 2) - 120;
          let left = rect.right + 24;
          
          // Switcher target position adjustment (if it's at the top, position below it)
          if (step.targetId === "startup-switcher") {
            left = rect.left;
            top = rect.bottom + 16;
          } else if (left + 380 > window.innerWidth) {
            // Position below if not enough space on right
            left = Math.max(20, rect.left);
            top = rect.bottom + 16;
          }
          
          // Ensure coordinates stay on-screen
          top = Math.max(20, Math.min(top, window.innerHeight - 300));
          left = Math.max(20, Math.min(left, window.innerWidth - 380));
          
          setCoords({ top, left, position: "fixed" });
        }
      } else {
        setCoords({ top: 0, left: 0, position: "center" });
      }
    };

    updateCoords();
    const interval = setInterval(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, { capture: true, passive: true });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, { capture: true });
    };
  }, [currentStep, active]);

  // Effect to add ring highlight glow onto the active target element
  useEffect(() => {
    const step = steps[currentStep];
    if (active && step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.classList.add(
          "transition-all", 
          "duration-500", 
          "ring-[5px]", 
          "ring-yellow-400/80", 
          "dark:ring-[#E5C158]/80", 
          "ring-offset-4", 
          "dark:ring-offset-zinc-950", 
          "z-[110]", 
          "relative"
        );
        return () => {
          el.classList.remove(
            "ring-[5px]", 
            "ring-yellow-400/80", 
            "dark:ring-[#E5C158]/80", 
            "ring-offset-4", 
            "dark:ring-offset-zinc-950", 
            "z-[110]", 
            "relative"
          );
        };
      }
    }
  }, [currentStep, active]);

  if (!active) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem("foundex_tour_completed", "true");
    setActive(false);
  };

  const step = steps[currentStep];
  const isCentered = !coords || coords.position === "center";

  return (
    <div className={`fixed inset-0 z-[100] bg-black/45 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${
      isCentered ? "backdrop-blur-xs pointer-events-auto" : "pointer-events-none"
    }`}>
      
      {/* Tour card container */}
      <div 
        className={`glass-card w-full max-w-sm rounded-[2rem] bg-white/95 dark:bg-zinc-950/95 border border-white/50 dark:border-white/10 p-6 shadow-2xl relative transition-all duration-300 animate-in fade-in duration-300 pointer-events-auto ${
          isCentered ? "translate-y-0 sm:scale-100" : "fixed z-[120]"
        }`}
        style={
          !isCentered && coords
            ? {
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
              }
            : undefined
        }
      >
        
        {/* Dismiss Button */}
        <button
          onClick={completeTour}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          aria-label="Skip tour"
        >
          <X className="w-5 h-5" weight="bold" />
        </button>

        {/* Tour Graphic/Icon Indicator */}
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-450 flex items-center justify-center mb-5 shrink-0">
          <RocketLaunch className="w-6 h-6 animate-pulse" weight="bold" />
        </div>

        {/* Step Content */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
            {step.title}
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
            {step.description}
          </p>
        </div>

        {/* Progress Tracker & Action Buttons Row */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-150/40 dark:border-zinc-800/40">
          
          {/* Tracker Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-4 bg-yellow-500 dark:bg-[#E5C158]"
                    : "w-1.5 bg-gray-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                aria-label="Previous step"
              >
                <CaretLeft className="w-4 h-4" weight="bold" />
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? "Get Started" : "Continue"}</span>
              <CaretRight className="w-3.5 h-3.5" weight="bold" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
