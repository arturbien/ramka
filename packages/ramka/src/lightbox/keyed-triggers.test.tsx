import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { LightboxContent } from './lightbox-content';
import { createHandle, type LightboxHandle } from './lightbox-handle';
import { LightboxItem } from './lightbox-item';
import { LightboxPortal } from './lightbox-portal';
import { LightboxRoot, type LightboxRootProps } from './lightbox-root';
import { flushRaf, installSlidesLayoutMocks, resetSlidesLayoutMocks, SlidesHost } from './lightbox-slides-test-utils';
import { LightboxTrigger } from './lightbox-trigger';
import { resetVtTouchGuardForTesting } from './vt-touch-guard';

/*
 * One Root serving many galleries (a chat feed): every message's images are
 * keyed Triggers on one handle, and the viewer renders whichever message's
 * images the opening Trigger's payload names. Indexes collide across messages
 * on purpose — message A's first image and message B's first image are both
 * index 0 — which is exactly what the `itemId` join has to keep apart.
 */

interface Message {
  id: string;
  images: string[];
}

interface Payload {
  messageId: string;
}

const MORPH = 'lightbox-morph';

function morphNameOf(el: Element | null): string {
  return (el as HTMLElement | null)?.style.getPropertyValue('view-transition-name') ?? '';
}

function mockViewTransitionAPI() {
  const startViewTransition = vi.fn((callback: () => void) => {
    callback();
    return { finished: new Promise<void>(() => {}) };
  });
  Object.defineProperty(document, 'startViewTransition', {
    value: startViewTransition,
    writable: true,
    configurable: true,
  });
  return startViewTransition;
}

let originalRect: PropertyDescriptor | undefined;

beforeAll(async () => {
  const { loadMorphRuntime } = await import('./lightbox-morph-loader');
  await loadMorphRuntime();
});

beforeEach(() => {
  installSlidesLayoutMocks();
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
  }
  // jsdom has no layout: give every element a box so both morph ends resolve.
  originalRect = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect');
  Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
    value: () => ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} }),
    writable: true,
    configurable: true,
  });
  mockViewTransitionAPI();
});

afterEach(() => {
  cleanup();
  if (originalRect) Object.defineProperty(Element.prototype, 'getBoundingClientRect', originalRect);
  delete (document as unknown as Record<string, unknown>).startViewTransition;
  for (const attr of [...document.documentElement.attributes]) {
    if (attr.name.startsWith('data-ramka')) document.documentElement.removeAttribute(attr.name);
  }
  document.documentElement.removeAttribute('style');
  resetVtTouchGuardForTesting();
  resetSlidesLayoutMocks();
  vi.restoreAllMocks();
});

const renderCounts = new Map<string, number>();

function MessageTiles({
  message,
  handle,
  visible = 4,
}: {
  message: Message;
  handle: LightboxHandle<Payload>;
  visible?: number;
}) {
  const extra = message.images.length - visible;
  return (
    <div>
      {message.images.slice(0, visible).map((src, i) => (
        <LightboxTrigger
          key={src}
          handle={handle}
          itemId={src}
          payload={{ messageId: message.id }}
          crossfade={i === visible - 1 && extra > 0 ? 'both' : undefined}
          data-testid={`t-${src}`}
        >
          {({ imageRef }) => {
            renderCounts.set(src, (renderCounts.get(src) ?? 0) + 1);
            return (
              <>
                <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />
                {i === visible - 1 && extra > 0 ? <span>+{extra}</span> : null}
              </>
            );
          }}
        </LightboxTrigger>
      ))}
    </div>
  );
}

