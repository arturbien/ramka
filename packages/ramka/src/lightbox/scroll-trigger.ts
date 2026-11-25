/**
 * The moments at which the active trigger can be scrolled into view:
 * - `onChange` — the active index changes while open (navigation)
 * - `onOpenComplete` — the open transition finishes (page is covered + locked,
 *   so this reposition is invisible; recommended with `instant`)
 * - `onClose` — just before the close morph runs
 */
type ScrollTriggerMoment = 'onChange' | 'onOpenComplete' | 'onClose';

/** Alignment passed through to `Element.scrollIntoView`. */
type ScrollTriggerAlign = ScrollLogicalPosition;

/** Passed to {@link ScrollTriggerOption.reveal}. */
interface ScrollTriggerRevealDetails<Payload = unknown> {
  /** `itemId` of the active item, whose trigger is not mounted. */
  itemId: string;
  /** Viewer index of the active item. */
  index: number;
  /** Payload of the current open. */
  payload: Payload | undefined;
  /** The moment that asked for the trigger. */
  reason: ScrollTriggerMoment;
  /** Aborts when a newer navigation, open or close supersedes this one. */
  signal: AbortSignal;
}

/**
 * Return a Promise to make the close wait for it (e.g. until a virtualizer has
 * rendered the row). Return `false` when the trigger can't be revealed, so the
 * close doesn't wait at all.
 */
type ScrollTriggerReveal<Payload = unknown> = (
  details: ScrollTriggerRevealDetails<Payload>,
) => void | false | Promise<unknown>;

interface ScrollTriggerOption<Payload = unknown> {
  type: ScrollTriggerMoment;
  behavior?: 'smooth' | 'instant';
  /**
   * Vertical alignment for `scrollIntoView`.
   * @default 'nearest'
   */
  block?: ScrollTriggerAlign;
  /**
   * Inline-axis alignment for `scrollIntoView`. Use `'center'` for
   * variable-width horizontal strips with scroll-snap so a narrow tile
   * isn't re-snapped back to a wider sibling after a minimal `nearest` nudge.
   *
   * Logical, not physical: the browser mirrors it, so `'start'` is the left
   * edge under `dir="ltr"` and the right edge under `dir="rtl"`.
   * @default 'nearest'
   */
  inline?: ScrollTriggerAlign;
  /**
   * Called instead of `scrollIntoView` when the trigger isn't mounted — a
   * virtualized list unmounted its row. Bring the row back here, e.g.
   * `virtualizer.scrollToIndex(row)`; `behavior`, `block` and `inline` don't
   * apply, since your code does the scrolling.
   *
   * On an `onClose` option, the close morph waits up to a few frames for the
   * revealed trigger to mount and stop moving, then morphs into it (or fades
   * out if it never appears). Scroll instantly there: a smooth scroll is
   * still moving when the wait ends.
   */
  reveal?(details: ScrollTriggerRevealDetails<Payload>): void | false | Promise<unknown>;
}

/** Single option, an array of options, or `null` to disable. */
type ScrollTriggerIntoView<Payload = unknown> = null | ScrollTriggerOption<Payload> | ScrollTriggerOption<Payload>[];

interface ResolvedScrollTrigger {
  behavior: ScrollBehavior;
  block: ScrollTriggerAlign;
  inline: ScrollTriggerAlign;
  reveal?: ScrollTriggerReveal;
}

/**
 * Resolve the scroll config for a given moment, or `null` when that moment
 * isn't enabled. Accepts both the single-object and array config forms so
 * `scrollTriggerIntoView={{ type: 'onChange' }}` and
 * `scrollTriggerIntoView={[{ type: 'onChange' }, { type: 'onOpenComplete' }]}`
 * both work.
 */
function resolveScrollTriggerOption(
  config: ScrollTriggerIntoView | undefined,
  moment: ScrollTriggerMoment,
): ResolvedScrollTrigger | null {
  if (!config) return null;
  const options = Array.isArray(config) ? config : [config];
  const match = options.find((option) => option.type === moment);
  if (!match) return null;
  return {
    behavior: match.behavior ?? 'smooth',
    block: match.block ?? 'nearest',
    inline: match.inline ?? 'nearest',
    reveal: match.reveal,
  };
}

function scrollTriggerEl(
  el: HTMLElement | undefined,
  options: ResolvedScrollTrigger = { behavior: 'smooth', block: 'nearest', inline: 'nearest' },
) {
  if (!el) return;
  // Defaults (`nearest` / `nearest`) only scroll when needed and honor CSS
  // `scroll-margin`/`scroll-padding` (sticky header clearance). Consumers set
  // `block` / `inline` on `scrollTriggerIntoView` options when a different
  // alignment is required (e.g. `inline: 'center'` for horizontal snap strips).
  //
  // We deliberately do NOT gate this on a manual getBoundingClientRect check:
  // that check measures against the raw viewport (top >= 0), so it considers a
  // trigger occluded by a sticky header "fully visible" and skips the scroll.
  // IntersectionObserver can't fix this either — v1 is purely geometric (same
  // blind spot) and v2's occlusion-aware `isVisible` is Chromium-only, async,
  // and expensive, so unusable for a synchronous cross-browser decision here.
  el.scrollIntoView({
    block: options.block,
    inline: options.inline,
    behavior: options.behavior,
  });
}

/**
 * The index whose trigger a close lands on. `closest` searches outward from
 * the active item, the earlier one first on a tie, so every open Trigger can
 * ask without scanning the gallery.
 */
function resolveTriggerIndex(
  activeIndex: number,
  morphTo: 'active' | 'origin' | 'closest',
  openingIndex: number,
  hasTrigger: (index: number) => boolean,
  itemCount: number,
): number {
  if (morphTo === 'origin') return openingIndex;
  if (morphTo === 'active' || hasTrigger(activeIndex)) return activeIndex;
  for (let d = 1; activeIndex - d >= 0 || activeIndex + d < itemCount; d += 1) {
    if (hasTrigger(activeIndex - d)) return activeIndex - d;
    if (hasTrigger(activeIndex + d)) return activeIndex + d;
  }
  return activeIndex;
}

export { resolveScrollTriggerOption, scrollTriggerEl, resolveTriggerIndex };
export type {
  ScrollTriggerIntoView,
  ScrollTriggerOption,
  ScrollTriggerReveal,
  ScrollTriggerRevealDetails,
  ScrollTriggerMoment,
  ScrollTriggerAlign,
  ResolvedScrollTrigger,
};
