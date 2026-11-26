import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LightboxContent } from './lightbox-content';
import { LightboxCounter } from './lightbox-counter';
import { createHandle, type LightboxHandle } from './lightbox-handle';
import { LightboxItem } from './lightbox-item';
import { LightboxNext } from './lightbox-next';
import { LightboxPortal } from './lightbox-portal';
import { LightboxPrevious } from './lightbox-previous';
import { LightboxRoot } from './lightbox-root';
import { LightboxSlide } from './lightbox-slide';
import { LightboxTrigger } from './lightbox-trigger';
import { LightboxVirtualSlides } from './lightbox-virtual-slides';
import {
  SLIDE_TEST_WIDTH as WIDTH,
  endScroll,
  flushRaf,
  flushResizeObservers,
  installSlidesLayoutMocks,
  resetSlidesLayoutMocks,
  swipeTo,
} from './lightbox-slides-test-utils';

const COUNT = 1000;
const IDS = Array.from({ length: COUNT }, (_, i) => `photo-${i}`);

beforeEach(() => {
  installSlidesLayoutMocks();
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
    const index = this.dataset.slideIndex;
    return index === undefined ? 0 : Number(index) * WIDTH;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.dataset.slideIndex === undefined ? 0 : WIDTH;
  });
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
  } else {
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
  }
});

afterEach(() => {
  resetSlidesLayoutMocks();
  vi.restoreAllMocks();
});

function VirtualGallery({
  ids = IDS,
  defaultOpen = true,
  defaultValue,
  loop,
  handle,
  onValueChange,
  triggers = [],
}: {
  ids?: string[] | null;
  defaultOpen?: boolean;
  defaultValue?: string;
  loop?: boolean;
  handle?: LightboxHandle;
  onValueChange?: (value: string, details: { index: number; source: string }) => void;
  triggers?: string[];
}) {
  return (
    <LightboxRoot
      itemIds={ids ?? undefined}
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      loop={loop}
      handle={handle}
      onValueChange={onValueChange}
      viewTransition={false}
    >
      {triggers.map((id) => (
        <LightboxTrigger key={id} itemId={id} data-testid={`trigger-${id}`}>
          {id}
        </LightboxTrigger>
      ))}
      <LightboxPortal>
        <LightboxContent data-testid="content" aria-label="Photos">
          <LightboxVirtualSlides data-testid="slides" aria-label="Photos">
            {(index, itemId) => (
              <LightboxSlide data-slide-index={index} data-testid={`slide-${itemId}`}>
                <LightboxItem index={index} itemId={itemId} data-testid={`item-${itemId}`}>
                  {itemId}
                </LightboxItem>
              </LightboxSlide>
            )}
          </LightboxVirtualSlides>
          <LightboxPrevious data-testid="previous">Previous</LightboxPrevious>
          <LightboxNext data-testid="next">Next</LightboxNext>
          <LightboxCounter data-testid="counter" />
        </LightboxContent>
      </LightboxPortal>
    </LightboxRoot>
  );
}

function setupViewport() {
  const viewport = screen.getByTestId('slides');
  let scrollLeft = viewport.scrollLeft;
  Object.defineProperty(viewport, 'clientWidth', { configurable: true, get: () => WIDTH });
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, get: () => WIDTH });
  Object.defineProperty(viewport, 'scrollWidth', { configurable: true, get: () => WIDTH * COUNT });
  Object.defineProperty(viewport, 'scrollLeft', {
    configurable: true,
    get: () => scrollLeft,
    set: (value: number) => {
      scrollLeft = value;
    },
  });
  flushResizeObservers();
  return viewport;
}

function mountedSlideIndexes(): number[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-ramka-slide]'), (slide) =>
    Number(slide.dataset.slideIndex),
  );
}

function spacerWidths(): string[] {
  return Array.from(screen.getByTestId('slides').children)
    .filter((child) => !(child as HTMLElement).hasAttribute('data-ramka-slide'))
    .map((child) => (child as HTMLElement).style.width);
}

