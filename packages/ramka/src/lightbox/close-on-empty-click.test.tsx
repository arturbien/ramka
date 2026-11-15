import { render, screen, fireEvent, act } from '@testing-library/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { LightboxCaption } from './lightbox-caption';
import { LightboxClose } from './lightbox-close';
import { LightboxContent } from './lightbox-content';
import { LightboxCounter } from './lightbox-counter';
import { LightboxItem } from './lightbox-item';
import { LightboxMedia } from './lightbox-media';
import { LightboxNext } from './lightbox-next';
import { LightboxPortal } from './lightbox-portal';
import { LightboxRoot } from './lightbox-root';
import { LightboxSlide } from './lightbox-slide';
import { LightboxSlides } from './lightbox-slides';
import { LightboxStage } from './lightbox-stage';
import { LightboxThumbnail } from './lightbox-thumbnail';
import { LightboxThumbnailGroup } from './lightbox-thumbnail-group';
import { LightboxTrigger } from './lightbox-trigger';
import { LightboxZoom, type LightboxZoomRef } from './lightbox-zoom';
import {
  endScroll,
  flushRaf,
  installSlidesLayoutMocks,
  resetSlidesLayoutMocks,
  setupGeometry,
  type ZoomRefObject,
} from './lightbox-slides-test-utils';
import {
  LightboxCaptionDataAttributes,
  LightboxContentDataAttributes,
  LightboxCounterDataAttributes,
  LightboxDocumentDataAttributes,
  LightboxMediaDataAttributes,
  LightboxThumbnailGroupDataAttributes,
  LightboxThumbnailStripDataAttributes,
} from './lightbox-data-attributes';
import {
  BUSY_CONTENT_ATTRIBUTES,
  EMPTY_CLICK_IGNORED_TARGET_SELECTOR,
  EMPTY_CLICK_MOVE_THRESHOLD,
  VIEW_TRANSITION_ATTRIBUTE,
} from './use-empty-click-close';

// ---------------------------------------------------------------------------
// `Lightbox.Content closeOnEmptyClick`. jsdom has no hit testing, so each test
// dispatches the press on the element a real click would land on; the real
// browser path (Slides covering Content in the default skin) is in
// e2e/close-on-empty-click.spec.ts.
// ---------------------------------------------------------------------------

const flushMicrotasks = () => act(async () => undefined);

const origPointerEvent = globalThis.PointerEvent;

beforeEach(() => {
  installSlidesLayoutMocks();
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
  } else {
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
  }
  // jsdom lacks PointerEvent (and pointer capture, used by pull-to-dismiss).
  if (!globalThis.PointerEvent) {
    (globalThis as Record<string, unknown>).PointerEvent = class PointerEvent extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;
      constructor(
        type: string,
        init: PointerEventInit & { pointerId?: number; pointerType?: string; isPrimary?: boolean } = {},
      ) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? 'mouse';
        this.isPrimary = init.isPrimary ?? false;
      }
    };
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.animate) {
    Element.prototype.animate = vi.fn(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      onfinish: null,
    })) as unknown as typeof Element.prototype.animate;
  }
});

afterEach(() => {
  resetSlidesLayoutMocks();
  vi.restoreAllMocks();
  if (origPointerEvent) {
    (globalThis as Record<string, unknown>).PointerEvent = origPointerEvent;
  }
});

function pointer(
  el: Element,
  type: string,
  init: { pointerId?: number; clientX?: number; clientY?: number; isPrimary?: boolean; pointerType?: string } = {},
) {
  act(() => {
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        clientX: 200,
        clientY: 200,
        ...init,
      }),
    );
  });
}

/** A stationary primary press + click on `el` (what a real tap/click delivers). */
function tap(el: Element, at = { clientX: 200, clientY: 200 }) {
  pointer(el, 'pointerdown', at);
  pointer(el, 'pointerup', at);
  fireEvent.click(el, { button: 0, detail: 1, ...at });
}

function isOpen() {
  // keepMounted parks a closed Content in the DOM with `data-closed`.
  return screen.queryByTestId('content')?.hasAttribute('data-open') ?? false;
}

