'use client';

import * as React from 'react';

import {
  LightboxContext,
  LightboxStableContext,
  type LightboxCloseOptions,
  type LightboxContextValue,
  type LightboxMorphSlice,
  type LightboxSlidesBridgeSlice,
  type LightboxStableContextValue,
  type LightboxStateSlice,
  type NavigationSource,
} from './lightbox-context';
import { createLightboxStore, hotStateEqual, type LightboxHotState, type LightboxStore } from './lightbox-store';
import {
  LightboxActiveZoomContext,
  LightboxZoomPublishContext,
  type ActiveZoomControls,
  type LightboxZoomPublishContextValue,
  type PublishActiveZoom,
} from './lightbox-zoom-context';
import {
  bindLightboxHandle,
  getHandleTrigger,
  notifyLightboxHandle,
  unbindLightboxHandle,
  type LightboxHandle,
  type LightboxHandleHost,
  type LightboxHandleOpenOptions,
  type LightboxHandleTriggerRegistration,
} from './lightbox-handle';
import {
  getMorphRuntimeSync,
  loadMorphRuntime,
  prefetchMorphRuntime,
  type MorphRuntime,
} from './lightbox-morph-loader';
import { prefetchZoomRuntime } from './lightbox-zoom-loader';
import {
  resolveScrollTriggerOption,
  resolveTriggerIndex,
  scrollTriggerEl,
  type ScrollTriggerIntoView,
} from './scroll-trigger';
import { isAndroidBlinkSnapshotRoot } from './is-android-blink';
import { findDestinationMorphTarget } from './morph-target';
import { shouldYieldBeforeCapture } from './vt-capture-yield';
import { scheduleWarmUp } from './schedule-warm-up';
import { DEFAULT_DECODE_MAX_WAIT, isLowEndDevice, supportsViewTransitions } from './vt-constants';
import type { LightboxViewTransitionPreset } from './vt-timing';
import type { ViewTransitionMorph, ViewTransitionMorphConfig } from './use-view-transition-morph';
import type { TextDirection } from './lightbox-direction';

/** Values handed to Root's render-function `children`. */
interface LightboxRootRenderState<Payload = unknown> {
  /**
   * Payload of the current open — from the opening Trigger's `payload` prop or
   * `handle.open({ payload })`. Kept after close until the next open, so the
   * close transition still renders the same items. `undefined` until the
   * first payload-carrying open.
   */
  payload: Payload | undefined;
}

/** Passed to {@link LightboxRootProps.revealTrigger}. */
interface LightboxRevealTriggerDetails<Payload = unknown> {
  /** `itemId` of the active item, whose trigger is not mounted. */
  itemId: string;
  /** Viewer index of the active item. */
  index: number;
  /** Payload of the current open. */
  payload: Payload | undefined;
  /**
   * `'close'` — the lightbox is closing and the morph needs the trigger.
   * `'change'` — navigation settled while open and `scrollTriggerIntoView`
   * asks for `onChange` (only then is this called while open).
   */
  reason: 'close' | 'change';
  /** Aborts when a newer open/close supersedes this close. */
  signal: AbortSignal;
}

/**
 * Return a Promise to make the close wait for it (e.g. until a virtualizer has
 * rendered the row). Return `false` when the trigger can't be revealed, so the
 * close doesn't wait at all.
 */
type LightboxRevealTrigger<Payload = unknown> = (
  details: LightboxRevealTriggerDetails<Payload>,
) => void | false | Promise<unknown>;

interface LightboxRootProps<Payload = unknown> {
  /**
   * Lightbox parts and page content (triggers typically live as children of
   * Root). Pass a function to render the viewer from the open's `payload` —
   * the shape for one Root serving many galleries through keyed Triggers.
   */
  children?: React.ReactNode | ((state: LightboxRootRenderState<Payload>) => React.ReactNode);
  /**
   * Imperative handle from `Lightbox.createHandle()`. Pass the same handle to
   * detached `Lightbox.Trigger`s outside this Root.
   */
  handle?: LightboxHandle<Payload>;
  /**
   * Bring an unmounted keyed trigger back so the close morph has somewhere to
   * land — for triggers inside a virtualized list, whose rows unmount when
   * they scroll away. Called with the active item's `itemId` when the close
   * target has no mounted trigger. Scroll the row that holds the item into
   * view here, e.g. `virtualizer.scrollToIndex(row)`.
   *
   * - On close (`reason: 'close'`) the morph waits for the trigger to mount
   *   and its position to settle, up to a few frames, then morphs (or fades
   *   if it never mounts). Return a Promise to wait for your own signal
   *   instead (bound it yourself; `signal` aborts if a newer open/close
   *   wins), or `false` when the item can't be revealed, to skip the wait.
   * - While open (`reason: 'change'`) it is called after navigation settles,
   *   only when `scrollTriggerIntoView` includes `onChange` — the same
   *   moments Root scrolls a mounted trigger into view.
   *
   * Without view transitions nothing waits: the trigger is revealed and
   * focus returns to it once it mounts. Use `behavior: 'instant'` scrolling;
   * a smooth scroll outlasts the wait. Only keyed Triggers (`itemId`) are
   * revealed.
   */
  revealTrigger?: LightboxRevealTrigger<Payload>;
  /**
   * Payload for a Root that starts open (`defaultOpen` / controlled `open`) —
   * a deep link rendered from the URL. Later opens set the payload from the
   * opening Trigger or `handle.open({ payload })`. Pair with `defaultValue`
   * (or `value`) for the item's index, e.g.
   * `payload.images.findIndex((image) => image.id === params.photo)`.
   */
  defaultPayload?: Payload;
  /** Uncontrolled initial open state. @default false */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /**
   * Called when open state changes (immediately, before enter/exit
   * animations finish). Prefer this for syncing URL state or stores.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Called when the open/close transition settles. Receives `true` after
   * open completes, `false` after close completes. Prefer this for cleanup
   * and focus management.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Uncontrolled initial active index. @default 0 */
  defaultValue?: number;
  /** Controlled active index. */
  value?: number;
  /**
   * Callback when active index changes. `metadata.itemId` is the new active
   * item's `itemId` when it has one — the stable key to write to a URL.
   */
  onValueChange?: (value: number, metadata: { source: NavigationSource; itemId?: string }) => void;
  /**
   * Total number of items, used until the mounted `Lightbox.Item`s have
   * registered themselves. Registration happens in effects, which never run
   * during server rendering — so a page that server-renders an open lightbox
   * paints `Lightbox.Counter` as "n / 0" (and boundary-disables
   * `Lightbox.Next` / `Lightbox.Previous` when `loop` is off) until
   * hydration. Pass the item total to make that first paint correct. Once
   * any item mounts the live registry takes over and this prop is ignored,
   * so it can't drift from the real count.
   */
  count?: number;
  /** Wrap navigation at boundaries. @default false */
  loop?: boolean;
  /**
   * Reading direction. `'rtl'` mirrors slide navigation, thumbnail-strip
   * travel, and the horizontal arrow keys (so `ArrowLeft` advances).
   *
   * Setting this is enough on its own: the direction is written to the
   * `Lightbox.Portal` host as a `dir` attribute, so CSS follows it across the
   * portal boundary even though the host mounts on `document.body`. That also
   * makes it the way to run one RTL lightbox inside an otherwise-LTR page.
   *
   * Pass it whenever the surrounding UI is RTL, including in an app that is
   * already RTL end to end (`dir="rtl"` on `<html>`) — behavior falls back to
   * `'ltr'` without it, and navigation would run against the layout. Omitting
   * it writes no attribute at all, so such an app still *lays out* RTL by
   * inheritance; in development that disagreement logs a warning.
   * @default 'ltr' (behavior); no `dir` attribute is written when omitted
   */
  dir?: TextDirection;
  /**
   * Morph between trigger and lightbox item via the View Transitions API.
   * On by default: clicking a trigger morphs into the fullscreen item, and
   * close morphs back. The morph engine is loaded on first use — pass `false`
   * to skip that download. Falls back to a plain fade when unsupported, when
   * prefers-reduced-motion is set, or on low-end devices.
   *
   * Pass a preset name to pick the morph's motion (duration + easing):
   * - `"default"` — 360ms, sheet curve with a tamed launch (same as `true`)
   * - `"snappy"` — 340ms, hotter launch; reads quicker
   * - `"relaxed"` — 400ms, softer launch and longer settle
   * - `"spring"` — 450ms, critically damped spring; Photos-style settle
   *
   * Timing is preset-based (not free-form CSS) on purpose: each preset is
   * vetted on-device to stay smooth and skip-safe on iOS Safari (including
   * Low Power Mode) and Android, where arbitrary curves stutter or teleport.
   * The chosen timing drives the morph, the crossfade and the root fade
   * together so they always stay in sync.
   * @default true
   */
  viewTransition?: boolean | LightboxViewTransitionPreset;
  /**
   * Scroll the active trigger element into the viewport so close
   * animations land on-screen instead of animating off-viewport.
   *
   * Accepts a single option or an array of options, so you can combine the
   * moments below. Per option:
   * - `behavior` — `"smooth"` (default) or `"instant"`
   * - `block` / `inline` — `scrollIntoView` alignment (`"nearest"` default).
   *   Use `inline: "center"` for horizontal snap strips with variable-width tiles.
   *
   * - `null` (default) — no automatic scrolling
   * - `{ type: "onChange" }` — scroll to the trigger the close morph will land
   *   on whenever the active index changes while the lightbox is open
   *   (preemptive; respects `morphTo`, so `closest` scrolls the nearest
   *   registered trigger when the active index has none)
   * - `{ type: "onOpenComplete" }` — scroll to that same trigger once the open
   *   transition finishes. The viewer covers the page and scroll is locked, so
   *   this reposition is invisible — it only pays off by ensuring the close
   *   morph lands on-screen without a jump when the trigger was partially
   *   off-screen at open time. `"instant"` recommended.
   * - `{ type: "onClose" }` — scroll to that trigger just before the close
   *   morph runs (visible reposition at close start)
   *
   * @example
   * // Trigger is always positioned for the close morph, with no visible jump:
   * scrollTriggerIntoView={[
   *   { type: 'onChange', behavior: 'instant' },
   *   { type: 'onOpenComplete', behavior: 'instant' },
   * ]}
   *
   * @example
   * // Horizontal media strip — center so snap doesn't pull back to a wider sibling:
   * scrollTriggerIntoView={[
   *   { type: 'onChange', behavior: 'instant', inline: 'center' },
   *   { type: 'onOpenComplete', behavior: 'instant', inline: 'center' },
   * ]}
   *
   * @default null
   */
  scrollTriggerIntoView?: ScrollTriggerIntoView;
  /**
   * Controls which trigger receives the View Transition morph on close.
   *
   * - `'active'` (default) — morph to the trigger matching the current
   *   active index. No morph if no trigger exists for that index.
   * - `'origin'` — always morph back to the trigger that originally
   *   opened the lightbox, regardless of which item is active.
   * - `'closest'` — morph to the trigger at the active index if it
   *   exists, otherwise fall back to the nearest registered trigger.
   *
   * @default 'active'
   */
  morphTo?: 'active' | 'origin' | 'closest';
  /**
   * How long the open morph waits for the destination image to decode
   * before starting, so the lightbox doesn't flash empty space while the
   * full-size image is still loading.
   *
   * - `true` (default) — wait up to ~200ms, then start regardless.
   * - `false` — don't wait; start the transition immediately. Useful when
   *   the trigger image doubles as a placeholder for the lightbox item so
   *   there is nothing to wait for.
   * - `number` — wait up to this many milliseconds. The morph starts as
   *   soon as the image decodes (or is served from cache), or when the
   *   timeout elapses — whichever comes first.
   *
   * Runs after the lightbox is prepared (mounted hidden) and before
   * `onBeforeOpen`. Only relevant when `viewTransition` is enabled.
   * @default true
   */
  awaitImageDecode?: boolean | number;
  /**
   * Called after the open morph has prepared the lightbox (mounted, still
   * hidden) and finished any `awaitImageDecode` wait, and **before** the View
   * Transition starts. Use this to await custom media readiness (iframe
   * `load`, video `loadeddata`, WebGL, …).
   *
   * May return a Promise — the morph waits for it. Bound your own timeout
   * inside the callback; there is no library-imposed cap. When a newer
   * open/close supersedes this one, `ctx.signal` aborts.
   *
   * Only relevant when `viewTransition` is enabled. Skipped when unset.
   *
   * @example
   * // Wait for a Maps iframe (and skip the image decode wait):
   * <Lightbox.Root
   *   awaitImageDecode={false}
   *   onBeforeOpen={async ({ signal }) => {
   *     await waitForIframe(mapRef.current, { signal, timeoutMs: 1500 });
   *   }}
   * />
   */
  onBeforeOpen?: LightboxBeforeOpen;
  /**
   * Called synchronously just before close commits — and, when View
   * Transitions are on, **before** the old snapshot is captured. Use this
   * to freeze custom media (`video.pause()`, stop a rAF loop, …) so the
   * close morph isn’t a mid-frame.
   *
   * Unlike `onBeforeOpen`, this cannot delay close (return values are
   * ignored). Skipped when unset.
   */
  onBeforeClose?: LightboxBeforeClose;
}

