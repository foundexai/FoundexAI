"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaretLeft,
  CaretRight,
  Check,
  Compass,
  FolderOpen,
  Gauge,
  MagnifyingGlass,
  RocketLaunch,
  ArrowsLeftRight,
  CheckSquare,
  X,
} from "@phosphor-icons/react";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { cn } from "@/lib/utils";
import {
  MARGIN,
  Placement,
  SHEET_BREAKPOINT,
  TourRect,
  anchorCard,
  delay,
  prefersReducedMotion,
  rectsEqual,
  resolveTarget,
  scrollTargetIntoView,
  toRect,
  waitForSettle,
  waitForTarget,
} from "@/lib/tour";

const STORAGE_KEY = "foundex_tour_completed_v2";
const START_EVENT = "foundex:start-tour";

/** Restarts the walkthrough from anywhere in the app. */
export function startOnboardingTour() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(START_EVENT));
}

/** True when the user has already been through the walkthrough. */
export function hasCompletedOnboardingTour() {
  if (typeof window === "undefined") return true;
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  /** CSS selector; may match several nodes — the visible one wins. */
  target?: string;
  placement?: Placement;
  /** Extra breathing room around the spotlight. */
  padding?: number;
  radius?: number;
  /** Opens the mobile drawer so the target is actually on screen. */
  openMobileMenu?: boolean;
  /** Skipped entirely when the target is not on screen at this size. */
  optional?: boolean;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to FoundexAI",
    description:
      "A quick 60-second walkthrough of your workspace — where your documents, cap table, investor pipeline and readiness score live. You can leave at any point.",
    icon: RocketLaunch,
  },
  {
    id: "navigation",
    title: "Your navigation hub",
    description:
      "Everything is one click away: deal pipeline, documents, cap table, portfolio, tasks and reports. Collapse it with the arrow on its edge to widen your workspace.",
    icon: Compass,
    target: '[data-tour="sidebar-nav"]',
    placement: "right",
    padding: 6,
    radius: 18,
    openMobileMenu: true,
  },
  {
    id: "switcher",
    title: "Switch between startups",
    description:
      "Running more than one company? Swap the active profile here — the whole dashboard follows your selection.",
    icon: ArrowsLeftRight,
    target: '[data-tour="startup-switcher"]',
    placement: "bottom",
    radius: 20,
  },
  {
    id: "readiness",
    title: "Investor readiness score",
    description:
      "Your live fundability rating. Run an AI analysis to see exactly which gaps are costing you points before you pitch.",
    icon: Gauge,
    target: '[data-tour="readiness-score"]',
    placement: "left",
    radius: 20,
  },
  {
    id: "documents",
    title: "Your data room",
    description:
      "Upload your deck, financials and incorporation docs, then share them through secure expiring links and track every view.",
    icon: FolderOpen,
    target: '[data-tour="documents"]',
    placement: "right",
    radius: 20,
  },
  {
    id: "execution",
    title: "Tasks and notes",
    description:
      "Turn readiness feedback into work. Tasks and notes keep the raise moving between investor conversations.",
    icon: CheckSquare,
    target: '[data-tour="tasks"]',
    placement: "left",
    radius: 20,
  },
  {
    id: "search",
    title: "Jump anywhere",
    description:
      "Search pages, documents and investors from one place — or press ⌘K / Ctrl+K from any screen.",
    icon: MagnifyingGlass,
    target: '[data-tour="global-search"]',
    placement: "bottom",
    radius: 999,
    optional: true,
  },
  {
    id: "done",
    title: "You're all set",
    description:
      "That's the tour. Start by completing your profile and uploading your deck — your readiness score updates as you go.",
    icon: Check,
  },
];

type Phase = "initial" | "moving" | "ready";

interface Viewport {
  width: number;
  height: number;
}

const FALLBACK_CARD_HEIGHT = 260;
/** Kept constant across placements so measuring can't flip the layout mode. */
const CARD_WIDTH = 400;
const ARROW_SIZE = 14;