/** Give `el` a layout box (jsdom has none) so point-in-box checks can see it. */
function mockBox(el: Element, box: { left: number; top: number; width: number; height: number }) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    ...box,
    x: box.left,
    y: box.top,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON: () => ({}),
  } as DOMRect);
}

function Viewer({
  closeOnEmptyClick = true,
  withStage = false,
  defaultOpen = true,
  keepMounted = false,
  zoomRef,
  onOpenChange,
  onClick,
  overlay,
}: {
  closeOnEmptyClick?: boolean;
  withStage?: boolean;
  defaultOpen?: boolean;
  keepMounted?: boolean;
  zoomRef?: ZoomRefObject<LightboxZoomRef>;
  onOpenChange?: (open: boolean) => void;
  onClick?: (event: React.MouseEvent) => void;
  overlay?: React.ReactNode;
}) {
  const slides = (
    <LightboxSlides data-testid="slides">
      {[0, 1, 2].map((i) => (
        <LightboxSlide key={i} data-testid={`slide-${i}`}>
          <LightboxItem index={i} data-testid={`item-${i}`} caption={`Caption ${i}`}>
            <LightboxZoom ref={i === 0 ? zoomRef : undefined} maxZoom={4} data-testid={`zoom-${i}`}>
              <LightboxMedia width={400} height={300} data-testid={`media-${i}`}>
                <img src={`${i}.jpg`} alt={`Image ${i}`} width={400} height={300} />
              </LightboxMedia>
            </LightboxZoom>
          </LightboxItem>
        </LightboxSlide>
      ))}
    </LightboxSlides>
  );
  const chrome = (
    <>
      <LightboxClose data-testid="close">Close</LightboxClose>
      <LightboxNext data-testid="next">Next</LightboxNext>
      <LightboxCounter data-testid="counter" />
      <LightboxCaption data-testid="caption" />
      <div data-testid="custom-chrome" data-ramka-no-pull="">
        <span data-testid="custom-chrome-label">Custom</span>
      </div>
      <LightboxThumbnailGroup data-testid="thumb-group">
        {[0, 1, 2].map((i) => (
          <LightboxThumbnail key={i} index={i} data-testid={`thumb-${i}`}>
            {i}
          </LightboxThumbnail>
        ))}
      </LightboxThumbnailGroup>
      {overlay}
    </>
  );
  return (
    <LightboxRoot defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <LightboxTrigger index={0} data-testid="trigger">
        Open
      </LightboxTrigger>
      <LightboxPortal keepMounted={keepMounted}>
        <LightboxContent
          data-testid="content"
          aria-label="Viewer"
          closeOnEmptyClick={closeOnEmptyClick}
          onClick={onClick}
        >
          {withStage ? (
            <>
              <LightboxStage data-testid="stage">
                {slides}
                {chrome}
              </LightboxStage>
              <aside data-testid="side-panel">
                <p data-testid="side-panel-text">Comments</p>
              </aside>
            </>
          ) : (
            <>
              {slides}
              {chrome}
            </>
          )}
        </LightboxContent>
      </LightboxPortal>
    </LightboxRoot>
  );
}