/** Context passed to {@link LightboxRootProps.onBeforeOpen}. */
interface LightboxBeforeOpenContext {
  /** Capture destination (Stage `morphRef` / Media / item `morphRef` / item), if any. */
  destination: Element | null;
  /** Aborts when a newer open/close wins. */
  signal: AbortSignal;
}

/** Return a Promise to delay the open View Transition until media is ready. */
type LightboxBeforeOpen = (ctx: LightboxBeforeOpenContext) => void | Promise<void>;

/** Context passed to {@link LightboxRootProps.onBeforeClose}. */
interface LightboxBeforeCloseContext {
  /** Capture destination (Stage `morphRef` / Media / item `morphRef` / item), if any. */
  destination: Element | null;
}

/** Runs synchronously before the close snapshot / fade. Cannot delay close. */
type LightboxBeforeClose = (ctx: LightboxBeforeCloseContext) => void;

/**
 * Waits for the currently-running animations on `el` to finish, then invokes
 * `onSettled` — but only while `gen` is still the current generation, so a
 * superseding open/close aborts a stale settle callback. When `el` is absent
 * there is nothing to animate, so `onSettled` runs synchronously.
 *
 * This is the shared "let the consumer's enter/exit CSS transition play out,
 * then act" primitive used by both the non-VT paths in `setOpen` and the
 * external-sync effect below.
 */
function runAfterAnimations(
  el: HTMLElement | null,
  gen: number,
  genRef: React.MutableRefObject<number>,
  onSettled: () => void,
): void {
  if (!el) {
    onSettled();
    return;
  }
  Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => {
    if (genRef.current === gen) onSettled();
  });
}

/**
 * Frames a close waits for `revealTrigger` to mount a trigger and for its
 * position to settle (~130ms at 60Hz) — long enough for a virtualizer to
 * scroll, render and re-measure a row, short enough that a miss reads as a
 * slightly late fade rather than a hang.
 */
const REVEAL_TRIGGER_MAX_FRAMES = 8;
/** Consecutive frames a revealed trigger's rect must hold before the morph reads it. */
const REVEAL_TRIGGER_STABLE_FRAMES = 2;

