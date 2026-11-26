'use client';

import * as React from 'react';

import { useLightboxContext } from './lightbox-context';
import type { TextDirection } from './lightbox-direction';
import {
  measureSlidesGeometry,
  slidesGeometryIsUniform,
  SLIDE_SELECTOR,
  type SlidesGeometry,
} from './lightbox-slides-geometry';
import { LightboxSlidesEngine, type LightboxSlidesProps } from './lightbox-slides';

/**
 * `Lightbox.VirtualSlides` — `Lightbox.Slides` for galleries too large to
 * mount a slide box per item.
 *
 * Only a window of slides around the active one is in the DOM. Two empty
 * spacers stand in for the rest, sized in CSS to exactly the slides they
 * replace, so the track's scroll extent, snap positions and scroll offset
 * are the same as a fully mounted track. A window shift resizes the spacers
 * and swaps slides in one commit, so nothing on screen moves.
 *
 * It is the `Lightbox.Slides` scroll engine with two seams: geometry is
 * measured on the mounted window and extended over the whole collection,
 * and slide lookups by index are offset by the window start. A swipe can't
 * outrun the window: `scroll-snap-stop: always` stops each gesture at the
 * next slide, and every discrete jump (keyboard, Previous / Next) happens at
 * rest, landing on a slide the window then mounts.
 *
 * Requires `itemIds` on `Lightbox.Root`: the full gallery in viewer order.
 * Slides must be uniform and scrollport-wide (`flex: 0 0 100%`).
 */

interface LightboxVirtualSlidesProps extends Omit<LightboxSlidesProps, 'children' | 'ssrSlideShift'> {
  /**
   * Slide boxes kept mounted beyond the `preload` window on each side of
   * the active slide. @default 2
   */
  overscan?: number;
  /**
   * Renders the slide at a collection index: a `Lightbox.Slide` with a
   * `Lightbox.Item` carrying the same `index` and `itemId` inside. Only
   * called for the mounted window.
   */
  children: (index: number, itemId: string) => React.ReactNode;
}

const GAP_VAR = '--ramka-virtual-slides-gap';

// Firefox lays out at most ~8.9M px; past this the last slides can't be reached.
const MAX_TRACK_WIDTH = 8_000_000;

function readTrackGap(viewport: HTMLElement): string {
  const gap = getComputedStyle(viewport).columnGap;
  return gap === 'normal' || gap === '' ? '0px' : gap;
}

const LightboxVirtualSlides = React.forwardRef<HTMLDivElement, LightboxVirtualSlidesProps>(
  function LightboxVirtualSlides(props, forwardedRef) {
    const { overscan = 2, preload = 1, children, ...slidesProps } = props;
    const { activeIndex, itemIds, registerVirtualSlides } = useLightboxContext();
    const count = itemIds?.length ?? 0;

    const warnedRef = React.useRef(false);
    if (process.env.NODE_ENV !== 'production' && !itemIds && !warnedRef.current) {
      warnedRef.current = true;
      console.warn(
        '[ramka] Lightbox.VirtualSlides needs `itemIds` on Lightbox.Root: the itemId of every item, in viewer order.',
      );
    }

    React.useLayoutEffect(() => registerVirtualSlides(), [registerVirtualSlides]);

    const radius = Math.max(1, preload + overscan);
    const start = Math.max(0, Math.min(activeIndex, count - 1) - radius);
    const end = Math.min(count, activeIndex + radius + 1);
    const startRef = React.useRef(start);
    startRef.current = start;

    const measureGeometry = React.useCallback(
      (viewport: HTMLElement, dir: TextDirection): SlidesGeometry => {
        viewport.style.setProperty(GAP_VAR, readTrackGap(viewport));
        const measured = measureSlidesGeometry(viewport, dir);
        if (measured.count === 0 || count === 0) {
          return { offsets: [], base: 0, step: viewport.clientWidth || 1, count: 0 };
        }
        const { step } = measured;
        const base = measured.offsets[0]! - startRef.current * step;
        if (process.env.NODE_ENV !== 'production' && !warnedRef.current) {
          if (!slidesGeometryIsUniform(measured)) {
            warnedRef.current = true;
            console.warn(
              '[ramka] Lightbox.VirtualSlides needs uniform, scrollport-wide slides (`flex: 0 0 100%`). ' +
                'The mounted slides measured different widths, so positions of the others will be wrong.',
            );
          } else if (count * step > MAX_TRACK_WIDTH) {
            warnedRef.current = true;
            console.warn(
              `[ramka] Lightbox.VirtualSlides: ${count} slides make a ${Math.round(count * step)}px track, ` +
                'wider than some browsers can lay out, so the last slides may be unreachable.',
            );
          }
        }
        return { offsets: [], base, step, count };
      },
      [count],
    );

    const resolveSlideElement = React.useCallback((viewport: HTMLElement, index: number): HTMLElement | null => {
      const offset = index - startRef.current;
      if (offset < 0) return null;
      return viewport.querySelectorAll<HTMLElement>(SLIDE_SELECTOR)[offset] ?? null;
    }, []);

    const slides: React.ReactNode[] = [];
    if (itemIds) {
      for (let index = start; index < end; index += 1) {
        const itemId = itemIds[index]!;
        slides.push(<React.Fragment key={itemId}>{children(index, itemId)}</React.Fragment>);
      }
    }

    return (
      <LightboxSlidesEngine
        {...slidesProps}
        ref={forwardedRef}
        preload={preload}
        measureGeometry={measureGeometry}
        resolveSlideElement={resolveSlideElement}
      >
        <VirtualSlidesSpacer slides={start} />
        {slides}
        <VirtualSlidesSpacer slides={count - end} />
      </LightboxSlidesEngine>
    );
  },
);

LightboxVirtualSlides.displayName = 'LightboxVirtualSlides';

/**
 * Stands in for `slides` unmounted slides. As a flex item it gets one track
 * gap next to it, so it spans `slides × (100% + gap) − gap`.
 */
function VirtualSlidesSpacer({ slides }: { slides: number }) {
  if (slides <= 0) return null;
  return (
    <div
      aria-hidden
      style={{
        flex: 'none',
        width: `calc(${slides} * (100% + var(${GAP_VAR}, 0px)) - var(${GAP_VAR}, 0px))`,
        pointerEvents: 'none',
      }}
    />
  );
}

export { LightboxVirtualSlides };
export type { LightboxVirtualSlidesProps };
