"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowsLeftRight,
  CaretLeft,
  CaretRight,
  Check,
  CheckSquare,
  Compass,
  FolderOpen,
  Gauge,
  MagnifyingGlass,
  RocketLaunch,
  X,
} from "@phosphor-icons/react";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { cn } from "@/lib/utils";
import {
  Anchored,
  MARGIN,
  Placement,
  SHEET_BREAKPOINT,
  TourRect,
  anchorCard,
  delay,
  nextFrame,
  prefersReducedMotion,
  prefersReducedTransparency,
  readSafeAreaBottom,
  resolveTarget,
  scrollTargetIntoView,
  toRect,
  waitForSettle,
  waitForTarget,
} from "@/lib/tour";
import {
  SPRING,
  Spring,
  VelocityTracker,
  projectMomentum,
  rubberband,
} from "@/lib/spring";

const STORAGE_KEY = "foundex_tour_completed_v2";
const LEGACY_STORAGE_KEY = "foundex_tour_completed";
const START_EVENT = "foundex:start-tour";

/** Restarts the walkthrough from anywhere in the app. */
export function startOnboardingTour() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(START_EVENT));
}

/** True when the user has already been through the walkthrough. */
export function hasCompletedOnboardingTour() {
  if (typeof window === "undefined") return true;
  try {
    return Boolean(
      localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY),
    );
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

type Mode = "centered" | "anchored" | "sheet";

interface Viewport {
  width: number;
  height: number;
}

/** Kept constant across placements so measuring can't flip the layout mode. */
const CARD_WIDTH = 400;
const ARROW_SIZE = 14;
const SCRIM_ALPHA = 0.72;
const CARD_BLUR = 24;
/** Scale the card materialises from, so it arrives rather than just fading. */
const ENTER_SCALE = 0.94;
/** Movement before a sheet drag commits, so a tap is never stolen. */
const DRAG_THRESHOLD = 10;
/** Fraction of the card the projected release must clear to dismiss. */
const DISMISS_RATIO = 0.4;
/**
 * Deceleration used to project where a release is heading. Lower than the 0.998
 * of scroll momentum, because a sheet must not fly away on a nudge: tuned so a
 * deliberate ~450px/s flick clears the threshold from a standing start, while a
 * 250px/s drift settles back.
 */
const DISMISS_DECELERATION = 0.9953;

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

/**
 * Every animated value the frame loop owns. Keeping these out of React state is
 * the point: the loop writes transforms straight to the DOM, so travelling
 * between steps costs zero re-renders and stays interruptible mid-flight.
 */
function createSprings() {
  return {
    spotX: new Spring(0, SPRING.move),
    spotY: new Spring(0, SPRING.move),
    spotW: new Spring(0, SPRING.move),
    spotH: new Spring(0, SPRING.move),
    cardX: new Spring(0, SPRING.move),
    cardY: new Spring(0, SPRING.move),
    /** Drives opacity, scale and backdrop blur together as one material. */
    material: new Spring(0, SPRING.material),
    ring: new Spring(0, SPRING.material),
    placed: false,
  };
}

type Springs = ReturnType<typeof createSprings>;

/** The notch stays glued to the card edge, so it is placed from the live card. */
function arrowPoint(
  anchor: Anchored,
  cardW: number,
  cardH: number,
  x: number,
  y: number,
) {
  const half = ARROW_SIZE / 2;
  switch (anchor.placement) {
    case "right":
      return { x: x - half, y: y + anchor.arrow - half };
    case "left":
      return { x: x + cardW - half, y: y + anchor.arrow - half };
    case "bottom":
      return { x: x + anchor.arrow - half, y: y - half };
    case "top":
    default:
      return { x: x + anchor.arrow - half, y: y + cardH - half };
  }
}

export default function OnboardingTour() {
  const {
    isOpen: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  } = useMobileMenu();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("centered");
  const [viewport, setViewport] = useState<Viewport>(readViewport);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [reducedTransparency, setReducedTransparency] = useState(
    prefersReducedTransparency,
  );
  /** Bumped to replay the current step (breakpoint changes, target swaps). */
  const [revision, setRevision] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  const targetElRef = useRef<HTMLElement | null>(null);
  const springsRef = useRef<Springs | null>(null);
  const runIdRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const placementRef = useRef<Placement | undefined>(undefined);
  const modeRef = useRef<Mode>("centered");
  const safeBottomRef = useRef(0);
  const menuOpenedByTourRef = useRef(false);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const exitRef = useRef({ active: false, fly: false });
  const dragRef = useRef({
    pointerId: -1,
    startY: 0,
    offset: 0,
    dragging: false,
  });
  const velocityRef = useRef(new VelocityTracker());

  // Mirrors of render state the frame loop and gesture handlers read. Kept in
  // refs so neither is torn down and restarted on every step change.
  const stepIndexRef = useRef(0);
  const activeRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const reducedTransparencyRef = useRef(false);
  const completeRef = useRef<() => void>(() => {});
  const menuRef = useRef({
    isOpen: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  });

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const getSprings = useCallback((): Springs => {
    if (!springsRef.current) springsRef.current = createSprings();
    return springsRef.current;
  }, []);

  /* ------------------------------------------------------------- mirroring  */

  const teardown = useCallback(() => {
    targetElRef.current = null;
    springsRef.current = null;
    exitRef.current = { active: false, fly: false };
    dragRef.current = { pointerId: -1, startY: 0, offset: 0, dragging: false };
    setActive(false);
    lastFocusedRef.current?.focus?.();
  }, []);

  useEffect(() => {
    menuRef.current = {
      isOpen: isMenuOpen,
      toggle: toggleMenu,
      close: closeMenu,
    };
    stepIndexRef.current = stepIndex;
    activeRef.current = active;
    reducedMotionRef.current = reducedMotion;
    reducedTransparencyRef.current = reducedTransparency;
    completeRef.current = teardown;
  });

  /* -------------------------------------------------------- user preferences */

  useEffect(() => {
    if (!window.matchMedia) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const transparency = window.matchMedia(
      "(prefers-reduced-transparency: reduce)",
    );
    const onMotion = () => setReducedMotion(motion.matches);
    const onTransparency = () => setReducedTransparency(transparency.matches);
    motion.addEventListener("change", onMotion);
    transparency.addEventListener("change", onTransparency);
    return () => {
      motion.removeEventListener("change", onMotion);
      transparency.removeEventListener("change", onTransparency);
    };
  }, []);

  /* ------------------------------------------------------- start / restart  */

  const begin = useCallback(() => {
    springsRef.current = null;
    exitRef.current = { active: false, fly: false };
    dragRef.current = { pointerId: -1, startY: 0, offset: 0, dragging: false };
    targetElRef.current = null;
    placementRef.current = STEPS[0].placement;
    modeRef.current = "centered";
    directionRef.current = 1;
    safeBottomRef.current = readSafeAreaBottom();
    setMode("centered");
    setStepIndex(0);
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

  /**
   * Starts the exit. The card leaves along the path it arrived on (scale and
   * fade), or continues downward when a swipe threw it there.
   */
  const beginExit = useCallback((fly = false) => {
    if (exitRef.current.active) return;
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* private mode — the tour simply runs again next visit */
    }
    runIdRef.current += 1;
    exitRef.current = { active: true, fly };
    if (menuOpenedByTourRef.current) {
      menuRef.current.close();
      menuOpenedByTourRef.current = false;
    }
  }, []);

  const goTo = useCallback((next: number, direction: 1 | -1) => {
    directionRef.current = direction;
    placementRef.current = STEPS[next].placement;
    // A step change is not a momentum gesture: back to the graceful spring.
    springsRef.current?.cardX.configure(SPRING.move);
    springsRef.current?.cardY.configure(SPRING.move);
    setStepIndex(next);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) beginExit();
    else goTo(stepIndex + 1, 1);
  }, [stepIndex, beginExit, goTo]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) goTo(stepIndex - 1, -1);
  }, [stepIndex, goTo]);

  /* ------------------------------------------------------ viewport tracking */

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout>;
    let lastWidth = window.innerWidth;

    const onResize = () => {
      setViewport(readViewport());

      // Height-only changes are the mobile URL bar collapsing — the frame loop
      // already repositions for that. A width change moved the layout itself,
      // so replay the step once the resize settles to re-scroll and re-anchor.
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        // Measuring the safe area touches the DOM, so it waits for the settle
        // rather than running on every resize event of a drag.
        safeBottomRef.current = readSafeAreaBottom();
        if (!activeRef.current) return;
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

  /* ------------------------------------------------------------- step flow  */

  useEffect(() => {
    if (!active) return;

    const run = ++runIdRef.current;
    const stale = () => run !== runIdRef.current;
    const current = STEPS[stepIndex];
    const smooth = !reducedMotion;

    /** Space the card covers at the bottom, measured from the live card. */
    const reservedBottom = (): number => {
      if (modeRef.current !== "sheet") return 0;
      return (cardRef.current?.offsetHeight ?? 260) + 32;
    };

    (async () => {
      // Steps without a target are plain centred cards.
      if (!current.target) {
        if (menuOpenedByTourRef.current) {
          menuRef.current.close();
          menuOpenedByTourRef.current = false;
        }
        targetElRef.current = null;
        return;
      }

      // The sidebar only exists on screen behind the drawer below `lg`.
      const needsDrawer =
        Boolean(current.openMobileMenu) && window.innerWidth < 1024;

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
        return;
      }

      // Handing the loop the element is enough: the spotlight and card spring
      // toward it and keep tracking it through the scroll that follows.
      targetElRef.current = el;
      await nextFrame();
      if (stale()) return;

      scrollTargetIntoView(el, reservedBottom(), smooth);
      await waitForSettle(el, smooth ? 900 : 120);
      if (stale()) return;

      // A second pass catches lazily-loaded content that shifted the target
      // while the first scroll was still animating.
      scrollTargetIntoView(el, reservedBottom(), smooth);
    })();

    return () => {
      // Invalidate any in-flight work for this step.
      if (run === runIdRef.current) runIdRef.current += 1;
    };
  }, [active, stepIndex, revision, reducedMotion]);

  /* ------------------------------------------------------------ frame loop  */

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;

      const card = cardRef.current;
      const spot = spotRef.current;
      if (!card || !spot) return;

      const springs = getSprings();
      const still = reducedMotionRef.current;
      const exiting = exitRef.current.active;
      const current = STEPS[stepIndexRef.current];

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;

      /* 1. Where is the target right now? */
      let box: TourRect | null = null;
      let el = targetElRef.current;

      if (el && current.target) {
        const rect = toRect(el);
        // React can swap the node out from under us — a breakpoint change
        // re-renders the sidebar into the other <aside>. Re-resolve rather
        // than losing the spotlight until the next replay.
        if (!el.isConnected || (rect.width < 2 && rect.height < 2)) {
          el = resolveTarget(current.target);
          targetElRef.current = el;
        }
      }

      if (el && el.isConnected) {
        const rect = toRect(el);
        if (rect.width >= 2 || rect.height >= 2) box = inflate(rect, current);
      }

      /* 2. Layout mode and the card's destination. */
      let nextMode: Mode;
      let anchor: Anchored | null = null;
      let destX: number;
      let destY: number;

      if (!box) {
        nextMode = "centered";
        destX = (vw - cardW) / 2;
        destY = (vh - cardH) / 2;
      } else {
        // Passing the current placement back in gives hysteresis: it only
        // flips when it genuinely stops fitting, never mid-flight.
        anchor =
          vw >= SHEET_BREAKPOINT
            ? anchorCard(
                box,
                { width: cardW, height: cardH },
                { width: vw, height: vh },
                placementRef.current,
              )
            : null;

        if (anchor) {
          nextMode = "anchored";
          placementRef.current = anchor.placement;
          destX = anchor.left;
          destY = anchor.top;
        } else {
          nextMode = "sheet";
          destX = Math.max(MARGIN, (vw - cardW) / 2);
          destY = vh - cardH - MARGIN - safeBottomRef.current;
        }
      }

      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }

      /* 3. Targets. With no target the spotlight closes where it stands, so
            the scrim never cuts abruptly between steps. */
      const spotBox = box ?? {
        left: springs.spotX.value + springs.spotW.value / 2,
        top: springs.spotY.value + springs.spotH.value / 2,
        width: 0,
        height: 0,
      };

      springs.spotX.setTarget(spotBox.left);
      springs.spotY.setTarget(spotBox.top);
      springs.spotW.setTarget(spotBox.width);
      springs.spotH.setTarget(spotBox.height);
      springs.cardX.setTarget(destX);
      springs.cardY.setTarget(exitRef.current.fly ? vh + cardH : destY);
      springs.ring.setTarget(box ? 1 : 0);
      springs.material.setTarget(exiting ? 0 : 1);

      /* 4. First frame places without flying in from the origin. */
      if (!springs.placed) {
        springs.placed = true;
        springs.spotX.snap(spotBox.left);
        springs.spotY.snap(spotBox.top);
        springs.spotW.snap(spotBox.width);
        springs.spotH.snap(spotBox.height);
        springs.cardX.snap(destX);
        springs.cardY.snap(destY);
        springs.ring.snap(box ? 1 : 0);
        // material is deliberately left at 0 so the card materialises in.
      }

      /* 5. Advance. Reduced motion keeps the cross-fade but drops the travel. */
      if (still) {
        springs.spotX.snap(spotBox.left);
        springs.spotY.snap(spotBox.top);
        springs.spotW.snap(spotBox.width);
        springs.spotH.snap(spotBox.height);
        springs.cardX.snap(destX);
        springs.cardY.snap(exitRef.current.fly ? vh + cardH : destY);
        springs.ring.snap(box ? 1 : 0);
        springs.material.setTarget(exiting ? 0 : 1);
        springs.material.step(dt);
      } else {
        springs.spotX.step(dt);
        springs.spotY.step(dt);
        springs.spotW.step(dt);
        springs.spotH.step(dt);
        springs.cardX.step(dt);
        springs.cardY.step(dt);
        springs.ring.step(dt);
        springs.material.step(dt);
      }

      /* 6. Write the frame. Position is transform-only so it stays on the
            compositor; the spotlight's box is what carries the scrim. */
      const m = springs.material.value;
      const drag = dragRef.current.offset;
      const scale = ENTER_SCALE + (1 - ENTER_SCALE) * m;

      card.style.transform = `translate3d(${springs.cardX.value.toFixed(2)}px, ${(
        springs.cardY.value + drag
      ).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      card.style.opacity = m.toFixed(3);

      if (!reducedTransparencyRef.current) {
        // Blur and scale move together, so the surface reads as a real
        // material arriving rather than a flat rectangle fading up.
        const blur = `saturate(180%) blur(${(m * CARD_BLUR).toFixed(1)}px)`;
        card.style.backdropFilter = blur;
        card.style.setProperty("-webkit-backdrop-filter", blur);
      }

      const spotTransform = `translate3d(${springs.spotX.value.toFixed(2)}px, ${springs.spotY.value.toFixed(2)}px, 0)`;
      const spotW = `${Math.max(0, springs.spotW.value).toFixed(2)}px`;
      const spotH = `${Math.max(0, springs.spotH.value).toFixed(2)}px`;

      spot.style.transform = spotTransform;
      spot.style.width = spotW;
      spot.style.height = spotH;
      spot.style.boxShadow = `0 0 0 9999px rgba(9, 9, 11, ${(SCRIM_ALPHA * m).toFixed(3)})`;

      const ring = ringRef.current;
      if (ring) {
        ring.style.transform = spotTransform;
        ring.style.width = spotW;
        ring.style.height = spotH;
        ring.style.opacity = (springs.ring.value * m).toFixed(3);
      }

      const arrow = arrowRef.current;
      if (arrow) {
        if (anchor) {
          const point = arrowPoint(
            anchor,
            cardW,
            cardH,
            springs.cardX.value,
            springs.cardY.value + drag,
          );
          arrow.style.transform = `translate3d(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px, 0) rotate(45deg)`;
          arrow.style.opacity = m.toFixed(3);
        } else {
          arrow.style.opacity = "0";
        }
      }

      /* 7. The exit owns its own completion. */
      if (exiting && m < 0.01) {
        cancelAnimationFrame(frame);
        completeRef.current();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, getSprings]);

  /* --------------------------------------------------- swipe-to-dismiss     */

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (modeRef.current !== "sheet" || exitRef.current.active) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const card = cardRef.current;
    if (!card) return;
    // Controls keep working, and the card's own scroll wins while it has room.
    if ((event.target as HTMLElement).closest("button")) return;
    if (card.scrollTop > 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      offset: 0,
      dragging: false,
    };
    velocityRef.current.reset();
    velocityRef.current.add(event.clientY, event.timeStamp);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const delta = event.clientY - drag.startY;
    if (!drag.dragging) {
      // Hysteresis, so a tap on the card is never mistaken for a drag.
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      cardRef.current?.setPointerCapture(event.pointerId);
    }

    velocityRef.current.add(event.clientY, event.timeStamp);
    // Downward tracks the finger exactly; upward resists instead of stopping.
    drag.offset = delta >= 0 ? delta : -rubberband(-delta, window.innerHeight);
  }, []);

  const onPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;

      const { dragging, offset } = drag;
      dragRef.current = {
        pointerId: -1,
        startY: 0,
        offset: 0,
        dragging: false,
      };
      if (!dragging) return;

      const springs = springsRef.current;
      if (!springs) return;

      const velocity = velocityRef.current.get();
      const cardH = cardRef.current?.offsetHeight ?? 0;

      // Fold the live drag into the spring and hand it the release velocity, so
      // there is no seam between the finger and the animation that follows.
      springs.cardY.value += offset;
      springs.cardY.velocity = velocity;
      springs.cardY.configure(SPRING.momentum);

      // Land where the flick is going, not where the finger happened to stop.
      const projected =
        offset + projectMomentum(velocity, DISMISS_DECELERATION);
      if (projected > cardH * DISMISS_RATIO) beginExit(true);
    },
    [beginExit],
  );

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
        beginExit();
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
  }, [active, beginExit, handleNext, handlePrev]);

  /* --------------------------------------------------------------- render   */

  const cardWidth = useMemo(
    () => Math.min(CARD_WIDTH, viewport.width - MARGIN * 2),
    [viewport.width],
  );

  if (!active || typeof document === "undefined") return null;

  const Icon = step.icon;
  const isSheet = mode === "sheet";

  return createPortal(
    <div className="fixed inset-0 z-[2147483000]" role="presentation">
      {/* Spotlight: the element's own box is the hole, its shadow is the scrim */}
      <div
        ref={spotRef}
        className="pointer-events-none fixed left-0 top-0"
        style={{
          borderRadius: step.radius ?? 20,
          transition: "border-radius 300ms ease",
          willChange: "transform, width, height",
          boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0)",
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 opacity-0"
        style={{
          borderRadius: step.radius ?? 20,
          transition: "border-radius 300ms ease",
          willChange: "transform, width, height, opacity",
          border: "2px solid rgba(229, 193, 88, 0.9)",
          boxShadow:
            "0 0 0 4px rgba(229, 193, 88, 0.16), 0 12px 40px -8px rgba(0, 0, 0, 0.6)",
        }}
      />

      {/* Notch, painted before the card so the card's edge hides its inner half */}
      <span
        ref={arrowRef}
        aria-hidden
        className="tour-surface pointer-events-none fixed left-0 top-0 border border-gray-200/80 opacity-0 dark:border-white/10"
        style={{
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          borderRadius: 3,
          willChange: "transform, opacity",
        }}
      />

      {/* Tour card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        tabIndex={-1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={cn(
          "tour-surface pointer-events-auto fixed left-0 top-0 overflow-y-auto",
          "overscroll-contain rounded-[26px] border border-gray-200/80 p-5",
          "shadow-[0_24px_70px_-16px_rgba(0,0,0,0.45)] outline-none",
          "dark:border-white/10 sm:p-6",
        )}
        style={{
          width: cardWidth,
          maxHeight: viewport.height - MARGIN * 2,
          opacity: 0,
          touchAction: isSheet ? "none" : undefined,
          willChange: "transform, opacity",
        }}
      >
        {/* Grabber: the affordance that says this sheet can be thrown away */}
        {isSheet && (
          <div
            aria-hidden
            className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15 dark:bg-white/25"
          />
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/12 text-yellow-600 dark:text-[#E5C158]">
            <Icon className="h-5.5 w-5.5" weight="bold" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase text-gray-500 dark:text-zinc-400"
              style={{ letterSpacing: "0.16em" }}
            >
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h3
              id="tour-title"
              className="mt-1 text-[17px] font-black text-gray-900 dark:text-white sm:text-[19px]"
              style={{ letterSpacing: "-0.015em", lineHeight: 1.25 }}
            >
              {step.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => beginExit()}
            aria-label="Skip the walkthrough"
            className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-[transform,color,background-color] duration-100 ease-out hover:bg-gray-100 hover:text-gray-700 active:scale-90 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        <p
          id="tour-description"
          className="mt-3 text-[13px] font-medium text-gray-600 dark:text-zinc-300"
          style={{ lineHeight: 1.62 }}
        >
          {step.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200/70 pt-4 dark:border-white/10">
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
                  "h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-300 ease-out",
                  idx === stepIndex
                    ? "w-5 bg-yellow-500 dark:bg-[#E5C158]"
                    : idx < stepIndex
                      ? "w-1.5 bg-yellow-500/45 dark:bg-[#E5C158]/45"
                      : "w-1.5 bg-gray-300 dark:bg-white/20",
                )}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => beginExit()}
              className="hidden cursor-pointer px-2 text-[11px] font-bold text-gray-500 transition-[transform,color] duration-100 ease-out hover:text-gray-900 active:scale-95 dark:text-zinc-400 dark:hover:text-white sm:block"
            >
              Skip
            </button>

            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous step"
                className="cursor-pointer rounded-xl bg-gray-100 p-2 text-gray-700 transition-[transform,background-color] duration-100 ease-out hover:bg-gray-200 active:scale-[0.94] dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
              >
                <CaretLeft className="h-4 w-4" weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-black text-white shadow-md transition-[transform,background-color] duration-100 ease-out hover:bg-zinc-800 active:scale-[0.96] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
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