function sameRect(a: DOMRect, b: DOMRect): boolean {
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/**
 * Most recently mounted connected registration, preferring `preferred` (the
 * trigger that opened the lightbox) — a message can render the same image
 * twice, e.g. a reply quote.
 */
function pickTriggerRegistration(
  regs: LightboxHandleTriggerRegistration[] | undefined,
  preferred: HTMLElement | null,
): LightboxHandleTriggerRegistration | null {
  let pick: LightboxHandleTriggerRegistration | null = null;
  if (!regs) return pick;
  for (let i = regs.length - 1; i >= 0; i -= 1) {
    const reg = regs[i]!;
    if (!reg.element?.isConnected) continue;
    if (reg.element === preferred) return reg;
    pick ??= reg;
  }
  return pick;
}

function LightboxRoot<Payload = unknown>(props: LightboxRootProps<Payload>) {
  const {
    children,
    handle: handleProp,
    revealTrigger,
    defaultPayload,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    onOpenChangeComplete,
    defaultValue = 0,
    value: valueProp,
    onValueChange,
    count,
    loop = false,
    dir: dirProp,
    viewTransition = true,
    scrollTriggerIntoView = null,
    morphTo = 'active',
    awaitImageDecode = true,
    onBeforeOpen,
    onBeforeClose,
  } = props;

  // Behavior always needs a concrete direction; the attribute is only written
  // when the consumer asked for one. Defaulting the attribute to `'ltr'` would
  // pin the portal LTR and break an app that sets `dir="rtl"` on <html> and
  // relies on inheritance — the omitted case has to stay silent in the DOM.
  const dir: TextDirection = dirProp ?? 'ltr';

  const onBeforeOpenRef = React.useRef(onBeforeOpen);
  React.useEffect(() => {
    onBeforeOpenRef.current = onBeforeOpen;
  }, [onBeforeOpen]);

  const onBeforeCloseRef = React.useRef(onBeforeClose);
  React.useEffect(() => {
    onBeforeCloseRef.current = onBeforeClose;
  }, [onBeforeClose]);

  /** Aborts an in-flight `onBeforeOpen` when a newer open/close starts. */
  const beforeOpenAbortRef = React.useRef<AbortController | null>(null);

  // Resolve the decode-wait budget: `false`/`0` disables the wait,
  // `true` uses the default cap, and a number sets an explicit cap (ms).
  const decodeMaxWait =
    awaitImageDecode === false
      ? 0
      : awaitImageDecode === true
        ? DEFAULT_DECODE_MAX_WAIT
        : Math.max(0, awaitImageDecode);

  // Open state — controlled or uncontrolled
  const isControlledOpen = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = isControlledOpen ? openProp : uncontrolledOpen;

  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const onOpenChangeCompleteRef = React.useRef(onOpenChangeComplete);
  React.useEffect(() => {
    onOpenChangeCompleteRef.current = onOpenChangeComplete;
  }, [onOpenChangeComplete]);

  // Active index — controlled or uncontrolled
  const isControlledValue = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const activeIndex = isControlledValue ? valueProp : uncontrolledValue;

  // Same-commit direction (not a post-paint effect) so Slides' data-direction
  // matches the index that just changed — including controlled `value` updates
  // that never go through `setActiveIndex`.
  const [navMeta, setNavMeta] = React.useState<{
    index: number;
    direction: 'forward' | 'backward';
  }>({ index: activeIndex, direction: 'forward' });
  let direction = navMeta.direction;
  if (activeIndex !== navMeta.index) {
    direction = activeIndex > navMeta.index ? 'forward' : 'backward';
    setNavMeta({ index: activeIndex, direction });
  }

  const onValueChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Set by a scroller while a user scroll/fling is in flight (see context).
  const navigationLockedRef = React.useRef(false);

  const setActiveIndex = React.useCallback(
    (index: number, source: NavigationSource) => {
      // A user swipe/fling owns the position while it's in flight: a browser
      // fling can't be cancelled from JS, so discrete navigation that lands
      // mid-scroll is dropped (not queued) to keep the marker and the actual
      // scroll position from ever diverging. Swipe-derived (`scroll`) updates
      // and opening (`trigger`) always pass.
      if (navigationLockedRef.current && (source === 'keyboard' || source === 'thumbnail' || source === 'button')) {
        return;
      }
      if (!isControlledValue) {
        setUncontrolledValue(index);
      }
      const itemId = itemIdByIndexRef.current.get(index);
      onValueChangeRef.current?.(index, itemId === undefined ? { source } : { source, itemId });
    },
    [isControlledValue],
  );

  // Scroll the close-morph trigger into view when the active index changes
  // *while already open* (preemptive, so the destination trigger is on-screen
  // for the close morph). Respects `morphTo`: `closest` scrolls the nearest
  // registered trigger when the active index has none. This must NOT fire on
  // the open→true edge: nothing changed yet — the lightbox just opened — and
  // the clicked trigger is the open morph's origin, so scrolling it would
  // move the morph's start point and jump the page mid-open. We therefore
  // only scroll on a real index change between two consecutive open states
  // (also skipping no-op re-renders where the index is unchanged). The close
  // path scrolls the morph-target trigger into view on its own, so opening
  // never needs to.
  //
  // Idle-debounce: swipe / thumbnail-strip scrub can change the index many times per
  // second. Scrolling the page under the modal on every tick janks the viewer;
  // only the resting index matters for the close morph.
  const scrollSyncRef = React.useRef({ open, activeIndex });
  const scrollSyncTimerRef = React.useRef(0);
  // Read through a ref, NOT an effect dep: `scrollTriggerIntoView` is
  // typically an inline literal (both JSDoc examples above are), so its
  // identity changes on every consumer render. With it in the deps, any
  // consumer re-render that lands inside the 120ms debounce re-ran the
  // effect — the cleanup cancelled the pending timer and the same-index
  // early return never rescheduled it. Controlled URL-sync consumers hit
  // that on EVERY change: the history write triggers a router re-render
  // milliseconds after the index commit, so the scroll silently never fired.
  // The ref keeps the effect keyed to real state edges only; the config is
  // resolved at fire time, so late config changes are honored too.
  const scrollTriggerIntoViewRef = React.useRef(scrollTriggerIntoView);
  // Assigned in an effect (not during render) so an interrupted concurrent
  // render can't publish a config no committed render produced. Declared
  // BEFORE the scroll effect: effects run in declaration order within a
  // commit, so a schedule-time read below always sees this commit's config.
  React.useEffect(() => {
    scrollTriggerIntoViewRef.current = scrollTriggerIntoView;
  });
  React.useEffect(() => {
    const prev = scrollSyncRef.current;
    scrollSyncRef.current = { open, activeIndex };
    const wantsScroll = !!resolveScrollTriggerOption(scrollTriggerIntoViewRef.current, 'onChange');
    if (!wantsScroll) return;
    if (!open) return;
    if (!prev.open || prev.activeIndex === activeIndex) return;

    window.clearTimeout(scrollSyncTimerRef.current);
    const index = activeIndex;
    scrollSyncTimerRef.current = window.setTimeout(() => {
      if (!scrollSyncRef.current.open || scrollSyncRef.current.activeIndex !== index) return;
      const scroll = resolveScrollTriggerOption(scrollTriggerIntoViewRef.current, 'onChange');
      if (!scroll) return;
      // A keyed gallery whose close target scrolled out of a virtualized list:
      // ask the consumer to bring it back rather than scrolling nothing.
      if (!resolveCloseTriggerElement()) {
        requestRevealTrigger('change', new AbortController().signal);
        return;
      }
      const idx = resolveTriggerIndex(index, morphTo, openingTriggerIndexRef.current, triggerElementsRef.current);
      scrollTriggerEl(triggerElementsRef.current.get(idx), scroll);
    }, 120);

    return () => window.clearTimeout(scrollSyncTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphTo, open, activeIndex]);

  // Item registry — tracks mounted items so count can grow and shrink
  const registeredItemsRef = React.useRef(new Set<number>());
  const [itemCount, setItemCount] = React.useState(0);

  const registerItem = React.useCallback((index: number) => {
    registeredItemsRef.current.add(index);
    setItemCount(registeredItemsRef.current.size);
    return () => {
      registeredItemsRef.current.delete(index);
      setItemCount(registeredItemsRef.current.size);
    };
  }, []);

  // Until the first item registers — registration is an effect, so it never
  // happens during server rendering or the hydration render — fall back to
  // the `count` prop. This is what lets an SSR-open page paint Counter and
  // Next/Previous with the real total instead of 0. The registry wins the
  // moment it has anything in it, so a stale prop can't outlive hydration.
  const effectiveItemCount = itemCount > 0 ? itemCount : (count ?? 0);

  // Stable id prefix for this lightbox instance. Used to mint matching
  // `tab` / `tabpanel` ids in Thumbnail / Item so their `aria-controls` /
  // `aria-labelledby` association is wired automatically (see context).
  const baseId = React.useId();

  // Tablist presence — drives whether items are `tabpanel`s (a thumbnail
  // tablist owns them) or standalone carousel slides. Ref-counted so several
  // (or zero) ThumbnailGroups resolve correctly.
  const tablistCountRef = React.useRef(0);
  const [hasTablist, setHasTablist] = React.useState(false);
  const registerTablist = React.useCallback(() => {
    tablistCountRef.current += 1;
    setHasTablist(true);
    return () => {
      tablistCountRef.current = Math.max(0, tablistCountRef.current - 1);
      if (tablistCountRef.current === 0) setHasTablist(false);
    };
  }, []);

  // Caption registry — ref-based to avoid creating new Map objects and
  // triggering re-renders on every item mount. LightboxCaption subscribes
  // via useSyncExternalStore, so it reads the ref reactively (updating on
  // register/unregister or a changed caption) without Root re-rendering.
  const captionsRef = React.useRef(new Map<number, React.ReactNode>());
  const captionListenersRef = React.useRef(new Set<() => void>());

  const subscribeCaptions = React.useCallback((onChange: () => void) => {
    captionListenersRef.current.add(onChange);
    return () => {
      captionListenersRef.current.delete(onChange);
    };
  }, []);

  const registerCaption = React.useCallback((index: number, caption: React.ReactNode) => {
    captionsRef.current.set(index, caption);
    captionListenersRef.current.forEach((listener) => listener());
    return () => {
      captionsRef.current.delete(index);
      captionListenersRef.current.forEach((listener) => listener());
    };
  }, []);

  // Portal mount state — stays true during exit animations so elements
  // remain in the DOM for CSS transitions (non-VT) and for the Android
  // Chrome VT close hold (`preparing` until `finished`).
  //
  // Initialized from the resolved open value (controlled prop or
  // `defaultOpen`) so a lightbox rendered with `open={true}` on first
  // mount is visible immediately instead of flashing closed for a
  // tick before the sync effect catches up.
  const [mounted, setMounted] = React.useState(() => (isControlledOpen ? Boolean(openProp) : defaultOpen));
  // Hidden-but-mounted flag: VT open pre-mount and VT close hold
  // (see `commitPrepare` / `commitReveal` / `commitClose`). Never true
  // for an initially-open lightbox.
  const [preparing, setPreparing] = React.useState(false);
  const closeGenRef = React.useRef(0);

  // Focus-visibility hint for the trigger that regains focus on close, set by
  // the current close's `setOpen(false, { focusVisible })` and consumed once by
  // `focusReturnTarget`. `undefined` = defer to the browser heuristic. See
  // LightboxCloseOptions; mirrors Base UI's close-modality-driven return focus.
  const closeFocusVisibleRef = React.useRef<boolean | undefined>(undefined);
  // Restore focus to the close target, honoring the pending focus-visible hint
  // (keyboard close → ring; pointer/touch close → no ring). Resets the hint so
  // it never leaks into a later close. `focusVisible` is a standard focus()
  // option not yet in TS's FocusOptions; browsers without support ignore it.
  // `itemId` the close landed on, for re-resolving return focus when its
  // trigger unmounted (or remounted as a new element) during the close.
  const closeFocusItemIdRef = React.useRef<string | null>(null);
  const focusReturnTarget = React.useCallback((target: HTMLElement | null | undefined) => {
    let el = target?.isConnected ? target : null;
    const closeItemId = closeFocusItemIdRef.current;
    if (!el && closeItemId !== null) {
      const origin = openingTriggerElementRef.current;
      el =
        (
          pickTriggerRegistration(keyedTriggersRef.current.get(closeItemId), origin) ??
          pickTriggerRegistration(overflowTriggersRef.current.get(closeItemId), origin)
        )?.element ?? null;
    }
    if (!el && openingTriggerElementRef.current?.isConnected) el = openingTriggerElementRef.current;
    closeFocusItemIdRef.current = null;
    // Don't pin a row the virtualizer already removed until the next open.
    if (!openingTriggerElementRef.current?.isConnected) {
      openingTriggerElementRef.current = null;
      openingTriggerImageRef.current = null;
    }
    if (!el) {
      closeFocusVisibleRef.current = undefined;
      return;
    }
    const options: FocusOptions & { focusVisible?: boolean } = { preventScroll: true };
    if (closeFocusVisibleRef.current !== undefined) {
      options.focusVisible = closeFocusVisibleRef.current;
    }
    closeFocusVisibleRef.current = undefined;
    el.focus(options);
  }, []);

  // Open-transition lifecycle, observed by `Lightbox.Item` so it can hold its
  // morph placeholder until the open morph is fully done (see the placeholder
  // effect in lightbox-item). `openTransitionPendingRef` is true from the
  // start of an open until it settles; `openCompleteListenersRef` holds the
  // items currently waiting for that settle.
  const openTransitionPendingRef = React.useRef(false);
  const openCompleteListenersRef = React.useRef<Set<() => void>>(new Set());
  const subscribeOpenComplete = React.useCallback((listener: () => void) => {
    openCompleteListenersRef.current.add(listener);
    return () => {
      openCompleteListenersRef.current.delete(listener);
    };
  }, []);
  // Mark the open transition settled and release every waiting placeholder.
  // Called both when an open finishes and when a close starts (so a
  // placeholder gated on an interrupted open isn't left waiting forever).
  const settleOpenTransition = React.useCallback(() => {
    openTransitionPendingRef.current = false;
    openCompleteListenersRef.current.forEach((listener) => listener());
  }, []);

  // Document scroll lock, owned here in Root rather than in Lightbox.Content.
  // During VT close the portal stays mounted (paint-suppressed) until
  // `finished`, but `open` flips false immediately — a lock tied to Content's
  // open lifecycle would still release too early. Root holds the lock until
  // handleCloseComplete / post-exit-animation unmount. Imperative +
  // idempotent so open/close paths can acquire/release at explicit points.
  const scrollLockCleanupRef = React.useRef<(() => void) | null>(null);
  const selectionGuardCleanupRef = React.useRef<(() => void) | null>(null);
  // iOS Safari can select the page behind an open lightbox during zoomed
  // tap→pan. Disable selection on the document for the lock's lifetime.
  //
  // Separate from lockScroll because `user-select` is an INHERITED property:
  // writing it on <html> invalidates computed style for every element — a
  // whole-document restyle (~60ms at 20k elements, in every engine; WebKit
  // has no fast path at all). The VT open path therefore defers this write
  // until the morph has finished (handleOpenComplete) instead of paying it
  // inside the transition's capture window. The guard exists for the open
  // steady state; gestures during the morph itself are already swallowed by
  // the VT touch guard.
  //
  // Touch devices only. The failure this guards against is touch-driven —
  // WebKit's touch handling starting a selection on the page behind the
  // overlay during the morph or a zoomed tap→pan. A mouse can't reach that
  // page: the fullscreen overlay captures the pointer. Touch-free devices
  // therefore skip the write (and both restyles it costs) entirely.
  // `maxTouchPoints` rather than `(pointer: coarse)`, which reports only the
  // primary pointer and would miss hybrids — touchscreen laptops, iPads with
  // a trackpad — where touch selection is still possible.
  const applySelectionGuard = React.useCallback(() => {
    // Only while the scroll lock is held — a deferred application must not
    // land after an interrupted open already unlocked.
    if (selectionGuardCleanupRef.current || !scrollLockCleanupRef.current) return;
    if (typeof document === 'undefined') return;
    const canTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
    if (!canTouch) return;
    const html = document.documentElement;
    const originalUserSelect = html.style.userSelect;
    const originalWebkitUserSelect = html.style.getPropertyValue('-webkit-user-select');
    html.style.userSelect = 'none';
    html.style.setProperty('-webkit-user-select', 'none');
    selectionGuardCleanupRef.current = () => {
      html.style.userSelect = originalUserSelect;
      if (originalWebkitUserSelect) {
        html.style.setProperty('-webkit-user-select', originalWebkitUserSelect);
      } else {
        html.style.removeProperty('-webkit-user-select');
      }
    };
  }, []);
  const lockScroll = React.useCallback(
    (options?: { deferSelectionGuard?: boolean }) => {
      if (scrollLockCleanupRef.current || typeof document === 'undefined') return;
      const html = document.documentElement;
      const body = document.body;
      // Width freed when the classic scrollbar disappears under
      // `overflow: hidden`. Compensate with body padding so locking doesn't
      // shift page content sideways. Zero on overlay-scrollbar platforms
      // (mobile / macOS overlay), so this is a no-op there.
      //
      // `padding-inline-end` rather than `padding-right`: the gutter sits on
      // whichever side the scrollbar does, which is the inline-end edge in both
      // reading directions.
      const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
      const originalOverflow = html.style.overflow;
      const originalPaddingInlineEnd = body.style.paddingInlineEnd;
      html.style.overflow = 'hidden';
      // NOTE: do NOT set `scrollbar-width: none` on <html> here to hide the
      // fading iOS overlay scroll indicator during the open morph. It works —
      // but restoring it on unlock permanently destroys the tab's page
      // scrollbar on iOS: WebKit implements `none` by tearing down the native
      // scroller layer and never re-attaches it when switching back
      // (https://bugs.webkit.org/show_bug.cgi?id=282419). The state lives on
      // the tab's native scroll view, so it survives reloads — only a new tab
      // recovers. The macOS scroller was fixed (WebKit/WebKit#36030); the iOS
      // one was not. Revisit if the iOS fix ships.
      if (scrollbarWidth > 0) {
        const currentPadding = parseFloat(window.getComputedStyle(body).paddingInlineEnd) || 0;
        body.style.paddingInlineEnd = `${currentPadding + scrollbarWidth}px`;
      }
      scrollLockCleanupRef.current = () => {
        html.style.overflow = originalOverflow;
        body.style.paddingInlineEnd = originalPaddingInlineEnd;
      };
      if (!options?.deferSelectionGuard) applySelectionGuard();
    },
    [applySelectionGuard],
  );
  const unlockScroll = React.useCallback(() => {
    selectionGuardCleanupRef.current?.();
    selectionGuardCleanupRef.current = null;
    scrollLockCleanupRef.current?.();
    scrollLockCleanupRef.current = null;
  }, []);

  // Tracks the most recent open value that internal setOpen has
  // claimed responsibility for. When the derived `open` differs from
  // this ref, the change came from outside (e.g. a controlled prop
  // mutated by something other than Lightbox.Trigger / Close /
  // createHandle) and the sync effect below needs to mount or
  // unmount the portal manually.
  const lastInternalOpenRef = React.useRef(open);

  // View transition refs
  const triggerElementsRef = React.useRef<Map<number, HTMLElement>>(new Map());
  // Trigger element → its designated morph descendant (via the trigger
  // render-prop's `morphRef`). Keyed by element so it's correct even
  // when several triggers share an index. See findTriggerMorphTarget.
  const triggerMorphElementsRef = React.useRef<WeakMap<HTMLElement, HTMLElement>>(new WeakMap());
  const activeItemElementRef = React.useRef<HTMLElement | null>(null);
  // Item element → its designated morph descendant (via the item render-prop's
  // `morphRef`, else its `imageRef`). Keyed by element. See
  // findItemMorphTarget.
  const itemMorphElementsRef = React.useRef<WeakMap<HTMLElement, HTMLElement>>(new WeakMap());
  // Shared capture destination from Stage `morphRef`. When set, the VT
  // names this node instead of the active item (see findDestinationMorphTarget).
  const destinationMorphElementRef = React.useRef<HTMLElement | null>(null);
  const notifyBeforeClose = React.useCallback(() => {
    onBeforeCloseRef.current?.({
      destination: findDestinationMorphTarget(
        activeItemElementRef.current,
        itemMorphElementsRef.current,
        destinationMorphElementRef.current,
      ),
    });
  }, []);
  const openingTriggerIndexRef = React.useRef(0);
  const openingTriggerElementRef = React.useRef<HTMLElement | null>(null);
  const openingTriggerImageRef = React.useRef<HTMLImageElement | null>(null);
  const triggerImageElementsRef = React.useRef<Map<number, HTMLImageElement>>(new Map());
  const triggerIdsRef = React.useRef<
    Map<
      string,
      {
        id: string;
        index: number;
        element: HTMLElement | null;
        image: HTMLImageElement | null;
      }
    >
  >(new Map());
  // ── Keyed galleries (Trigger/Item `itemId`) ─────────────────────────────
  // One Root can serve many galleries whose triggers all register at once
  // (every image in a chat feed) and collide on index. Keyed triggers never
  // write the index maps above directly: they register by `itemId`, and only
  // the ones whose `itemId` matches a MOUNTED item are joined into
  // `triggerElementsRef` / `triggerImageElementsRef` at that item's index.
  // So the maps only ever describe the open gallery, and every reader — the
  // morph engine, `closest`, placeholders, scroll-into-view, focus return —
  // stays index-based and unchanged.
  const itemIndexByIdRef = React.useRef(new Map<string, number>());
  const itemIdByIndexRef = React.useRef(new Map<number, string>());
  const keyedTriggersRef = React.useRef(new Map<string, LightboxHandleTriggerRegistration[]>());
  // Triggers standing in for items they don't show (a "+N" tile's hidden
  // images, via `overflowItemIds`): the fallback when an item has no trigger
  // of its own. They take the morph but never lend their image as the item's
  // placeholder — it's a different photo.
  const overflowTriggersRef = React.useRef(new Map<string, LightboxHandleTriggerRegistration[]>());
  // Indexes whose joined trigger is such a stand-in (no image of its own).
  const standInTriggerIndexesRef = React.useRef(new Set<number>());
  // What the join wrote per index, so it only ever removes its own entries.
  const keyedWritesRef = React.useRef(new Map<number, { element: HTMLElement; image: HTMLImageElement | null }>());
  // `itemId` an open is waiting on: resolved to an index when that item mounts.
  const pendingOpenItemIdRef = React.useRef<string | null>(null);
  // `itemId` of the keyed trigger that opened the lightbox, so a remount of
  // that row (virtualizer churn) re-adopts the new element as the origin.
  const openingItemIdRef = React.useRef<string | null>(null);

  // Keyed Triggers (handle-bound or in the Root tree) subscribe here; a bound
  // handle's listeners are notified alongside.
  const keyedListenersRef = React.useRef(new Set<() => void>());
  const notifyKeyed = React.useCallback(() => {
    keyedListenersRef.current.forEach((listener) => listener());
    if (handleProp) notifyLightboxHandle(handleProp);
  }, [handleProp]);
  const subscribeKeyed = React.useCallback((listener: () => void) => {
    keyedListenersRef.current.add(listener);
    return () => {
      keyedListenersRef.current.delete(listener);
    };
  }, []);
  // Item registrations during one commit (a gallery mounting) notify once:
  // from Root's layout effect, which runs after every descendant's, or a
  // microtask when the commit didn't re-render Root.
  const keyedNotifyPendingRef = React.useRef(false);
  const notifyKeyedRef = React.useRef(notifyKeyed);
  notifyKeyedRef.current = notifyKeyed;
  const flushKeyedNotify = React.useCallback(() => {
    if (!keyedNotifyPendingRef.current) return;
    keyedNotifyPendingRef.current = false;
    notifyKeyedRef.current();
  }, []);
  const scheduleKeyedNotify = React.useCallback(() => {
    if (keyedNotifyPendingRef.current) return;
    keyedNotifyPendingRef.current = true;
    queueMicrotask(flushKeyedNotify);
  }, [flushKeyedNotify]);

  const syncKeyedIndex = React.useCallback((index: number) => {
    const written = keyedWritesRef.current.get(index);
    if (written) {
      if (triggerElementsRef.current.get(index) === written.element) {
        triggerElementsRef.current.delete(index);
      }
      if (written.image && triggerImageElementsRef.current.get(index) === written.image) {
        triggerImageElementsRef.current.delete(index);
      }
      keyedWritesRef.current.delete(index);
      standInTriggerIndexesRef.current.delete(index);
    }
    const itemId = itemIdByIndexRef.current.get(index);
    if (itemId === undefined) return;
    const origin = openingTriggerElementRef.current;
    const own = pickTriggerRegistration(keyedTriggersRef.current.get(itemId), origin);
    const pick = own ?? pickTriggerRegistration(overflowTriggersRef.current.get(itemId), origin);
    if (!pick?.element) return;
    const image = own ? pick.image : null;
    triggerElementsRef.current.set(index, pick.element);
    if (pick.morphElement) {
      triggerMorphElementsRef.current.set(pick.element, pick.morphElement);
    } else {
      triggerMorphElementsRef.current.delete(pick.element);
    }
    if (image) triggerImageElementsRef.current.set(index, image);
    if (own) {
      standInTriggerIndexesRef.current.delete(index);
    } else {
      standInTriggerIndexesRef.current.add(index);
    }
    keyedWritesRef.current.set(index, { element: pick.element, image });
  }, []);

  const syncKeyedItem = React.useCallback(
    (itemId: string) => {
      const index = itemIndexByIdRef.current.get(itemId);
      if (index !== undefined) syncKeyedIndex(index);
    },
    [syncKeyedIndex],
  );

  const dialogElementRef = React.useRef<HTMLElement | null>(null);
  const stageElementRef = React.useRef<HTMLElement | null>(null);
  const backdropElementRef = React.useRef<HTMLElement | null>(null);
  const slidesViewportRef = React.useRef<HTMLElement | null>(null);
  const slidesGeometryRef = React.useRef({
    offsets: [] as number[],
    base: 0,
    step: 1,
    count: 0 as number,
  });
  const slidesViewportListenersRef = React.useRef(new Set<() => void>());
  const subscribeSlidesViewport = React.useCallback((listener: () => void) => {
    slidesViewportListenersRef.current.add(listener);
    return () => {
      slidesViewportListenersRef.current.delete(listener);
    };
  }, []);
  const notifySlidesViewport = React.useCallback(() => {
    slidesViewportListenersRef.current.forEach((listener) => listener());
  }, []);
  const thumbnailStripSelectRef = React.useRef<((index: number, source: NavigationSource) => void) | null>(null);
  const navigate = React.useCallback(
    (index: number, source: NavigationSource) => {
      const stripSelect = thumbnailStripSelectRef.current;
      if (stripSelect) stripSelect(index, source);
      else setActiveIndex(index, source);
    },
    [setActiveIndex],
  );
  const activeIndexRef = React.useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const openRef = React.useRef(open);
  openRef.current = open;
  const morphToRef = React.useRef(morphTo);
  morphToRef.current = morphTo;

  // Payload of the current open (Trigger `payload` / `handle.open({ payload })`).
  // Set in the opening event, so it commits in the same synchronous flush as
  // the hidden pre-mount and the items it describes exist before capture.
  const [payload, setPayload] = React.useState<Payload | undefined>(() => defaultPayload);
  const payloadRef = React.useRef<Payload | undefined>(defaultPayload);
  const setOpenPayload = React.useCallback((next: unknown) => {
    payloadRef.current = next as Payload;
    setPayload(() => next as Payload);
  }, []);

  // Layout timing: a close in the same task as a prop change must see it.
  const revealTriggerRef = React.useRef(revealTrigger);
  React.useLayoutEffect(() => {
    revealTriggerRef.current = revealTrigger;
  }, [revealTrigger]);

  // The connected trigger the close morph would land on right now, if any.
  const resolveCloseTriggerElement = React.useCallback((): HTMLElement | null => {
    const idx = resolveTriggerIndex(
      activeIndexRef.current,
      morphToRef.current,
      openingTriggerIndexRef.current,
      triggerElementsRef.current,
    );
    const el = triggerElementsRef.current.get(idx);
    return el?.isConnected ? el : null;
  }, []);

  // Ask the consumer to remount the active item's keyed trigger. `null` when
  // nothing was requested (no handler, the active item isn't keyed, or the
  // handler returned `false`); otherwise what the handler returned.
  const requestRevealTrigger = React.useCallback(
    (reason: 'close' | 'change', signal: AbortSignal): { wait: Promise<unknown> | null } | null => {
      const reveal = revealTriggerRef.current;
      if (!reveal) return null;
      const index = activeIndexRef.current;
      const itemId = itemIdByIndexRef.current.get(index);
      if (itemId === undefined) return null;
      const result = reveal({ itemId, index, payload: payloadRef.current, reason, signal });
      if (result === false) return null;
      return { wait: result && typeof result.then === 'function' ? result : null };
    },
    [],
  );

  // Connected registration for an item, its own trigger first, then a "+N"
  // stand-in. `image` is only the trigger's own.
  const findKeyedTrigger = React.useCallback(
    (itemId: string): { element: HTMLElement; image: HTMLImageElement | null } | null => {
      const origin = openingTriggerElementRef.current;
      const own = pickTriggerRegistration(keyedTriggersRef.current.get(itemId), origin);
      if (own?.element) return { element: own.element, image: own.image };
      const standIn = pickTriggerRegistration(overflowTriggersRef.current.get(itemId), origin);
      return standIn?.element ? { element: standIn.element, image: null } : null;
    },
    [],
  );

  // --- Active-zoom bridge ---
  // The active slide's Lightbox.Zoom publishes its controls here so a single
  // set of global zoom controls (and Content's pull/keyboard logic) can drive
  // whichever slide is active. `activeZoom` is reactive (buttons re-render on
  // enabled-state changes); `activeZoomRef` mirrors it for imperative,
  // always-fresh reads.
  const [activeZoom, setActiveZoom] = React.useState<ActiveZoomControls | null>(null);
  const activeZoomRef = React.useRef<ActiveZoomControls | null>(null);
  React.useEffect(() => {
    activeZoomRef.current = activeZoom;
  }, [activeZoom]);

  // Functional-updater form lets the publishing Zoom guard its own cleanup by
  // identity, so a slide swap (new Zoom publishes, old Zoom's cleanup runs)
  // never nulls out the incoming controls regardless of effect ordering.
  const publishActiveZoom = React.useCallback<PublishActiveZoom>((next) => {
    setActiveZoom((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const zoomPublishValue = React.useMemo<LightboxZoomPublishContextValue>(
    () => ({ publish: publishActiveZoom, activeZoomRef }),
    [publishActiveZoom],
  );

  // --- View Transition morph ---
  // The morph mechanics (startViewTransition, document-level morph state,
  // flushSync timing, generation-guarded completion) live in the hook. Root
  // owns React state via commit callbacks and the lifecycle callbacks.
  const commitOpen = React.useCallback(() => {
    setMounted(true);
    lockScroll();
    if (!isControlledOpen) {
      setUncontrolledOpen(true);
    }
    onOpenChangeRef.current?.(true);
  }, [isControlledOpen, lockScroll]);

  // VT open is split into two commits so the expensive React reconciliation
  // (mounting the whole viewer + gallery) happens BEFORE `startViewTransition`
  // — off the transition's render-suppressed critical path — and only a cheap
  // reveal runs inside the callback.
  //
  // `commitPrepare` mounts the tree but keeps `open` false, so Content/Backdrop
  // render `visibility: hidden` (invisible in the transition's old snapshot)
  // while their layout settles and destination images start decoding.
  const commitPrepare = React.useCallback(() => {
    setMounted(true);
    setPreparing(true);
  }, []);

  // `commitReveal` flips the prepared tree visible and marks the lightbox open
  // (firing onOpenChange). The DOM already exists, so this is a paint-only flip
  // rather than a mount.
  const commitReveal = React.useCallback(() => {
    setPreparing(false);
    setMounted(true);
    // Lock at reveal (not prepare) so hiding the scrollbar — which can reflow
    // the page — is masked by the transition rather than showing as a jump.
    // The selection guard is deferred to handleOpenComplete: this commit runs
    // inside the transition's capture window, where the guard's inherited
    // `user-select` write would force a full-document restyle (see
    // applySelectionGuard).
    lockScroll({ deferSelectionGuard: true });
    if (!isControlledOpen) {
      setUncontrolledOpen(true);
    }
    onOpenChangeRef.current?.(true);
  }, [isControlledOpen, lockScroll]);

  // Tear down a prepare that never revealed (superseded / onBeforeOpen error).
  // We never fired onOpenChange(true), so this is mount-only cleanup.
  const commitAbortPrepare = React.useCallback(() => {
    setPreparing(false);
    setMounted(false);
  }, []);

  const commitClose = React.useCallback(() => {
    if (!isControlledOpen) {
      setUncontrolledOpen(false);
    }
    onOpenChangeRef.current?.(false);
    // Android Chrome: keep the portal mounted and hidden until `finished`.
    // Unmounting the overlay inside the VT callback changes the snapshot
    // root and aborts the morph. Blink hides the live tree during VT, so
    // unnamed chrome still fades with `::view-transition-old(root)`.
    //
    // Everywhere else (Safari, desktop Chrome): unmount immediately so
    // unnamed `position: fixed` chrome is gone from the live tree (WebKit
    // paints it through the VT layer otherwise) and exists only in the old
    // root snapshot. Do not give Content/Backdrop a view-transition-name —
    // WebKit CPU-rasterizes every named group and those nodes are fullscreen.
    if (isAndroidBlinkSnapshotRoot()) {
      setPreparing(true);
    } else {
      setMounted(false);
    }
  }, [isControlledOpen]);

  const handleOpenComplete = React.useCallback(() => {
    // The morph is over — apply the selection guard commitReveal deferred
    // (no-op when the open was interrupted and already unlocked).
    applySelectionGuard();
    settleOpenTransition();
    onOpenChangeCompleteRef.current?.(true);
  }, [applySelectionGuard, settleOpenTransition]);

  const handleCloseComplete = React.useCallback(
    (triggerEl: HTMLElement | undefined) => {
      // Release the page scroll lock only now — after the close transition has
      // finished — so the page can't scroll behind an in-flight VT close.
      unlockScroll();
      setPreparing(false);
      setMounted(false);
      // Heavy documents: `unlockScroll` just restored inherited
      // `user-select` on <html> (a whole-document style invalidation) and
      // the unmount dirtied the tree — a synchronous `focus()` would
      // force-flush that restyle right here, in this task. Defer it one
      // frame so the recalc runs once, inside the rendering frame that has
      // to restyle and repaint anyway. Small documents keep the synchronous
      // focus (the flush is negligible and tests observe it directly).
      if (shouldYieldBeforeCapture()) {
        requestAnimationFrame(() => focusReturnTarget(triggerEl));
      } else {
        focusReturnTarget(triggerEl);
      }
      onOpenChangeCompleteRef.current?.(false);
    },
    [unlockScroll, focusReturnTarget],
  );

  const morphRef = React.useRef<ViewTransitionMorph | null>(null);
  const morphConfigRef = React.useRef<ViewTransitionMorphConfig>(null!);
  morphConfigRef.current = {
    morphTo,
    scrollTriggerIntoView,
    decodeMaxWait,
    onBeforeOpenRef,
    beforeOpenAbortRef,
    triggerElementsRef,
    triggerMorphElementsRef,
    standInTriggerIndexesRef,
    activeItemElementRef,
    itemMorphElementsRef,
    destinationMorphElementRef,
    openingTriggerIndexRef,
    openingTriggerElementRef,
    activeIndexRef,
    transitionPreset: viewTransition,
    closeGenRef,
    commitPrepare,
    commitReveal,
    commitAbortPrepare,
    commitClose,
    onOpenComplete: handleOpenComplete,
    onCloseComplete: handleCloseComplete,
    activeZoomRef,
  };

  const willUseViewTransition = React.useCallback(
    () => !!viewTransition && supportsViewTransitions() && !isLowEndDevice(),
    [viewTransition],
  );

  const setOpenNow = React.useCallback(
    (nextOpen: boolean, options?: LightboxCloseOptions) => {
      closeGenRef.current += 1;
      // Record how this close was initiated so return focus can decide whether
      // to show the trigger's focus ring. Only meaningful for closes; opening
      // clears any stale hint from a prior close.
      closeFocusVisibleRef.current = nextOpen ? undefined : options?.focusVisible;
      // Cancel any in-flight onBeforeOpen from a previous open attempt.
      beforeOpenAbortRef.current?.abort();
      beforeOpenAbortRef.current = null;
      // Mark this transition as internal so the external-sync effect
      // below doesn't double-handle the mount lifecycle when the
      // controlled `open` prop subsequently updates via onOpenChange.
      lastInternalOpenRef.current = nextOpen;

      // Request Zoom with the open rather than waiting for Zoom to mount and
      // ask for itself, so gestures are live as early as the network allows.
      // A miss is not a correctness problem, only a brief unresponsive
      // window — see the handover note in lightbox-zoom.tsx.
      if (nextOpen) prefetchZoomRuntime();

      // Open-transition gate for `Lightbox.Item` placeholders: mark it pending
      // as the open begins (items mounting during the morph will wait for it),
      // and settle it as a close begins (so a placeholder gated on an
      // interrupted open is released before the item unmounts).
      if (nextOpen) {
        openTransitionPendingRef.current = true;
        closeFocusItemIdRef.current = null;
      } else {
        settleOpenTransition();
        notifyBeforeClose();
        const closeIdx = resolveTriggerIndex(
          activeIndexRef.current,
          morphTo,
          openingTriggerIndexRef.current,
          triggerElementsRef.current,
        );
        closeFocusItemIdRef.current = itemIdByIndexRef.current.get(closeIdx) ?? null;
      }

      // Skip the (document-snapshotting) morph on low-end hardware and fall
      // back to the plain fade path, which is far cheaper to composite.
      const useVT = willUseViewTransition();

      // --- No view transition ---
      // Also where a failed morph-chunk load lands: the commit lives here, so
      // without this fallback a missing chunk would drop the open entirely.
      const runWithoutViewTransition = () => {
        if (nextOpen) {
          commitOpen();
          // Wait a frame for the enter animation to register before
          // observing it, then fire the completion callback once it settles.
          const gen = closeGenRef.current;
          requestAnimationFrame(() => {
            if (closeGenRef.current !== gen) return;
            runAfterAnimations(dialogElementRef.current, gen, closeGenRef, () => {
              const openCompleteScroll = resolveScrollTriggerOption(scrollTriggerIntoView, 'onOpenComplete');
              if (openCompleteScroll) {
                const idx = resolveTriggerIndex(
                  activeIndexRef.current,
                  morphTo,
                  openingTriggerIndexRef.current,
                  triggerElementsRef.current,
                );
                scrollTriggerEl(triggerElementsRef.current.get(idx), openCompleteScroll);
              }
              settleOpenTransition();
              onOpenChangeCompleteRef.current?.(true);
            });
          });
        } else {
          const closeTriggerIdx = resolveTriggerIndex(
            activeIndexRef.current,
            morphTo,
            openingTriggerIndexRef.current,
            triggerElementsRef.current,
          );
          const closeScroll = resolveScrollTriggerOption(scrollTriggerIntoView, 'onClose');
          if (closeScroll) {
            const triggerEl = triggerElementsRef.current.get(closeTriggerIdx);
            scrollTriggerEl(triggerEl, closeScroll);
          }
          if (!isControlledOpen) {
            setUncontrolledOpen(false);
          }
          onOpenChangeRef.current?.(false);
          const gen = closeGenRef.current;
          const focusTarget = triggerElementsRef.current.get(closeTriggerIdx);
          // Keep the item mounted until the consumer's exit transition
          // finishes, then unmount, restore focus, and fire completion.
          runAfterAnimations(dialogElementRef.current, gen, closeGenRef, () => {
            setMounted(false);
            // Release the scroll lock only after the exit animation settles.
            unlockScroll();
            requestAnimationFrame(() => focusReturnTarget(focusTarget));
            onOpenChangeCompleteRef.current?.(false);
          });
        }
      };

      if (useVT) {
        // The generation was bumped above; the morph captures it on call.
        const gen = closeGenRef.current;
        const startMorph = (runtime: MorphRuntime) => {
          if (closeGenRef.current !== gen) return;
          runtime.ensureVtStructuralStyles();
          morphRef.current ??= runtime.createViewTransitionMorph(() => morphConfigRef.current);
          if (nextOpen) {
            morphRef.current.open();
          } else {
            morphRef.current.close();
          }
        };
        const runtime = getMorphRuntimeSync();
        if (runtime) {
          startMorph(runtime);
        } else {
          void loadMorphRuntime().then(startMorph, (error: unknown) => {
            // Chunk never arrived (deploy landed mid-session, offline, CDN
            // blocked). Degrade to the plain path so the click still opens
            // the lightbox instead of looking dead.
            if (closeGenRef.current !== gen) return;
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Lightbox: the view-transition runtime failed to load; opening without the morph.', error);
            }
            runWithoutViewTransition();
          });
        }
      } else {
        runWithoutViewTransition();
      }
    },
    [
      isControlledOpen,
      willUseViewTransition,
      scrollTriggerIntoView,
      morphTo,
      commitOpen,
      unlockScroll,
      settleOpenTransition,
      focusReturnTarget,
      notifyBeforeClose,
    ],
  );

  // A close waiting on `revealTrigger`: superseded (aborted) by any newer
  // open, and by unmount. Repeat closes while waiting join the same wait.
  const revealWaitRef = React.useRef<AbortController | null>(null);
  React.useEffect(
    () => () => {
      revealWaitRef.current?.abort();
      revealWaitRef.current = null;
    },
    [],
  );
  const setOpen = React.useCallback(
    (nextOpen: boolean, options?: LightboxCloseOptions) => {
      if (!nextOpen && revealWaitRef.current) return;
      revealWaitRef.current?.abort();
      revealWaitRef.current = null;
      if (nextOpen || !openRef.current || resolveCloseTriggerElement()) {
        setOpenNow(nextOpen, options);
        return;
      }
      const controller = new AbortController();
      const request = requestRevealTrigger('close', controller.signal);
      // Only the morph needs the trigger on screen this instant; the fade
      // path just reveals it, and focus return finds it once it mounts.
      if (!request || !willUseViewTransition()) {
        setOpenNow(false, options);
        return;
      }
      revealWaitRef.current = controller;
      const finish = () => {
        if (controller.signal.aborted) return;
        revealWaitRef.current = null;
        setOpenNow(false, options);
      };
      // Wait for the trigger to mount AND hold its position: a virtualizer
      // keeps correcting its scroll for a few frames after the row renders,
      // and the morph reads the trigger's rect once, when it starts.
      const waitForStableTrigger = () => {
        let frames = 0;
        let stableFrames = 0;
        let lastRect: DOMRect | null = null;
        const tick = () => {
          if (controller.signal.aborted) return;
          frames += 1;
          const el = resolveCloseTriggerElement();
          if (el) {
            const rect = el.getBoundingClientRect();
            stableFrames = lastRect && sameRect(rect, lastRect) ? stableFrames + 1 : 0;
            lastRect = rect;
          }
          if (stableFrames >= REVEAL_TRIGGER_STABLE_FRAMES || frames >= REVEAL_TRIGGER_MAX_FRAMES) {
            finish();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      if (request.wait) {
        request.wait.then(waitForStableTrigger, waitForStableTrigger);
      } else {
        waitForStableTrigger();
      }
    },
    [setOpenNow, resolveCloseTriggerElement, requestRevealTrigger, willUseViewTransition],
  );

  // Sync `mounted` to externally-driven changes of a controlled
  // `open` prop. When `open` flips without going through internal
  // setOpen (e.g. a parent state setter wired to an external button,
  // a route change, or a store update), `mounted` would otherwise
  // stay stuck at its previous value and Lightbox.Content / Backdrop
  // would refuse to render.
  //
  // For the open path we set `mounted` immediately. For the close
  // path we wait for any CSS transitions on the dialog element to
  // finish before unmounting, matching the non-VT close behavior in
  // setOpen so consumer-defined fade-outs still play.
  //
  // View Transitions are intentionally skipped here — those are
  // bound to user gestures on triggers / close controls. Programmatic
  // open/close via state mutation is treated as a plain mount swap.
  React.useEffect(() => {
    if (open === lastInternalOpenRef.current) return;
    lastInternalOpenRef.current = open;

    if (open) {
      // External/controlled open has no originating click element; clear it
      // so a stale clicked trigger from a prior open isn't reused.
      openingTriggerElementRef.current = null;
      openingTriggerImageRef.current = null;
      setMounted(true);
      lockScroll();
      return;
    }

    const gen = ++closeGenRef.current;
    notifyBeforeClose();
    runAfterAnimations(dialogElementRef.current, gen, closeGenRef, () => {
      setMounted(false);
      unlockScroll();
    });
  }, [open, lockScroll, unlockScroll, notifyBeforeClose]);

  // Initially-open lightbox (defaultOpen / controlled-open at mount): the
  // open-commit paths above don't run, so acquire the lock here. The cleanup
  // also guarantees the lock is released if Root unmounts while still open.
  React.useEffect(() => {
    if (mounted && !preparing) lockScroll();
    return () => unlockScroll();
    // Mount/unmount only — subsequent opens lock via commitOpen/commitReveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warm the morph once the page is idle — deliberately not during hydration,
  // where the fetch and its evaluation compete with the LCP image (see
  // schedule-warm-up.ts). It has to be resident *before* the click, because
  // the morph starts inside the click handler: arriving late means that open
  // degrades to the plain path. Only when VT will actually run.
  //
  // Zoom is not warmed here. It is needed the first time someone pinches or
  // double-taps, never in the same tick as the click, and a chunk that lands
  // after the open now costs nothing (see lightbox-zoom.tsx — the engine
  // renders no DOM, so handover cannot remount anything). Trigger warms it on
  // hover / focus / pointerdown and setOpen requests it, so intent still buys
  // a head start; a visitor who never opens the gallery pays nothing.
  React.useEffect(() => {
    if (viewTransition === false || !supportsViewTransitions() || isLowEndDevice()) return;
    return scheduleWarmUp(prefetchMorphRuntime);
  }, [viewTransition]);

  const performOpen = React.useCallback(
    (
      index?: number,
      options?: LightboxHandleOpenOptions,
      origin?: { element: HTMLElement | null; image: HTMLImageElement | null },
    ) => {
      let resolvedIndex = index;
      let element: HTMLElement | null = origin?.element ?? null;
      let image: HTMLImageElement | null = origin?.image ?? null;
      let itemId = options?.itemId;

      if (!origin && options?.triggerId) {
        const fromHandle = handleProp ? getHandleTrigger(handleProp, options.triggerId) : undefined;
        const fromIds = triggerIdsRef.current.get(options.triggerId);
        const reg = fromHandle ?? fromIds;
        if (reg) {
          const regItemId = fromHandle?.itemId;
          itemId ??= regItemId;
          // A keyed trigger's index is the item's, resolved below — not the
          // placeholder its registration carries.
          if (regItemId === undefined) resolvedIndex = index ?? reg.index;
          element = reg.element;
          image = reg.image;
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn(`Lightbox open: no trigger registered with id "${options.triggerId}".`);
        }
      }

      // Opening by `itemId` with no trigger element (`handle.open({ itemId })`):
      // morph from that item's mounted keyed trigger, as a click on it would.
      if (!element && itemId !== undefined && resolvedIndex === undefined) {
        const found = findKeyedTrigger(itemId);
        if (found) {
          element = found.element;
          image = found.image;
        }
      }
      openingItemIdRef.current = itemId ?? null;

      const nextPayload = options?.payload as Payload | undefined;
      const payloadChanged = nextPayload !== undefined && !Object.is(nextPayload, payloadRef.current);
      if (nextPayload !== undefined) setOpenPayload(nextPayload);

      // Opening by `itemId`: reuse the mounted item's index when this payload's
      // items are already in the tree (keepMounted, or an open re-targeting
      // the same gallery); otherwise wait for the item to register during the
      // pre-mount (see `registerItemId`). A new payload object can still
      // describe already-mounted items, so the pending open also falls back to
      // the item map once the commit settles (see the layout effect below).
      pendingOpenItemIdRef.current = null;
      if (resolvedIndex === undefined && itemId !== undefined) {
        const known = payloadChanged ? undefined : itemIndexByIdRef.current.get(itemId);
        if (known !== undefined) {
          resolvedIndex = known;
        } else {
          pendingOpenItemIdRef.current = itemId;
        }
      }

      if (resolvedIndex !== undefined) {
        openingTriggerIndexRef.current = resolvedIndex;
        setActiveIndex(resolvedIndex, 'imperative');
      }

      if (element) {
        openingTriggerElementRef.current = element;
        openingTriggerImageRef.current = image;
      } else if (resolvedIndex !== undefined) {
        // Associate with the registered trigger at this index when present so
        // view-transition morph / placeholders can still run for handle opens.
        openingTriggerElementRef.current = triggerElementsRef.current.get(resolvedIndex) ?? null;
        openingTriggerImageRef.current = triggerImageElementsRef.current.get(resolvedIndex) ?? null;
      } else {
        openingTriggerElementRef.current = null;
        openingTriggerImageRef.current = null;
      }
      // The join prefers the opening trigger; re-pick for an already-mounted item.
      if (itemId !== undefined) syncKeyedItem(itemId);

      if (viewTransition !== false) {
        prefetchMorphRuntime();
      }
      prefetchZoomRuntime();
      setOpen(true);
    },
    [handleProp, setActiveIndex, setOpen, viewTransition, syncKeyedItem, findKeyedTrigger, setOpenPayload],
  );

  const performClose = React.useCallback(() => setOpen(false), [setOpen]);
  const performGoTo = React.useCallback(
    (target: number | { itemId: string }) => {
      if (typeof target === 'number') {
        setActiveIndex(target, 'imperative');
        return;
      }
      const index = itemIndexByIdRef.current.get(target.itemId);
      if (index !== undefined) {
        setActiveIndex(index, 'imperative');
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ramka] goTo: no mounted Lightbox.Item has itemId "${target.itemId}".`);
      }
    },
    [setActiveIndex],
  );

  const syncTrigger = React.useCallback(
    (reg: LightboxHandleTriggerRegistration) => {
      triggerIdsRef.current.set(reg.id, {
        id: reg.id,
        index: reg.index,
        element: reg.element,
        image: reg.image,
      });
      if (reg.itemId !== undefined) {
        // The opening trigger's row remounted while open (virtualizer churn):
        // adopt the new element as the origin, so it keeps `aria-expanded`,
        // wins duplicate picks, and receives return focus.
        if (
          openRef.current &&
          reg.element?.isConnected &&
          reg.itemId === openingItemIdRef.current &&
          !openingTriggerElementRef.current?.isConnected
        ) {
          openingTriggerElementRef.current = reg.element;
          openingTriggerImageRef.current = reg.image;
        }
        const add = (map: Map<string, LightboxHandleTriggerRegistration[]>, itemId: string) => {
          const regs = map.get(itemId);
          if (!regs) {
            map.set(itemId, [reg]);
          } else if (!regs.includes(reg)) {
            regs.push(reg);
          }
          syncKeyedItem(itemId);
        };
        add(keyedTriggersRef.current, reg.itemId);
        reg.overflowItemIds?.forEach((itemId) => add(overflowTriggersRef.current, itemId));
        return;
      }
      if (reg.element) {
        triggerElementsRef.current.set(reg.index, reg.element);
        if (reg.morphElement) {
          triggerMorphElementsRef.current.set(reg.element, reg.morphElement);
        } else {
          triggerMorphElementsRef.current.delete(reg.element);
        }
      }
      if (reg.image) {
        triggerImageElementsRef.current.set(reg.index, reg.image);
      }
    },
    [syncKeyedItem],
  );

  const unsyncTrigger = React.useCallback(
    (reg: LightboxHandleTriggerRegistration) => {
      const current = triggerIdsRef.current.get(reg.id);
      if (current?.element === reg.element) {
        triggerIdsRef.current.delete(reg.id);
      }
      if (reg.itemId !== undefined) {
        const remove = (map: Map<string, LightboxHandleTriggerRegistration[]>, itemId: string) => {
          const regs = map.get(itemId);
          if (regs) {
            const at = regs.indexOf(reg);
            if (at >= 0) regs.splice(at, 1);
            if (regs.length === 0) map.delete(itemId);
          }
          syncKeyedItem(itemId);
        };
        remove(keyedTriggersRef.current, reg.itemId);
        reg.overflowItemIds?.forEach((itemId) => remove(overflowTriggersRef.current, itemId));
        return;
      }
      if (reg.element && triggerElementsRef.current.get(reg.index) === reg.element) {
        triggerElementsRef.current.delete(reg.index);
        triggerMorphElementsRef.current.delete(reg.element);
      }
      if (reg.image && triggerImageElementsRef.current.get(reg.index) === reg.image) {
        triggerImageElementsRef.current.delete(reg.index);
      }
    },
    [syncKeyedItem],
  );

  // One identity-stable host for the Root's lifetime: a bound handle exposes
  // it to detached Triggers, and Root-tree keyed Triggers read it from the
  // stable context. Actions go through refs to the latest closures.
  const performOpenRef = React.useRef(performOpen);
  performOpenRef.current = performOpen;
  const performCloseRef = React.useRef(performClose);
  performCloseRef.current = performClose;
  const performGoToRef = React.useRef(performGoTo);
  performGoToRef.current = performGoTo;
  const host = React.useMemo<LightboxHandleHost>(
    () => ({
      open: (index, options) => performOpenRef.current(index, options),
      openFromTrigger: (reg, nextPayload) =>
        performOpenRef.current(
          reg.itemId === undefined ? reg.index : undefined,
          { itemId: reg.itemId, payload: nextPayload },
          { element: reg.element, image: reg.image },
        ),
      close: () => performCloseRef.current(),
      goTo: (target) => performGoToRef.current(target),
      getOpen: () => openRef.current,
      getActiveIndex: () => activeIndexRef.current,
      getItemIndex: (itemId) => itemIndexByIdRef.current.get(itemId) ?? -1,
      getOpeningElement: () => openingTriggerElementRef.current,
      getMorphTargetElement: () => {
        if (!openRef.current) return null;
        const idx = resolveTriggerIndex(
          activeIndexRef.current,
          morphToRef.current,
          openingTriggerIndexRef.current,
          triggerElementsRef.current,
        );
        return triggerElementsRef.current.get(idx) ?? null;
      },
      getContentId: () => `${baseId}-content`,
      syncTrigger,
      unsyncTrigger,
    }),
    [baseId, syncTrigger, unsyncTrigger],
  );

  // Bind createHandle() host for the lifetime of this Root.
  React.useLayoutEffect(() => {
    if (!handleProp) return;
    bindLightboxHandle(handleProp, host);
    return () => unbindLightboxHandle(handleProp, host);
  }, [handleProp, host]);

  const registerKeyedTrigger = React.useCallback(
    (reg: LightboxHandleTriggerRegistration) => {
      syncTrigger(reg);
      if (openRef.current) notifyKeyedRef.current();
      return () => {
        unsyncTrigger(reg);
        if (openRef.current) notifyKeyedRef.current();
      };
    },
    [syncTrigger, unsyncTrigger],
  );
  const touchKeyedTrigger = React.useCallback(
    (reg: LightboxHandleTriggerRegistration) => {
      syncTrigger(reg);
      if (openRef.current) notifyKeyedRef.current();
    },
    [syncTrigger],
  );

  // Keep keyed / detached Triggers in sync with Root state. Layout timing so a
  // detached morph source hides in the same commit that reveals the viewer —
  // inside the open transition's capture, like Root-tree triggers driven by
  // the store.
  React.useLayoutEffect(() => {
    keyedNotifyPendingRef.current = false;
    notifyKeyed();
  }, [notifyKeyed, open, activeIndex, morphTo]);

  // Item `itemId` registry — the other half of the keyed-trigger join.
  // Registered from Item's layout effect, so during an open's pre-mount every
  // item is known before the flush returns, and a pending `itemId` open
  // resolves to its index (and re-renders at it) inside that same flush.
  const resolveOpenIndex = React.useCallback((index: number) => {
    openingTriggerIndexRef.current = index;
    if (activeIndexRef.current !== index) setActiveIndexActionRef.current(index, 'trigger');
  }, []);
  const registerItemId = React.useCallback(
    (itemId: string, index: number) => {
      const prevIndex = itemIndexByIdRef.current.get(itemId);
      if (process.env.NODE_ENV !== 'production' && prevIndex !== undefined && prevIndex !== index) {
        console.warn(
          `[ramka] Two Lightbox.Items share itemId "${itemId}" (indexes ${prevIndex} and ${index}). ` +
            'itemId must be unique within the gallery, or triggers cannot tell the items apart.',
        );
      }
      itemIndexByIdRef.current.set(itemId, index);
      itemIdByIndexRef.current.set(index, itemId);
      syncKeyedIndex(index);
      if (pendingOpenItemIdRef.current === itemId) {
        pendingOpenItemIdRef.current = null;
        resolveOpenIndex(index);
      }
      scheduleKeyedNotify();
      return () => {
        if (itemIndexByIdRef.current.get(itemId) === index) itemIndexByIdRef.current.delete(itemId);
        if (itemIdByIndexRef.current.get(index) === itemId) {
          itemIdByIndexRef.current.delete(index);
          syncKeyedIndex(index);
        }
        scheduleKeyedNotify();
      };
    },
    [syncKeyedIndex, scheduleKeyedNotify, resolveOpenIndex],
  );

  // A pending `itemId` open after the commit settled. Items that were already
  // mounted (keepMounted, a reopen during the close fade, a new payload object
  // describing the same images) never re-register, so resolve from the item
  // map — cleanup has dropped any item the new payload removed by now. Root's
  // layout effects run after every descendant's, so if the map has no match
  // the item isn't there: stop waiting, so a later item can't hijack the index.
  React.useLayoutEffect(() => {
    const pending = pendingOpenItemIdRef.current;
    if (pending !== null && mounted) {
      pendingOpenItemIdRef.current = null;
      const index = itemIndexByIdRef.current.get(pending);
      if (index !== undefined) {
        resolveOpenIndex(index);
        syncKeyedIndex(index);
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[ramka] Lightbox opened for itemId "${pending}", but no mounted ` +
            'Lightbox.Item has that itemId. Render an Item with the same itemId for the payload you open.',
        );
      }
    }
    flushKeyedNotify();
  });

  // ── Hot-state store for the O(n) per-item parts ─────────────────────────
  // Item/Trigger/Thumbnail subscribe to derived primitives instead of this
  // context, so a navigation or open/close commit re-renders O(preload)
  // parts, not O(n). Timing contract (render-phase sync, layout-effect
  // notify) is documented in lightbox-store.ts — don't reorder these.
  const hotState: LightboxHotState = {
    open,
    activeIndex,
    itemCount: effectiveItemCount,
    loop,
    hasTablist,
    morphTo,
    viewTransition: viewTransition !== false,
  };
  const storeRef = React.useRef<LightboxStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createLightboxStore(hotState);
  }
  const store = storeRef.current;
  // Render-phase sync so parts MOUNTING in this commit read fresh values
  // (critical inside flushSync(commitPrepare): the active item must register
  // for the morph on its first render's snapshot).
  if (!hotStateEqual(store.getState(), hotState)) {
    store.setStateSilent(hotState);
  }
  // Post-commit: re-assert the committed values (a discarded concurrent
  // render may have written ahead) and notify subscribers — synchronously
  // before paint, and within the same flush on the flushSync VT paths.
  const lastNotifiedHotStateRef = React.useRef(hotState);
  React.useLayoutEffect(() => {
    store.setStateSilent(hotState);
    if (!hotStateEqual(lastNotifiedHotStateRef.current, hotState)) {
      lastNotifiedHotStateRef.current = hotState;
      store.notify();
    }
  });

  // Identity-stable action wrappers for the stable context. `setOpen` /
  // `setActiveIndex` legitimately change identity (they close over controlled
  // props and VT config), which would defeat the stable context's whole
  // purpose — so the per-item parts get ref-indirected wrappers instead.
  // The refs are (re)assigned during render, matching the openRef /
  // activeIndexRef pattern above, so a handler fired in the same commit
  // (e.g. a test's synchronous dispatch) already sees the fresh closure.
  const setOpenActionRef = React.useRef(setOpen);
  setOpenActionRef.current = setOpen;
  const setActiveIndexActionRef = React.useRef(setActiveIndex);
  setActiveIndexActionRef.current = setActiveIndex;
  const stableSetOpen = React.useCallback(
    (nextOpen: boolean, options?: LightboxCloseOptions) => setOpenActionRef.current(nextOpen, options),
    [],
  );
  const stableSetActiveIndex = React.useCallback(
    (index: number, source: NavigationSource) => setActiveIndexActionRef.current(index, source),
    [],
  );

  // Every dep is identity-stable, so this memo resolves once per Root — the
  // per-item parts subscribed to it never re-render from context churn.
  const stableContextValue = React.useMemo<LightboxStableContextValue>(
    () => ({
      store,
      baseId,
      setOpen: stableSetOpen,
      setActiveIndex: stableSetActiveIndex,
      registerItem,
      registerItemId,
      setOpenPayload,
      registerKeyedTrigger,
      touchKeyedTrigger,
      keyedHost: host,
      subscribeKeyed,
      registerCaption,
      subscribeOpenComplete,
      openTransitionPendingRef,
      activeItemElementRef,
      itemMorphElementsRef,
      triggerElementsRef,
      triggerMorphElementsRef,
      triggerImageElementsRef,
      standInTriggerIndexesRef,
      triggerIdsRef,
      openingTriggerIndexRef,
      openingTriggerElementRef,
      openingTriggerImageRef,
    }),
    [
      store,
      baseId,
      stableSetOpen,
      stableSetActiveIndex,
      registerItem,
      registerItemId,
      setOpenPayload,
      registerKeyedTrigger,
      touchKeyedTrigger,
      host,
      subscribeKeyed,
      registerCaption,
      subscribeOpenComplete,
    ],
  );

  const stateSlice = React.useMemo<LightboxStateSlice>(
    () => ({
      open,
      setOpen,
      mounted,
      preparing,
      openTransitionPendingRef,
      subscribeOpenComplete,
      activeIndex,
      direction,
      dir,
      dirAttribute: dirProp,
      setActiveIndex,
      navigationLockedRef,
      itemCount: effectiveItemCount,
      registerItem,
      loop,
      baseId,
      hasTablist,
      registerTablist,
      captionsRef,
      registerCaption,
      subscribeCaptions,
      dialogElementRef,
      stageElementRef,
      backdropElementRef,
    }),
    [
      open,
      setOpen,
      mounted,
      preparing,
      subscribeOpenComplete,
      activeIndex,
      direction,
      dir,
      dirProp,
      setActiveIndex,
      effectiveItemCount,
      registerItem,
      loop,
      baseId,
      hasTablist,
      registerTablist,
      registerCaption,
      subscribeCaptions,
    ],
  );

  const morphSlice = React.useMemo<LightboxMorphSlice>(
    () => ({
      // Most context consumers only care whether the morph is enabled; the
      // raw preset is passed alongside so the Portal can publish the
      // preset's timing vars on its host.
      viewTransition: viewTransition !== false,
      transitionPreset: viewTransition,
      morphTo,
      triggerElementsRef,
      triggerMorphElementsRef,
      activeItemElementRef,
      itemMorphElementsRef,
      destinationMorphElementRef,
      openingTriggerIndexRef,
      openingTriggerElementRef,
      openingTriggerImageRef,
      triggerImageElementsRef,
      triggerIdsRef,
    }),
    [viewTransition, morphTo],
  );

  const slidesBridgeSlice = React.useMemo<LightboxSlidesBridgeSlice>(
    () => ({
      slidesViewportRef,
      slidesGeometryRef,
      subscribeSlidesViewport,
      notifySlidesViewport,
      thumbnailStripSelectRef,
      navigate,
    }),
    [subscribeSlidesViewport, notifySlidesViewport, navigate],
  );

  const contextValue = React.useMemo<LightboxContextValue>(
    () => ({ ...stateSlice, ...morphSlice, ...slidesBridgeSlice }),
    [stateSlice, morphSlice, slidesBridgeSlice],
  );

  return (
    <LightboxContext.Provider value={contextValue}>
      <LightboxStableContext.Provider value={stableContextValue}>
        <LightboxZoomPublishContext.Provider value={zoomPublishValue}>
          <LightboxActiveZoomContext.Provider value={activeZoom}>
            {typeof children === 'function' ? children({ payload }) : children}
          </LightboxActiveZoomContext.Provider>
        </LightboxZoomPublishContext.Provider>
      </LightboxStableContext.Provider>
    </LightboxContext.Provider>
  );
}

LightboxRoot.displayName = 'LightboxRoot';

export { LightboxRoot };
export type {
  LightboxRootProps,
  LightboxRootRenderState,
  LightboxRevealTriggerDetails,
  LightboxRevealTrigger,
  LightboxBeforeOpen,
  LightboxBeforeOpenContext,
  LightboxBeforeClose,
  LightboxBeforeCloseContext,
};