function Viewer({
  handle,
  messages,
  reverse = false,
  onPayload,
  ...rootProps
}: {
  handle: LightboxHandle<Payload>;
  messages: Message[];
  reverse?: boolean;
  onPayload?: (payload: Payload | undefined) => void;
} & Omit<LightboxRootProps<Payload>, 'children' | 'handle'>) {
  return (
    <LightboxRoot handle={handle} viewTransition awaitImageDecode={false} {...rootProps}>
      {({ payload }) => {
        onPayload?.(payload);
        const message = messages.find((m) => m.id === payload?.messageId);
        const images = message ? (reverse ? [...message.images].reverse() : message.images) : [];
        return (
          <LightboxPortal>
            <LightboxContent aria-label="Viewer" data-testid="content">
              <SlidesHost slideCount={images.length}>
                {images.map((src, i) => (
                  <LightboxItem key={src} index={i} itemId={src} data-testid={`item-${src}`}>
                    {({ imageRef }) => <img ref={imageRef} src={`${src}-full.jpg`} alt="" />}
                  </LightboxItem>
                ))}
              </SlidesHost>
            </LightboxContent>
          </LightboxPortal>
        );
      }}
    </LightboxRoot>
  );
}

const messageA: Message = { id: 'A', images: ['a0', 'a1', 'a2'] };
const messageB: Message = { id: 'B', images: ['b0', 'b1', 'b2'] };

function hiddenTriggers() {
  return [...document.querySelectorAll('[data-morph-target]')].map((el) => el.getAttribute('data-testid'));
}

