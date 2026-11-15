'use client';

import * as React from 'react';

import { INTERACTIVE_TARGET_SELECTORS } from './interactive-targets';
import type { ActiveZoomControls } from './lightbox-zoom-context';
import type { InitializedRef } from '../react-compat';

// ---------------------------------------------------------------------------
// Engine for `Lightbox.Content closeOnEmptyClick` (lazy chunk — see the prop's
// JSDoc for the behavior). Content's own `onClick` asks `shouldClose`, so a
// consumer `onClick` (merged to run first) can still `preventDefault()` it.
//
// Pointer bookkeeping is native and lives only while the prop is on: a press
// is tracked from `pointerdown` to `pointerup` / `pointercancel` (document
// capture, since pull-to-dismiss captures the pointer), and `pointermove` is
// only listened to while an unclaimed press is down. Only `click` closes —
// never `pointerup` — so an iOS tap (pointer events + compatibility click) is
// handled once, and a touch the browser turns into a scroll (pointercancel,
// no click) never closes.
// ---------------------------------------------------------------------------

/**
 * Movement (CSS px) past which a press is a drag, not a click. Matches the
 * zoom engine's tap threshold so "tap" means the same thing in both places.
 */
const EMPTY_CLICK_MOVE_THRESHOLD = 10;

// Attribute names are spelled out rather than read from the
// lightbox-data-attributes enums: importing them would make that module shared
// with the main chunk and pin every enum this chunk touches (thumbnail strip,
// caption, …) into the up-front bundle of apps that never use the prop.
// `close-on-empty-click.test.tsx` checks them against the enums.

/** Media, interactive / focusable controls, and ramka's own chrome keep their click. */
const EMPTY_CLICK_IGNORED_TARGET_SELECTOR = [
  '[data-ramka-media]',
  'img',
  'picture',
  'video',
  'audio',
  'canvas',
  'svg',
  'iframe',
  'object',
  'embed',
  ...INTERACTIVE_TARGET_SELECTORS,
  '[tabindex]:not([tabindex="-1"])',
  '[data-ramka-caption]',
  '[data-ramka-counter]',
  '[data-ramka-thumbnail-group]',
  '[data-ramka-thumbnail-strip]',
].join(',');

/** Content states in which a gesture owns the pointer — never dismiss. */
const BUSY_CONTENT_ATTRIBUTES = [
  'data-pulling',
  'data-pull-snapping',
  'data-pull-dismissing',
  'data-zooming',
  'data-zoomed',
] as const;

/** Set on `<html>` while an open / close morph runs. */
const VIEW_TRANSITION_ATTRIBUTE = 'data-ramka-view-transition';

interface EmptyPress {
  pointerId: number;
  x: number;
  y: number;
  /** Still between pointerdown and pointerup / pointercancel. */
  down: boolean;
  /** A gesture (or a non-empty start target) owns this press. */
  claimed: boolean;
}

interface EmptyClickController {
  /**
   * Whether this click closes the viewer. Consumes the tracked press.
   * `sequenceStartedInside`: Content saw this click sequence's first
   * (`detail` 1) click — tracked in Content so it holds before this chunk loads.
   */
  shouldClose: (event: MouseEvent, sequenceStartedInside: boolean) => boolean;
}

interface EmptyClickCloseOptions {
  /** Root `open` — the tracked press resets on every change. */
  open: boolean;
  contentRef: React.RefObject<HTMLElement | null>;
  stageElementRef: React.RefObject<HTMLElement | null>;
  activeZoomRef: React.RefObject<ActiveZoomControls | null>;
  /** True while a `Lightbox.Slides` user scroll/fling is in flight. */
  isScrollingRef: InitializedRef<boolean>;
  /** Content reads the controller from here in its `onClick`. */
  controllerRef: InitializedRef<EmptyClickController | null>;
}

function isEmptyTarget(content: HTMLElement, stage: HTMLElement | null, target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  // React re-bubbles events from portaled overlays (menus, popovers) through
  // the React tree — only DOM descendants of Content count.
  if (target === content || !content.contains(target)) return false;
  // With Stage, side panels beside it are app chrome (same hit target as pull).
  if (stage && !stage.contains(target)) return false;
  const hit = target.closest(EMPTY_CLICK_IGNORED_TARGET_SELECTOR);
  return !hit || !content.contains(hit);
}

