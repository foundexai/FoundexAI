/**
 * Geometry + DOM helpers powering the guided onboarding tour.
 *
 * The dashboard scrolls inside <main class="h-screen overflow-y-auto"> rather
 * than on the window, and the sidebar is rendered twice (mobile + desktop), so
 * the tour cannot rely on window.scrollTo or getElementById. Everything here is
 * written against those two facts.
 */

export type Placement = "top" | "bottom" | "left" | "right";

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CardSize {
  width: number;
  height: number;
}

export interface Anchored {
  top: number;
  left: number;
  placement: Placement;
  /** Offset of the arrow along the card edge, in px from the card's origin. */
  arrow: number;
}

/** Distance between the spotlight and the tour card. */
export const GAP = 16;
/** Minimum distance the card keeps from the viewport edge. */
export const MARGIN = 16;
/** Breakpoint below which the card becomes a bottom sheet. */
export const SHEET_BREAKPOINT = 768;

const PLACEMENT_ORDER: Placement[] = ["right", "bottom", "left", "top"];

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;

  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (Number(style.opacity) < 0.05) return false;

  // A display:none ancestor collapses the box to zero, which the size check
  // above already catches; this guards detached nodes.
  return el.isConnected;
}

/**
 * Resolves a step target. The selector may legitimately match several nodes —
 * the sidebar exists once for mobile and once for desktop — so pick the
 * candidate that is actually painted, preferring one inside the viewport's
 * horizontal band (the closed mobile drawer sits at x = -270).
 */
export function resolveTarget(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;

  let candidates: HTMLElement[];
  try {
    candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
  } catch {
    return null;
  }

  const visible = candidates.filter(isVisible);
  if (visible.length === 0) return null;
  if (visible.length === 1) return visible[0];

  const vw = window.innerWidth;
  const onScreen = visible.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.right > 0 && rect.left < vw;
  });

  return onScreen[0] ?? visible[0];
}

export function toRect(el: Element): TourRect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function rectsEqual(a: TourRect | null, b: TourRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/** Nearest scrollable ancestor, skipping the element itself. */
export function getScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const scrollable =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    if (scrollable && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

/** Fixed elements travel with the viewport — scrolling toward them is a no-op. */
export function hasFixedAncestor(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const position = window.getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Brings a target into the usable viewport band, where `reservedBottom` is the
 * space the bottom-sheet card occupies on small screens.
 */
export function scrollTargetIntoView(
  el: HTMLElement,
  reservedBottom: number,
  smooth: boolean,
): void {
  if (hasFixedAncestor(el)) return;

  const vh = window.innerHeight;
  const viewTop = MARGIN;
  const viewBottom = Math.max(viewTop + 80, vh - reservedBottom - MARGIN);
  const band = viewBottom - viewTop;

  const rect = el.getBoundingClientRect();
  const fullyVisible = rect.top >= viewTop && rect.bottom <= viewBottom;
  if (fullyVisible) return;

  // Tall targets are aligned to their top rather than centred.
  const delta =
    rect.height > band
      ? rect.top - viewTop
      : rect.top + rect.height / 2 - (viewTop + band / 2);

  if (Math.abs(delta) < 8) return;

  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
  const container = getScrollParent(el);

  if (container) {
    container.scrollBy({ top: delta, behavior });
  } else {
    window.scrollBy({ top: delta, behavior });
  }
}

/** Resolves once a matching visible element exists, or after `timeout` ms. */
export function waitForTarget(
  selector: string,
  timeout = 2000,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const found = resolveTarget(selector);
    if (found) {
      resolve(found);
      return;
    }

    const start = performance.now();
    const tick = () => {
      const el = resolveTarget(selector);
      if (el) {
        resolve(el);
      } else if (performance.now() - start > timeout) {
        resolve(null);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

/** Resolves once the element stops moving (scroll animation finished). */
export function waitForSettle(el: HTMLElement, timeout = 900): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let previous: TourRect | null = null;
    let stableFrames = 0;

    const tick = () => {
      const current = toRect(el);
      stableFrames = rectsEqual(previous, current) ? stableFrames + 1 : 0;
      previous = current;

      if (stableFrames >= 3 || performance.now() - start > timeout) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Picks the first placement whose main axis fits, then clamps the cross axis so
 * the card always stays fully on screen. Returns null when nothing fits, which
 * is the caller's signal to fall back to the bottom sheet.
 */
export function anchorCard(
  target: TourRect,
  card: CardSize,
  viewport: { width: number; height: number },
  preferred?: Placement,
): Anchored | null {
  const order = preferred
    ? [preferred, ...PLACEMENT_ORDER.filter((p) => p !== preferred)]
    : PLACEMENT_ORDER;

  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;

  for (const placement of order) {
    let top: number;
    let left: number;

    switch (placement) {
      case "right":
        left = target.left + target.width + GAP;
        if (left + card.width > viewport.width - MARGIN) continue;
        top = targetCenterY - card.height / 2;
        break;
      case "left":
        left = target.left - GAP - card.width;
        if (left < MARGIN) continue;
        top = targetCenterY - card.height / 2;
        break;
      case "bottom":
        top = target.top + target.height + GAP;
        if (top + card.height > viewport.height - MARGIN) continue;
        left = targetCenterX - card.width / 2;
        break;
      case "top":
      default:
        top = target.top - GAP - card.height;
        if (top < MARGIN) continue;
        left = targetCenterX - card.width / 2;
        break;
    }

    const horizontal = placement === "top" || placement === "bottom";

    if (horizontal) {
      if (card.width > viewport.width - MARGIN * 2) continue;
      left = clamp(left, MARGIN, viewport.width - MARGIN - card.width);
    } else {
      if (card.height > viewport.height - MARGIN * 2) continue;
      top = clamp(top, MARGIN, viewport.height - MARGIN - card.height);
    }

    const arrow = horizontal
      ? clamp(targetCenterX - left, 22, card.width - 22)
      : clamp(targetCenterY - top, 22, card.height - 22);

    return { top, left, placement, arrow };
  }

  return null;
}