describe('Lightbox.Content closeOnEmptyClick', () => {
  describe('closes on empty viewer space', () => {
    it.each([
      ['slide (padding around the item)', 'slide-0'],
      ['item', 'item-0'],
      ['zoom box (letterbox around the media)', 'zoom-0'],
      ['slides scrollport', 'slides'],
    ])('closes on a click on the %s', async (_label, testId) => {
      const onOpenChange = vi.fn();
      render(<Viewer onOpenChange={onOpenChange} />);
      tap(screen.getByTestId(testId));
      await flushMicrotasks();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(isOpen()).toBe(false);
    });

    it('closes on the Zoom wrapper that fills the letterbox (the usual hit target)', async () => {
      render(<Viewer />);
      // Zoom renders an internal full-size flex wrapper around its children —
      // a letterbox click inside Zoom lands on it, not on the Zoom host.
      const wrapper = screen.getByTestId('media-0').parentElement!;
      expect(wrapper).not.toBe(screen.getByTestId('zoom-0'));
      tap(wrapper);
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('closes on empty Stage space when Stage is used', async () => {
      render(<Viewer withStage />);
      tap(screen.getByTestId('stage'));
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('closes on a touch tap (pointer + compatibility click) exactly once', async () => {
      const onOpenChange = vi.fn();
      render(<Viewer onOpenChange={onOpenChange} />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch' });
      pointer(slide, 'pointerup', { pointerType: 'touch' });
      // Nothing closes on pointerup — only the click does.
      expect(onOpenChange).not.toHaveBeenCalled();
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('a small wiggle under the tap threshold still counts as a click', async () => {
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { clientX: 200, clientY: 200 });
      pointer(slide, 'pointermove', { clientX: 204, clientY: 203 });
      pointer(slide, 'pointerup', { clientX: 204, clientY: 203 });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });
  });

  describe('keeps media and controls clickable', () => {
    it.each([
      ['media fit-box', 'media-0'],
      ['next button', 'next'],
      ['counter', 'counter'],
      ['caption', 'caption'],
      ['thumbnail', 'thumb-1'],
      ['thumbnail group', 'thumb-group'],
      ['[data-ramka-no-pull] chrome', 'custom-chrome-label'],
    ])('does not close on a click on the %s', async (_label, testId) => {
      render(<Viewer />);
      tap(screen.getByTestId(testId));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close on a click on the image', async () => {
      render(<Viewer />);
      tap(screen.getByAltText('Image 0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close on a click on a focusable element', async () => {
      render(
        <Viewer
          overlay={
            <div data-testid="focusable" tabIndex={0}>
              <span data-testid="focusable-child">Focusable</span>
            </div>
          }
        />,
      );
      tap(screen.getByTestId('focusable-child'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close on a side panel outside Stage', async () => {
      render(<Viewer withStage />);
      tap(screen.getByTestId('side-panel-text'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close for a click in a portaled overlay re-bubbled through the React tree', async () => {
      function PortaledMenu() {
        return ReactDOM.createPortal(<div data-testid="portaled">Menu</div>, document.body);
      }
      render(<Viewer overlay={<PortaledMenu />} />);
      tap(screen.getByTestId('portaled'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close when the press started on the media and the click was retargeted', async () => {
      // A drag from the image to the letterbox fires `click` on their common
      // ancestor (here the Zoom wrapper) — an empty target, but not an empty press.
      render(<Viewer />);
      const img = screen.getByAltText('Image 0');
      const wrapper = screen.getByTestId('media-0').parentElement!;
      pointer(img, 'pointerdown');
      pointer(wrapper, 'pointerup');
      fireEvent.click(wrapper, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('a consumer onClick that calls preventDefault cancels the close', async () => {
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      render(<Viewer onClick={onClick} />);
      tap(screen.getByTestId('slide-0'));
      await flushMicrotasks();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(isOpen()).toBe(true);
    });

    it('does not close on a pointer-events:none (disabled) control the click fell through', async () => {
      // `disabled:pointer-events-none` hands the click to whatever is behind
      // the button — here the slide, an empty target.
      render(
        <Viewer
          overlay={
            <button type="button" disabled data-testid="disabled" style={{ pointerEvents: 'none' }}>
              Zoom out
            </button>
          }
        />,
      );
      mockBox(screen.getByTestId('disabled'), { left: 180, top: 180, width: 40, height: 40 });
      tap(screen.getByTestId('slide-0'), { clientX: 200, clientY: 200 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);

      // Away from the button, the same slide click closes.
      tap(screen.getByTestId('slide-0'), { clientX: 400, clientY: 400 });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('ignores the second click of a double-click that opened the viewer', async () => {
      render(<Viewer defaultOpen={false} />);
      // First click of the double-click: the trigger opens the viewer.
      fireEvent.click(screen.getByTestId('trigger'), { button: 0, detail: 1 });
      expect(isOpen()).toBe(true);
      // Second click lands on the freshly opened slide.
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown');
      pointer(slide, 'pointerup');
      fireEvent.click(slide, { button: 0, detail: 2 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);

      // A fresh click afterwards closes.
      tap(slide);
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('ignores the later clicks of a triple-click that opened the viewer', async () => {
      render(<Viewer defaultOpen={false} />);
      fireEvent.click(screen.getByTestId('trigger'), { button: 0, detail: 1 });
      expect(isOpen()).toBe(true);
      const slide = screen.getByTestId('slide-0');
      for (const detail of [2, 3]) {
        pointer(slide, 'pointerdown');
        pointer(slide, 'pointerup');
        fireEvent.click(slide, { button: 0, detail });
        await flushMicrotasks();
        expect(isOpen()).toBe(true);
      }
    });

    it('a quick second click after a click on the media still closes', async () => {
      render(<Viewer />);
      tap(screen.getByAltText('Image 0'));
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown');
      pointer(slide, 'pointerup');
      fireEvent.click(slide, { button: 0, detail: 2 });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('ignores a non-primary button', async () => {
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { button: 1 } as never);
      fireEvent.click(slide, { button: 1, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('ignores a click with no press behind it (programmatic / keyboard)', async () => {
      render(<Viewer />);
      fireEvent.click(screen.getByTestId('slide-0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });
  });

  describe('defers to gestures', () => {
    it('does not close after a drag past the tap threshold', async () => {
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      const far = 200 + EMPTY_CLICK_MOVE_THRESHOLD + 5;
      pointer(slide, 'pointerdown', { clientX: 200, clientY: 200 });
      pointer(slide, 'pointermove', { clientX: far, clientY: 200 });
      // Back to the start: the click position alone would look like a tap.
      pointer(slide, 'pointermove', { clientX: 200, clientY: 200 });
      pointer(slide, 'pointerup', { clientX: 200, clientY: 200 });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close when the browser cancelled the press (native swipe)', async () => {
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch' });
      pointer(slide, 'pointercancel', { pointerType: 'touch' });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close when a second finger lands (pinch)', async () => {
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 1 });
      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 2, isPrimary: false });
      pointer(slide, 'pointerup', { pointerType: 'touch', pointerId: 2, isPrimary: false });
      pointer(slide, 'pointerup', { pointerType: 'touch', pointerId: 1 });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close while Slides is scrolling between slides', async () => {
      render(<Viewer />);
      const viewport = screen.getByTestId('slides');
      setupGeometry(viewport, 3);
      act(() => {
        viewport.scrollLeft = 40;
        fireEvent.scroll(viewport);
        flushRaf();
      });
      tap(screen.getByTestId('slide-0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);

      // Once the scroll settles, the same click closes.
      endScroll(viewport);
      tap(screen.getByTestId('slide-0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('does not close while zoomed', async () => {
      const zoomRef: ZoomRefObject<LightboxZoomRef> = { current: null };
      render(<Viewer zoomRef={zoomRef} />);
      act(() => zoomRef.current!.zoomTo(2));
      expect(screen.getByTestId('content')).toHaveAttribute('data-zoomed');
      tap(screen.getByTestId('slide-0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close while a pull is in flight', async () => {
      render(<Viewer />);
      const content = screen.getByTestId('content');
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch', clientX: 200, clientY: 200 });
      pointer(content, 'pointermove', { pointerType: 'touch', clientX: 200, clientY: 230 });
      expect(content).toHaveAttribute('data-pulling');
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close after a short pull that snaps back (within the tap slop)', async () => {
      // 8px: past the pull's 6px direction lock, under the 10px tap slop — so
      // only the pull state, not the movement, can veto the close.
      render(<Viewer />);
      const content = screen.getByTestId('content');
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch', clientX: 200, clientY: 200 });
      pointer(content, 'pointermove', { pointerType: 'touch', clientX: 200, clientY: 208 });
      expect(content).toHaveAttribute('data-pulling');
      // Real order: pointerup releases the pull into its snap-back, then click.
      pointer(content, 'pointerup', { pointerType: 'touch', clientX: 200, clientY: 208 });
      expect(content).toHaveAttribute('data-pull-snapping');
      fireEvent.click(slide, { button: 0, detail: 1, clientX: 200, clientY: 208 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close for a pinch that starts on the letterbox', async () => {
      render(<Viewer />);
      const letterbox = screen.getByTestId('media-0').parentElement!;
      pointer(letterbox, 'pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 150, clientY: 200 });
      pointer(letterbox, 'pointerdown', {
        pointerType: 'touch',
        pointerId: 2,
        isPrimary: false,
        clientX: 250,
        clientY: 200,
      });
      pointer(letterbox, 'pointerup', { pointerType: 'touch', pointerId: 2, isPrimary: false });
      pointer(letterbox, 'pointerup', { pointerType: 'touch', pointerId: 1 });
      fireEvent.click(letterbox, { button: 0, detail: 1, clientX: 150, clientY: 200 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it('does not close while an open/close morph is in flight', async () => {
      render(<Viewer />);
      document.documentElement.setAttribute('data-ramka-view-transition', 'opening');
      try {
        tap(screen.getByTestId('slide-0'));
        await flushMicrotasks();
        expect(isOpen()).toBe(true);
      } finally {
        document.documentElement.removeAttribute('data-ramka-view-transition');
      }
    });
  });

  describe('press bookkeeping', () => {
    it('a press that ended without a click does not swallow the next tap as a pinch', async () => {
      // Long-press / contextmenu, or a nudge whose touchmove was cancelled:
      // pointerdown + pointerup, no click.
      render(<Viewer />);
      const slide = screen.getByTestId('slide-0');
      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 1 });
      pointer(slide, 'pointerup', { pointerType: 'touch', pointerId: 1 });
      // Next tap: a new pointerId, as every touch gets.
      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 2 });
      pointer(slide, 'pointerup', { pointerType: 'touch', pointerId: 2 });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });

    it('a claimed press does not leak across close and reopen (Portal keepMounted)', async () => {
      render(<Viewer keepMounted />);
      const slide = screen.getByTestId('slide-0');
      // A press still down when the viewer closes (Close via keyboard).
      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 1 });
      fireEvent.keyDown(screen.getByTestId('content'), { key: 'Escape' });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);

      fireEvent.click(screen.getByTestId('trigger'), { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(true);

      pointer(slide, 'pointerdown', { pointerType: 'touch', pointerId: 2 });
      pointer(slide, 'pointerup', { pointerType: 'touch', pointerId: 2 });
      fireEvent.click(slide, { button: 0, detail: 1 });
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });
  });

  it('spells out the same attribute names the parts publish', () => {
    // The engine uses literals to stay off the shared data-attributes module.
    for (const attr of [
      LightboxMediaDataAttributes.media,
      LightboxCaptionDataAttributes.caption,
      LightboxCounterDataAttributes.counter,
      LightboxThumbnailGroupDataAttributes.thumbnailGroup,
      LightboxThumbnailStripDataAttributes.root,
    ]) {
      expect(EMPTY_CLICK_IGNORED_TARGET_SELECTOR.split(',')).toContain(`[${attr}]`);
    }
    expect(BUSY_CONTENT_ATTRIBUTES).toEqual([
      LightboxContentDataAttributes.pulling,
      LightboxContentDataAttributes.pullSnapping,
      LightboxContentDataAttributes.pullDismissing,
      LightboxContentDataAttributes.zooming,
      LightboxContentDataAttributes.zoomed,
    ]);
    expect(VIEW_TRANSITION_ATTRIBUTE).toBe(LightboxDocumentDataAttributes.viewTransition);
  });

  describe('opt-in', () => {
    it('does nothing when the prop is off (default)', async () => {
      render(<Viewer closeOnEmptyClick={false} />);
      tap(screen.getByTestId('slide-0'));
      tap(screen.getByTestId('zoom-0'));
      await flushMicrotasks();
      expect(isOpen()).toBe(true);
    });

    it.each([true, false])('keeps the scrim click on Content itself (closeOnEmptyClick=%s)', async (on) => {
      render(<Viewer closeOnEmptyClick={on} />);
      tap(screen.getByTestId('content'));
      await flushMicrotasks();
      expect(isOpen()).toBe(false);
    });
  });
});