/**
 * Whether an ignored target is painted under the point even though the click
 * went past it. `pointer-events: none` controls — `disabled:pointer-events-none`
 * buttons, click-through captions — hand the click to whatever is behind them,
 * and `elementsFromPoint` can't see them either (it hit-tests the same way),
 * so this compares boxes instead. Click-time only, so the scan is cheap enough.
 */
function ignoredTargetUnderPoint(content: HTMLElement, x: number, y: number): boolean {
  for (const el of content.querySelectorAll(EMPTY_CLICK_IGNORED_TARGET_SELECTOR)) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    return true;
  }
  return false;
}

function useEmptyClickClose({
  open,
  contentRef,
  stageElementRef,
  activeZoomRef,
  isScrollingRef,
  controllerRef,
}: EmptyClickCloseOptions): void {
  const pressRef = React.useRef<EmptyPress | null>(null);

  React.useEffect(() => {
    pressRef.current = null;
  }, [open]);

  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const doc = content.ownerDocument;

    const isGestureBusy = (): boolean => {
      if (isScrollingRef.current) return true;
      if ((activeZoomRef.current?.getZoom() ?? 1) > 1) return true;
      // Open / close morph still in flight.
      if (doc.documentElement.hasAttribute(VIEW_TRANSITION_ATTRIBUTE)) return true;
      return BUSY_CONTENT_ATTRIBUTES.some((attr) => content.hasAttribute(attr));
    };

    const onMove = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > EMPTY_CLICK_MOVE_THRESHOLD) {
        claim(press);
      }
    };
    let watchingMoves = false;
    const watchMoves = (on: boolean) => {
      if (on === watchingMoves) return;
      watchingMoves = on;
      if (on) content.addEventListener('pointermove', onMove, true);
      else content.removeEventListener('pointermove', onMove, true);
    };
    const claim = (press: EmptyPress) => {
      press.claimed = true;
      watchMoves(false);
    };

    const onDown = (event: PointerEvent) => {
      const press = pressRef.current;
      if (press?.down && event.pointerId !== press.pointerId) {
        // A second pointer while the first is still down is a pinch.
        claim(press);
        return;
      }
      if (!event.isPrimary || event.button !== 0) {
        pressRef.current = null;
        watchMoves(false);
        return;
      }
      const next: EmptyPress = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        down: true,
        claimed: !isEmptyTarget(content, stageElementRef.current, event.target) || isGestureBusy(),
      };
      pressRef.current = next;
      watchMoves(!next.claimed);
    };
    const onUp = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;
      press.down = false;
      if (event.type === 'pointercancel') press.claimed = true;
      watchMoves(false);
    };

    content.addEventListener('pointerdown', onDown, true);
    doc.addEventListener('pointerup', onUp, true);
    doc.addEventListener('pointercancel', onUp, true);

    controllerRef.current = {
      shouldClose(event, sequenceStartedInside) {
        const press = pressRef.current;
        pressRef.current = null;
        watchMoves(false);
        if (!press || press.claimed || event.defaultPrevented || event.button !== 0) return false;
        // A later click of a multi-click that began elsewhere — typically the
        // Trigger double/triple-click that opened the viewer.
        if (event.detail > 1 && !sequenceStartedInside) return false;
        if (!isEmptyTarget(content, stageElementRef.current, event.target) || isGestureBusy()) return false;
        return !ignoredTargetUnderPoint(content, event.clientX, event.clientY);
      },
    };

    return () => {
      content.removeEventListener('pointerdown', onDown, true);
      doc.removeEventListener('pointerup', onUp, true);
      doc.removeEventListener('pointercancel', onUp, true);
      watchMoves(false);
      pressRef.current = null;
      controllerRef.current = null;
    };
  }, [contentRef, stageElementRef, activeZoomRef, isScrollingRef, controllerRef]);
}

export {
  useEmptyClickClose,
  EMPTY_CLICK_MOVE_THRESHOLD,
  EMPTY_CLICK_IGNORED_TARGET_SELECTOR,
  BUSY_CONTENT_ATTRIBUTES,
  VIEW_TRANSITION_ATTRIBUTE,
};
export type { EmptyClickCloseOptions, EmptyClickController };