function readViewport(): Viewport {
  if (typeof window === "undefined") return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Grows a target rect by the step's spotlight padding. */
function inflate(rect: TourRect, step: Step): TourRect {
  const pad = step.padding ?? 10;
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

export default function OnboardingTour() {
  const { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useMobileMenu();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("initial");
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const [cardSize, setCardSize] = useState({
    width: CARD_WIDTH,
    height: FALLBACK_CARD_HEIGHT,
  });
  const [viewport, setViewport] = useState<Viewport>(readViewport);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  /** Bumped to replay the current step (breakpoint changes, target swaps). */
  const [revision, setRevision] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const targetElRef = useRef<HTMLElement | null>(null);
  const runIdRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const menuOpenedByTourRef = useRef(false);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef(false);

  // The context recreates these on every render; mirroring them into a ref stops
  // the step flow from restarting each time the drawer animates.
  const menuRef = useRef({
    isOpen: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  });
  useEffect(() => {
    menuRef.current = { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu };
    activeRef.current = active;
  });

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  /* ------------------------------------------------------------------ mount */

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  /* ------------------------------------------------------- start / restart  */

  const begin = useCallback(() => {
    directionRef.current = 1;
    setStepIndex(0);
    setTargetRect(null);
    setPhase("initial");
    setActive(true);
  }, []);

  useEffect(() => {
    const onStart = () => begin();
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [begin]);

  useEffect(() => {
    if (hasCompletedOnboardingTour()) return;
    // Let the dashboard finish its first paint and data fetches.
    const timer = setTimeout(begin, 1200);
    return () => clearTimeout(timer);
  }, [begin]);

  /* -------------------------------------------------------------- teardown  */

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* private mode — the tour simply runs again next visit */
    }
    runIdRef.current += 1;
    if (menuOpenedByTourRef.current) {
      menuRef.current.close();
      menuOpenedByTourRef.current = false;
    }
    targetElRef.current = null;
    setTargetRect(null);
    setActive(false);
    lastFocusedRef.current?.focus?.();
  }, []);

  const goTo = useCallback((next: number, direction: 1 | -1) => {
    directionRef.current = direction;
    setPhase("moving");
    setStepIndex(next);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) finish();
    else goTo(stepIndex + 1, 1);
  }, [stepIndex, finish, goTo]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) goTo(stepIndex - 1, -1);
  }, [stepIndex, goTo]);

  /* ------------------------------------------------------ viewport tracking */

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout>;
    let lastWidth = window.innerWidth;

    const onResize = () => {
      setViewport(readViewport());

      // Height-only changes are the mobile URL bar collapsing — repositioning
      // the card is enough. A width change means the layout itself moved, so
      // replay the step once the resize settles to re-scroll and re-anchor.
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (!activeRef.current) return;
        setPhase("moving");
        setRevision((r) => r + 1);
      }, 220);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  /* ---------------------------------------------------------- card measuring */

  useEffect(() => {
    if (!active) return;
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setCardSize((prev) =>
        Math.abs(prev.width - rect.width) < 0.5 &&
        Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, stepIndex]);

  /* ------------------------------------------------------------- step flow  */

  useEffect(() => {
    if (!active) return;

    const run = ++runIdRef.current;
    const stale = () => run !== runIdRef.current;
    const current = STEPS[stepIndex];
    const smooth = !reducedMotion;

    /**
     * Space the card will cover at the bottom of the viewport. Measured from
     * the live card, which already holds this step's copy because effects run
     * after commit.
     */
    const reservedBottomFor = (rect: TourRect): number => {
      const box = cardRef.current?.getBoundingClientRect();
      const card = {
        width: box?.width || CARD_WIDTH,
        height: box?.height || FALLBACK_CARD_HEIGHT,
      };
      const vp = { width: window.innerWidth, height: window.innerHeight };
      const anchorable =
        vp.width >= SHEET_BREAKPOINT &&
        anchorCard(inflate(rect, current), card, vp, current.placement) !== null;
      return anchorable ? 0 : card.height + 32;
    };

    (async () => {
      // Steps without a target are plain centred cards.
      if (!current.target) {
        if (menuOpenedByTourRef.current) {
          menuRef.current.close();
          menuOpenedByTourRef.current = false;
        }
        targetElRef.current = null;
        if (stale()) return;
        setTargetRect(null);
        setPhase("ready");
        return;
      }

      // The sidebar only exists on screen behind the drawer below `lg`.
      const needsDrawer = Boolean(current.openMobileMenu) && window.innerWidth < 1024;

      if (needsDrawer && !menuRef.current.isOpen) {
        menuOpenedByTourRef.current = true;
        menuRef.current.toggle();
        await delay(smooth ? 480 : 0);
      } else if (!needsDrawer && menuOpenedByTourRef.current) {
        menuRef.current.close();
        menuOpenedByTourRef.current = false;
        await delay(smooth ? 360 : 0);
      }
      if (stale()) return;

      const el = await waitForTarget(current.target, 2500);
      if (stale()) return;

      if (!el) {
        // Target genuinely absent at this breakpoint.
        if (current.optional) {
          const next = stepIndex + directionRef.current;
          if (next >= 0 && next < STEPS.length) {
            setStepIndex(next);
            return;
          }
        }
        targetElRef.current = null;
        setTargetRect(null);
        setPhase("ready");
        return;
      }

      targetElRef.current = el;
      const initial = toRect(el);
      setTargetRect(initial);

      scrollTargetIntoView(el, reservedBottomFor(initial), smooth);
      await waitForSettle(el, smooth ? 900 : 120);
      if (stale()) return;

      // A second pass catches lazily-loaded content that shifted the target
      // while the first scroll was still animating.
      const settled = toRect(el);
      scrollTargetIntoView(el, reservedBottomFor(settled), smooth);
      await waitForSettle(el, smooth ? 500 : 60);
      if (stale()) return;

      setTargetRect(toRect(el));
      setPhase("ready");
    })();

    return () => {
      // Invalidate any in-flight work for this step.
      if (run === runIdRef.current) runIdRef.current += 1;
    };
  }, [active, stepIndex, revision, reducedMotion]);

  /* ------------------------------------------------- follow the target live */

  useEffect(() => {
    if (!active) return;
    let frame = 0;

    const selector = STEPS[stepIndex].target;

    const tick = () => {
      const el = targetElRef.current;
      if (el) {
        const next = toRect(el);
        // A collapsed box means the node was hidden or swapped out (a breakpoint
        // change re-renders the sidebar into the other <aside>); re-resolve.
        if (!el.isConnected || (next.width < 2 && next.height < 2)) {
          const replacement = selector ? resolveTarget(selector) : null;
          targetElRef.current = replacement;
          setTargetRect(replacement ? toRect(replacement) : null);
        } else {
          setTargetRect((prev) => (rectsEqual(prev, next) ? prev : next));
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, stepIndex]);

  /* ------------------------------------------------------ keyboard + focus  */

  useEffect(() => {
    if (!active) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => cardRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep focus inside the card.
      const card = cardRef.current;
      if (!card) return;
      const focusable = card.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && (activeEl === first || activeEl === card)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [active, finish, handleNext, handlePrev]);

  /* --------------------------------------------------------------- geometry */

  const spotlight = useMemo(
    () => (targetRect ? inflate(targetRect, step) : null),
    [targetRect, step],
  );

  const anchored = useMemo(() => {
    if (!spotlight || viewport.width < SHEET_BREAKPOINT) return null;
    return anchorCard(spotlight, cardSize, viewport, step.placement);
  }, [spotlight, cardSize, viewport, step.placement]);

  const mode: "centered" | "sheet" | "anchored" = !targetRect
    ? "centered"
    : anchored
      ? "anchored"
      : "sheet";

  const cardStyle = useMemo<React.CSSProperties>(() => {
    const width = Math.min(CARD_WIDTH, viewport.width - MARGIN * 2);
    const maxHeight = viewport.height - MARGIN * 2;
    const centeredLeft = Math.max(MARGIN, (viewport.width - width) / 2);

    if (mode === "anchored" && anchored) {
      return { top: anchored.top, left: anchored.left, width, maxHeight };
    }

    if (mode === "sheet") {
      return {
        left: centeredLeft,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        width,
        maxHeight,
      };
    }

    return {
      left: centeredLeft,
      top: Math.max(MARGIN, (viewport.height - Math.min(cardSize.height, maxHeight)) / 2),
      width,
      maxHeight,
    };
  }, [mode, anchored, viewport, cardSize.height]);

  const arrowStyle = useMemo<React.CSSProperties | null>(() => {
    if (mode !== "anchored" || !anchored) return null;
    const half = ARROW_SIZE / 2;
    const along = anchored.arrow - half;

    switch (anchored.placement) {
      case "right":
        return { left: anchored.left - half, top: anchored.top + along };
      case "left":
        return {
          left: anchored.left + cardSize.width - half,
          top: anchored.top + along,
        };
      case "bottom":
        return { left: anchored.left + along, top: anchored.top - half };
      case "top":
      default:
        return {
          left: anchored.left + along,
          top: anchored.top + cardSize.height - half,
        };
    }
  }, [mode, anchored, cardSize.width, cardSize.height]);

  if (!active || typeof document === "undefined") return null;

  const Icon = step.icon;
  const motion = reducedMotion
    ? "none"
    : "top 420ms cubic-bezier(0.32,0.72,0,1), left 420ms cubic-bezier(0.32,0.72,0,1), width 420ms cubic-bezier(0.32,0.72,0,1), height 420ms cubic-bezier(0.32,0.72,0,1)";

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] overscroll-contain"
      role="presentation"
    >
      {/* Scrim: a spotlight cut-out when we have a target, flat otherwise. */}
      {spotlight ? (
        <>
          <div
            className="pointer-events-none fixed"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: step.radius ?? 20,
              boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.72)",
              transition: motion,
            }}
          />
          <div
            className="pointer-events-none fixed"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: step.radius ?? 20,
              border: "2px solid rgba(229, 193, 88, 0.9)",
              boxShadow:
                "0 0 0 4px rgba(229, 193, 88, 0.18), 0 12px 40px -8px rgba(0,0,0,0.6)",
              transition: motion,
              opacity: phase === "ready" ? 1 : 0.55,
            }}
          />
        </>
      ) : (
        <div
          className="pointer-events-auto fixed inset-0 backdrop-blur-[2px]"
          style={{ backgroundColor: "rgba(9, 9, 11, 0.72)" }}
        />
      )}

      {/* Notch pointing at the highlighted element (painted under the card) */}
      {arrowStyle && (
        <span
          aria-hidden
          className="pointer-events-none fixed rotate-45 border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0B0B0C]"
          style={{
            ...arrowStyle,
            width: ARROW_SIZE,
            height: ARROW_SIZE,
            borderRadius: 3,
            transition: reducedMotion
              ? "opacity 120ms linear"
              : `${motion}, opacity 260ms ease`,
            opacity: phase === "initial" ? 0 : 1,
          }}
        />
      )}

      {/* Tour card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        tabIndex={-1}
        className={cn(
          "pointer-events-auto fixed overflow-y-auto overscroll-contain rounded-3xl",
          "border border-gray-200 bg-white p-5 shadow-2xl outline-none",
          "dark:border-white/10 dark:bg-[#0B0B0C] sm:p-6",
        )}
        style={{
          ...cardStyle,
          transition: reducedMotion
            ? "opacity 120ms linear"
            : `${motion}, opacity 260ms ease`,
          opacity: phase === "initial" ? 0 : 1,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-[#E5C158]">
            <Icon className="h-5.5 w-5.5" weight="bold" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-zinc-500">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h3
              id="tour-title"
              className="mt-1 text-base font-black leading-snug tracking-tight text-gray-900 dark:text-white sm:text-lg"
            >
              {step.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={finish}
            aria-label="Skip the walkthrough"
            className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        <p
          id="tour-description"
          className="mt-3 text-xs font-medium leading-relaxed text-gray-500 dark:text-zinc-400 sm:text-[13px]"
        >
          {step.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-zinc-800/70">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                tabIndex={-1}
                onClick={() => goTo(idx, idx > stepIndex ? 1 : -1)}
                aria-label={`Go to step ${idx + 1}: ${s.title}`}
                aria-current={idx === stepIndex ? "step" : undefined}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                  idx === stepIndex
                    ? "w-5 bg-yellow-500 dark:bg-[#E5C158]"
                    : idx < stepIndex
                      ? "w-1.5 bg-yellow-500/40 dark:bg-[#E5C158]/40"
                      : "w-1.5 bg-gray-200 dark:bg-zinc-800",
                )}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={finish}
              className="hidden cursor-pointer px-2 text-[11px] font-bold text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-white sm:block"
            >
              Skip
            </button>

            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous step"
                className="cursor-pointer rounded-xl bg-gray-100 p-2 text-gray-700 transition-all hover:bg-gray-200 active:scale-95 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <CaretLeft className="h-4 w-4" weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <span>{isLast ? "Get started" : "Continue"}</span>
              <CaretRight className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        {`Step ${stepIndex + 1} of ${STEPS.length}: ${step.title}`}
      </span>
    </div>,
    document.body,
  );
}