describe('keyed triggers (one Root, many galleries)', () => {
  it('renders the opening trigger payload and opens at its item', () => {
    const handle = createHandle<Payload>();
    const onPayload = vi.fn();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} onPayload={onPayload} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));

    expect(onPayload).toHaveBeenLastCalledWith({ messageId: 'B' });
    expect(screen.getByTestId('item-b1')).toHaveAttribute('data-active');
    expect(screen.queryByTestId('item-a1')).toBeNull();
  });

  it('hides only the opening gallery trigger, never a same-index trigger in another gallery', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b0'));
    expect(hiddenTriggers()).toEqual(['t-b0']);

    act(() => handle.goTo(1));
    expect(hiddenTriggers()).toEqual(['t-b1']);
  });

  it('marks only the origin trigger as expanded and controlling the dialog', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b0'));
    const contentId = screen.getByTestId('content').id;
    expect(screen.getByTestId('t-b0')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('t-b0')).toHaveAttribute('aria-controls', contentId);
    expect(screen.getByTestId('t-a0')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('t-a0')).not.toHaveAttribute('aria-controls');
  });

  it('morphs from the clicked trigger and resolves its item when the viewer order differs', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} reverse />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b0'));

    // Reversed viewer: b0 is the LAST slide, and it is the one opened.
    expect(screen.getByTestId('item-b0')).toHaveAttribute('data-index', '2');
    expect(screen.getByTestId('item-b0')).toHaveAttribute('data-active');
    expect(morphNameOf(screen.getByTestId('item-b0').querySelector('img'))).toBe(MORPH);
  });

  it('closes onto the trigger of the open gallery, not a same-index one elsewhere', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-a0'));
    act(() => handle.close());

    expect(morphNameOf(screen.getByTestId('t-a0'))).toBe(MORPH);
    expect(morphNameOf(screen.getByTestId('t-b0'))).toBe('');
  });

  it('+N: hidden items close to the nearest tile of their own gallery', () => {
    const handle = createHandle<Payload>();
    const big: Message = { id: 'big', images: ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'] };
    // Another message whose triggers sit at the same indexes as big's hidden
    // extras (4–6) — the global `closest` search used to pick these.
    const other: Message = { id: 'other', images: ['o0', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6'] };
    render(
      <>
        <MessageTiles message={big} handle={handle} visible={4} />
        <MessageTiles message={other} handle={handle} visible={7} />
        <Viewer handle={handle} messages={[big, other]} morphTo="closest" />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-p3'));
    expect(screen.getByTestId('t-p3')).toHaveAttribute('data-crossfade', 'both');

    act(() => handle.goTo(5));
    expect(screen.getByTestId('item-p5')).toHaveAttribute('data-active');
    expect(hiddenTriggers()).toEqual(['t-p3']);

    act(() => handle.close());
    expect(morphNameOf(screen.getByTestId('t-p3'))).toBe(MORPH);
    expect(morphNameOf(screen.getByTestId('t-o5'))).toBe('');
  });

  it('+N with overflowItemIds: one flat gallery across messages closes hidden items onto their tile', () => {
    const handle = createHandle<Payload>();
    const x: Message = { id: 'x', images: ['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6'] };
    const y: Message = { id: 'y', images: ['y0', 'y1'] };
    const all: Message = { id: 'all', images: [...x.images, ...y.images] };
    function Tiles({ message }: { message: Message }) {
      const tiles = message.images.slice(0, 4);
      const hidden = message.images.slice(4);
      return (
        <>
          {tiles.map((src, i) => (
            <LightboxTrigger
              key={src}
              handle={handle}
              itemId={src}
              overflowItemIds={i === 3 ? hidden : undefined}
              payload={{ messageId: 'all' }}
              data-testid={`t-${src}`}
            >
              {({ imageRef }) => <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />}
            </LightboxTrigger>
          ))}
        </>
      );
    }
    render(
      <>
        <Tiles message={x} />
        <Tiles message={y} />
        <Viewer handle={handle} messages={[all]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-x3'));
    act(() => handle.goTo(6));
    // x6 is hidden behind x's "+3" tile. With `closest` over the flat index
    // it would have picked y0 (one slide away) — the next message.
    expect(hiddenTriggers()).toEqual(['t-x3']);

    act(() => handle.goTo(7));
    expect(hiddenTriggers()).toEqual(['t-y0']);

    act(() => handle.goTo(5));
    act(() => handle.close());
    expect(morphNameOf(screen.getByTestId('t-x3'))).toBe(MORPH);
    expect(morphNameOf(screen.getByTestId('t-y0'))).toBe('');
  });

  it('re-renders only the triggers whose state changed', () => {
    const handle = createHandle<Payload>();
    const messages = Array.from({ length: 20 }, (_, m) => ({
      id: `m${m}`,
      images: [`m${m}-0`, `m${m}-1`, `m${m}-2`],
    }));
    render(
      <>
        {messages.map((message) => (
          <MessageTiles key={message.id} message={message} handle={handle} />
        ))}
        <Viewer handle={handle} messages={messages} />
      </>,
    );
    renderCounts.clear();

    fireEvent.click(screen.getByTestId('t-m7-1'));
    act(() => handle.goTo(2));

    // Only the open message's tiles flip state; the other 57 never render.
    expect([...renderCounts.keys()].sort()).toEqual(['m7-0', 'm7-1', 'm7-2']);
    expect(screen.getByTestId('t-m7-0')).toHaveAttribute('data-popup-open');
    expect(screen.getByTestId('t-m6-0')).not.toHaveAttribute('data-popup-open');
  });

  it('asks to reveal an unmounted trigger before closing, then morphs onto it', () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    const revealTrigger = vi.fn(() => setMounted(true));
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} revealTrigger={revealTrigger} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    // The row scrolls out of the virtualized list while the viewer is open.
    act(() => setMounted(false));
    act(() => handle.close());

    expect(revealTrigger).toHaveBeenCalledWith({ itemId: 'b1', index: 1, payload: { messageId: 'B' } });
    // The close waits for the trigger to register instead of fading.
    expect(handle.isOpen).toBe(true);
    act(() => flushRaf());

    expect(handle.isOpen).toBe(false);
    expect(morphNameOf(screen.getByTestId('t-b1'))).toBe(MORPH);
  });

  it('closes anyway when a revealed trigger never mounts', () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    const revealTrigger = vi.fn();
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} revealTrigger={revealTrigger} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    act(() => setMounted(false));
    act(() => handle.close());
    for (let i = 0; i < 10 && handle.isOpen; i += 1) act(() => flushRaf());

    expect(revealTrigger).toHaveBeenCalledOnce();
    expect(handle.isOpen).toBe(false);
  });

  it('opens from handle.open({ itemId, payload }) without a trigger element', () => {
    const handle = createHandle<Payload>();
    render(<Viewer handle={handle} messages={[messageA, messageB]} />);

    act(() => handle.open({ itemId: 'a2', payload: { messageId: 'A' } }));

    expect(screen.getByTestId('item-a2')).toHaveAttribute('data-active');
  });

  it('warns when the opened itemId has no item in the payload', () => {
    const handle = createHandle<Payload>();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Viewer handle={handle} messages={[messageA]} />);

    act(() => handle.open({ itemId: 'nope', payload: { messageId: 'A' } }));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('itemId "nope"'));
  });
});