describe('Lightbox.VirtualSlides', () => {
  it('mounts only the window around the active slide, with spacers for the rest', () => {
    render(<VirtualGallery defaultValue="photo-500" />);
    expect(mountedSlideIndexes()).toEqual([497, 498, 499, 500, 501, 502, 503]);
    const [leading, trailing] = spacerWidths();
    expect(leading).toContain('497 *');
    expect(trailing).toContain('496 *');
  });

  it('drops the leading spacer at the start of the gallery', () => {
    render(<VirtualGallery defaultValue="photo-0" />);
    expect(mountedSlideIndexes()).toEqual([0, 1, 2, 3]);
    expect(spacerWidths()).toHaveLength(1);
    expect(spacerWidths()[0]).toContain('996 *');
  });

  it('counts the whole gallery, not the mounted window', () => {
    render(<VirtualGallery defaultValue="photo-998" />);
    expect(screen.getByTestId('counter').textContent).toContain('/ 1000');
    expect(screen.getByTestId('next')).not.toBeDisabled();
  });

  it('scrolls to the active slide on open', () => {
    render(<VirtualGallery defaultValue="photo-500" />);
    const viewport = setupViewport();
    expect(viewport.scrollLeft).toBe(500 * WIDTH);
  });

  it('jumps to the last slide with End and mounts the window there', () => {
    const onValueChange = vi.fn();
    render(<VirtualGallery defaultValue="photo-0" onValueChange={onValueChange} />);
    const viewport = setupViewport();
    act(() => {
      fireEvent.keyDown(screen.getByTestId('content'), { key: 'End' });
      flushRaf();
    });
    expect(viewport.scrollLeft).toBe(999 * WIDTH);
    expect(mountedSlideIndexes()).toEqual([996, 997, 998, 999]);
    expect(onValueChange).toHaveBeenLastCalledWith('photo-999', expect.objectContaining({ index: 999 }));
    expect(screen.getByTestId('item-photo-999')).toHaveAttribute('data-active');
  });

  it('recentres the window after a swipe', () => {
    render(<VirtualGallery defaultValue="photo-500" />);
    const viewport = setupViewport();
    swipeTo(viewport, 501);
    endScroll(viewport);
    expect(screen.getByTestId('item-photo-501')).toHaveAttribute('data-active');
    expect(mountedSlideIndexes()).toEqual([498, 499, 500, 501, 502, 503, 504]);
    expect(viewport.scrollLeft).toBe(501 * WIDTH);
  });

  it('navigates with Next and Previous', () => {
    render(<VirtualGallery defaultValue="photo-500" />);
    const viewport = setupViewport();
    act(() => {
      fireEvent.click(screen.getByTestId('next'));
      flushRaf();
    });
    expect(screen.getByTestId('item-photo-501')).toHaveAttribute('data-active');
    expect(viewport.scrollLeft).toBe(501 * WIDTH);
    for (let i = 0; i < 2; i += 1) {
      act(() => {
        fireEvent.click(screen.getByTestId('previous'));
        flushRaf();
      });
    }
    expect(screen.getByTestId('item-photo-499')).toHaveAttribute('data-active');
    expect(viewport.scrollLeft).toBe(499 * WIDTH);
  });

  it('wraps with loop', () => {
    render(<VirtualGallery defaultValue="photo-0" loop />);
    const viewport = setupViewport();
    act(() => {
      fireEvent.click(screen.getByTestId('previous'));
      flushRaf();
    });
    expect(screen.getByTestId('item-photo-999')).toHaveAttribute('data-active');
    expect(viewport.scrollLeft).toBe(999 * WIDTH);
  });

  it('opens on an item whose slide is not mounted', () => {
    const handle = createHandle();
    const onValueChange = vi.fn();
    render(<VirtualGallery defaultOpen={false} handle={handle} onValueChange={onValueChange} />);
    act(() => handle.open('photo-800'));
    expect(screen.getByTestId('item-photo-800')).toHaveAttribute('data-active');
    expect(mountedSlideIndexes()).toEqual([797, 798, 799, 800, 801, 802, 803]);
    expect(onValueChange).toHaveBeenLastCalledWith('photo-800', expect.objectContaining({ index: 800 }));
  });

  it('opens from a trigger whose slide is not mounted', () => {
    render(<VirtualGallery defaultOpen={false} triggers={['photo-0', 'photo-640']} />);
    fireEvent.click(screen.getByTestId('trigger-photo-640'));
    expect(screen.getByTestId('item-photo-640')).toHaveAttribute('data-active');
    expect(screen.getByTestId('trigger-photo-640')).toHaveAttribute('aria-expanded', 'true');
  });

  it('goes to an item whose slide is not mounted', () => {
    const handle = createHandle();
    render(<VirtualGallery defaultValue="photo-0" handle={handle} />);
    const viewport = setupViewport();
    act(() => {
      handle.goTo('photo-420');
      flushRaf();
    });
    expect(screen.getByTestId('item-photo-420')).toHaveAttribute('data-active');
    expect(viewport.scrollLeft).toBe(420 * WIDTH);
  });

  it('marks the trigger of an unmounted slide active once it is the current item', () => {
    const handle = createHandle();
    render(<VirtualGallery defaultValue="photo-0" handle={handle} triggers={['photo-0', 'photo-900']} />);
    setupViewport();
    expect(screen.getByTestId('trigger-photo-900')).not.toHaveAttribute('data-active');
    act(() => {
      handle.goTo('photo-900');
      flushRaf();
    });
    expect(screen.getByTestId('trigger-photo-900')).toHaveAttribute('data-active');
    expect(screen.getByTestId('trigger-photo-900')).not.toHaveAttribute('data-popup-open');
  });

  it('warns without itemIds on Root', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<VirtualGallery ids={null} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs `itemIds` on Lightbox.Root'));
    expect(mountedSlideIndexes()).toEqual([]);
  });
});
