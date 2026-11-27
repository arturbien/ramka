import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { LightboxContent } from './lightbox-content';
import { useLightboxPayload } from './lightbox-context';
import { createHandle, subscribeLightboxHandle, type LightboxHandle } from './lightbox-handle';
import { LightboxItem } from './lightbox-item';
import { LightboxPortal } from './lightbox-portal';
import { LightboxRoot, type LightboxRootProps } from './lightbox-root';
import { flushRaf, installSlidesLayoutMocks, resetSlidesLayoutMocks, SlidesHost } from './lightbox-slides-test-utils';
import { LightboxTrigger } from './lightbox-trigger';
import { resetVtInputGuardForTesting } from './vt-input-guard';

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

// A close's reveal wait starts once the morph runtime chunk resolves, so let
// promises settle between frames.
async function settleRevealWait(handle: LightboxHandle<Payload>, maxFrames: number) {
  for (let i = 0; i < maxFrames && handle.isOpen; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      flushRaf();
    });
  }
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
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
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
  resetVtInputGuardForTesting();
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
  keepMounted = false,
  onPayload,
  ...rootProps
}: {
  handle?: LightboxHandle<Payload>;
  messages: Message[];
  reverse?: boolean;
  keepMounted?: boolean;
  onPayload?: (payload: Payload | undefined) => void;
} & Omit<LightboxRootProps<Payload>, 'children' | 'handle'>) {
  return (
    <LightboxRoot handle={handle} viewTransition awaitImageDecode={false} {...rootProps}>
      <ViewerBody messages={messages} reverse={reverse} keepMounted={keepMounted} onPayload={onPayload} />
    </LightboxRoot>
  );
}

function ViewerBody({
  messages,
  reverse,
  keepMounted,
  onPayload,
}: {
  messages: Message[];
  reverse: boolean;
  keepMounted: boolean;
  onPayload?: (payload: Payload | undefined) => void;
}) {
  const payload = useLightboxPayload<Payload>();
  onPayload?.(payload);
  const message = messages.find((m) => m.id === payload?.messageId);
  const images = message ? (reverse ? [...message.images].reverse() : message.images) : [];
  return (
    <LightboxPortal keepMounted={keepMounted}>
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
}

const messageA: Message = { id: 'A', images: ['a0', 'a1', 'a2'] };
const messageB: Message = { id: 'B', images: ['b0', 'b1', 'b2'] };

function hiddenTriggers() {
  return [...document.querySelectorAll('[data-morph-target]')].map((el) => el.getAttribute('data-testid'));
}

// Compile-time only: the Trigger props union.
export function triggerPropTypeChecks(handle: LightboxHandle<Payload>, untyped: LightboxHandle) {
  return (
    <>
      <LightboxTrigger itemId="a" />
      <LightboxTrigger itemId="a" overflowItemIds={['b']} />
      <LightboxTrigger handle={handle} itemId="a" payload={{ messageId: 'A' }} />
      <LightboxTrigger handle={untyped} itemId="a" />
      {/* @ts-expect-error a Trigger needs an `itemId` */}
      <LightboxTrigger />
      {/* @ts-expect-error `index` is not a Trigger prop */}
      <LightboxTrigger index={0} itemId="a" />
      {/* @ts-expect-error `overflowItemIds` needs `itemId` */}
      <LightboxTrigger overflowItemIds={['b']} />
      {/* @ts-expect-error a typed handle requires `payload` */}
      <LightboxTrigger handle={handle} itemId="a" />
      {/* @ts-expect-error `payload` must match the handle's type */}
      <LightboxTrigger handle={handle} itemId="a" payload={{ other: 1 }} />
    </>
  );
}

// Compile-time only: handle, hook and Root typing.
export function apiTypeChecks(handle: LightboxHandle<Payload>) {
  const plain: LightboxHandle = handle;
  handle.open('a', { payload: { messageId: 'A' } });
  handle.goTo('a');
  // @ts-expect-error open takes an itemId, not an index
  handle.open(0);
  // @ts-expect-error goTo takes an itemId, not an index
  handle.goTo(1);
  // @ts-expect-error open's payload must match the handle's type
  handle.open('a', { payload: { other: 1 } });
  function UsesPayload() {
    const payload: Payload | undefined = useLightboxPayload<Payload>();
    return <>{payload?.messageId}</>;
  }
  return (
    <>
      <UsesPayload />
      <LightboxRoot handle={plain} scrollTriggerIntoView={{ type: 'onClose', reveal: () => {} }} />
      <LightboxRoot handle={handle} scrollTriggerIntoView={[{ type: 'onChange', reveal: () => false }]} />
      <LightboxRoot
        handle={handle}
        scrollTriggerIntoView={{ type: 'onClose', reveal: ({ payload }) => Promise.resolve(payload?.messageId) }}
      />
      {/* @ts-expect-error reveal returns void, false, or a Promise */}
      <LightboxRoot handle={handle} scrollTriggerIntoView={{ type: 'onClose', reveal: () => true }} />
    </>
  );
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

    act(() => handle.goTo('b1'));
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

    act(() => handle.goTo('p5'));
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
    act(() => handle.goTo('x6'));
    // x6 is hidden behind x's "+3" tile. With `closest` over the flat index
    // it would have picked y0 (one slide away) — the next message.
    expect(hiddenTriggers()).toEqual(['t-x3']);

    act(() => handle.goTo('y0'));
    expect(hiddenTriggers()).toEqual(['t-y0']);

    act(() => handle.goTo('x5'));
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
    act(() => handle.goTo('m7-2'));

    // Only the opener and the newly active tile flip state; the other 58,
    // including the rest of the open message, never render.
    expect([...renderCounts.keys()].sort()).toEqual(['m7-1', 'm7-2']);
    expect(screen.getByTestId('t-m7-1')).toHaveAttribute('data-popup-open');
    expect(screen.getByTestId('t-m7-2')).toHaveAttribute('data-active');
    expect(screen.getByTestId('t-m7-2')).not.toHaveAttribute('data-popup-open');
    expect(screen.getByTestId('t-m7-0')).not.toHaveAttribute('data-popup-open');
  });

  it('asks to reveal an unmounted trigger before closing, then morphs onto it', async () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    const reveal = vi.fn(() => setMounted(true));
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} scrollTriggerIntoView={{ type: 'onClose', reveal }} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    // The row scrolls out of the virtualized list while the viewer is open.
    act(() => setMounted(false));
    act(() => handle.close());

    expect(reveal).toHaveBeenCalledWith({
      itemId: 'b1',
      index: 1,
      payload: { messageId: 'B' },
      reason: 'onClose',
      signal: expect.any(AbortSignal),
    });
    // The close waits for the trigger to register and its rect to settle.
    expect(handle.isOpen).toBe(true);
    await settleRevealWait(handle, 5);

    expect(handle.isOpen).toBe(false);
    expect(morphNameOf(screen.getByTestId('t-b1'))).toBe(MORPH);
  });

  it('closes anyway when a revealed trigger never mounts', async () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    const reveal = vi.fn();
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} scrollTriggerIntoView={{ type: 'onClose', reveal }} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    act(() => setMounted(false));
    act(() => handle.close());
    await settleRevealWait(handle, 10);

    expect(reveal).toHaveBeenCalledOnce();
    expect(handle.isOpen).toBe(false);
  });

  it('opens from handle.open(itemId, { payload }) without a trigger element', () => {
    const handle = createHandle<Payload>();
    render(<Viewer handle={handle} messages={[messageA, messageB]} />);

    act(() => handle.open('a2', { payload: { messageId: 'A' } }));

    expect(screen.getByTestId('item-a2')).toHaveAttribute('data-active');
  });

  it('warns when the opened itemId has no item in the payload', () => {
    const handle = createHandle<Payload>();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Viewer handle={handle} messages={[messageA]} />);

    act(() => handle.open('nope', { payload: { messageId: 'A' } }));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('itemId "nope"'));
  });

  it('keepMounted: reopening with an equal-content fresh payload lands on the clicked item', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <Viewer handle={handle} messages={[messageA]} keepMounted />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-a0'));
    act(() => handle.close());
    for (let i = 0; i < 5; i += 1) act(() => flushRaf());
    // MessageTiles passes a new `{ messageId }` object every render.
    fireEvent.click(screen.getByTestId('t-a2'));

    expect(screen.getByTestId('item-a2')).toHaveAttribute('data-active');
  });

  it('handle.open(itemId) morphs from and marks the mounted trigger for that item', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} />
      </>,
    );

    act(() => handle.open('b2', { payload: { messageId: 'B' } }));

    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
    expect(hiddenTriggers()).toEqual(['t-b2']);
    expect(screen.getByTestId('t-b2')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('t-a2')).toHaveAttribute('aria-expanded', 'false');
  });

  it('goTo(itemId) navigates by item and onValueChange reports the itemId', () => {
    const handle = createHandle<Payload>();
    const onValueChange = vi.fn();
    render(
      <>
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageB]} onValueChange={onValueChange} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b0'));
    act(() => handle.goTo('b2'));

    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
    expect(onValueChange).toHaveBeenLastCalledWith('b2', expect.objectContaining({ index: 2 }));
  });

  it('keyed triggers work inside a Root without a handle', () => {
    function InlineViewer() {
      const payload = useLightboxPayload<Payload>();
      const message = [messageA, messageB].find((m) => m.id === payload?.messageId);
      return (
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
            <SlidesHost slideCount={message?.images.length ?? 0}>
              {(message?.images ?? []).map((src, i) => (
                <LightboxItem key={src} index={i} itemId={src} data-testid={`item-${src}`}>
                  {({ imageRef }) => <img ref={imageRef} src={`${src}-full.jpg`} alt="" />}
                </LightboxItem>
              ))}
            </SlidesHost>
          </LightboxContent>
        </LightboxPortal>
      );
    }
    function Inline() {
      return (
        <LightboxRoot viewTransition awaitImageDecode={false}>
          {[messageA, messageB].map((m) =>
            m.images.map((src) => (
              <LightboxTrigger key={src} itemId={src} payload={{ messageId: m.id }} data-testid={`t-${src}`}>
                {({ imageRef }) => <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />}
              </LightboxTrigger>
            )),
          )}
          <InlineViewer />
        </LightboxRoot>
      );
    }
    render(<Inline />);

    fireEvent.click(screen.getByTestId('t-b1'));

    expect(screen.getByTestId('item-b1')).toHaveAttribute('data-active');
    expect(screen.queryByTestId('item-a1')).toBeNull();
    expect(hiddenTriggers()).toEqual(['t-b1']);
    expect(screen.getByTestId('t-b1')).toHaveAttribute('aria-expanded', 'true');
  });

  it('reveal returning false closes without waiting', () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          scrollTriggerIntoView={{ type: 'onClose', reveal: () => false }}
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    act(() => setMounted(false));
    act(() => handle.close());

    expect(handle.isOpen).toBe(false);
  });

  it('reveal returning a Promise waits for it before measuring', async () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    let resolve: () => void = () => {};
    const reveal = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} scrollTriggerIntoView={{ type: 'onClose', reveal }} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    act(() => setMounted(false));
    act(() => handle.close());
    for (let i = 0; i < 5; i += 1) act(() => flushRaf());
    expect(handle.isOpen).toBe(true);

    await act(async () => {
      setMounted(true);
      resolve();
    });
    await settleRevealWait(handle, 5);

    expect(handle.isOpen).toBe(false);
    expect(morphNameOf(screen.getByTestId('t-b1'))).toBe(MORPH);
  });

  it('does not close after the Root unmounts during a reveal wait', () => {
    const handle = createHandle<Payload>();
    let setMounted: (mounted: boolean) => void = () => {};
    function VirtualRow() {
      const [mounted, set] = React.useState(true);
      setMounted = set;
      return mounted ? <MessageTiles message={messageB} handle={handle} /> : null;
    }
    const onOpenChange = vi.fn();
    const reveal = vi.fn(({ signal }: { signal: AbortSignal }) => {
      expect(signal.aborted).toBe(false);
      return new Promise<void>(() => {});
    });
    const { rerender } = render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          scrollTriggerIntoView={{ type: 'onClose', reveal }}
          onOpenChange={onOpenChange}
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    act(() => setMounted(false));
    act(() => handle.close());
    const { signal } = reveal.mock.calls[0]![0];
    onOpenChange.mockClear();
    rerender(<VirtualRow />);
    for (let i = 0; i < 70; i += 1) act(() => flushRaf());

    expect(signal.aborted).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a Root wrapping the feed never re-renders the feed; only the open gallery and the viewer do', async () => {
    const handle = createHandle<Payload>();
    const rowRenders = new Map<string, number>();
    const tileRenders = new Map<string, number>();
    let viewerRenders = 0;
    const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);
    const messages = Array.from({ length: 20 }, (_, m) => ({
      id: `m${m}`,
      images: [`m${m}-0`, `m${m}-1`, `m${m}-2`],
    }));

    function Row({ message }: { message: Message }) {
      bump(rowRenders, message.id);
      return (
        <div>
          {message.images.map((src) => (
            <LightboxTrigger key={src} itemId={src} payload={message} data-testid={`t-${src}`}>
              {({ imageRef }) => {
                bump(tileRenders, src);
                return <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />;
              }}
            </LightboxTrigger>
          ))}
        </div>
      );
    }
    function PayloadViewer() {
      viewerRenders += 1;
      const message = useLightboxPayload<Message>();
      const images = message?.images ?? [];
      return (
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
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
    }
    render(
      <LightboxRoot<Payload> handle={handle} viewTransition={false} awaitImageDecode={false}>
        {messages.map((message) => (
          <Row key={message.id} message={message} />
        ))}
        <PayloadViewer />
      </LightboxRoot>,
    );
    rowRenders.clear();
    tileRenders.clear();
    viewerRenders = 0;

    fireEvent.click(screen.getByTestId('t-m7-1'));
    expect(screen.getByTestId('item-m7-1')).toHaveAttribute('data-active');
    const viewerRendersOnOpen = viewerRenders;
    act(() => handle.goTo('m7-2'));
    act(() => handle.goTo('m7-0'));
    act(() => handle.close());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => flushRaf());
    expect(handle.isOpen).toBe(false);

    expect(rowRenders.size).toBe(0);
    expect([...tileRenders.keys()].sort()).toEqual(['m7-0', 'm7-1', 'm7-2']);
    // The viewer re-renders for the new payload, not for navigation or close.
    expect(viewerRendersOnOpen).toBeGreaterThan(0);
    expect(viewerRenders).toBe(viewerRendersOnOpen);
  });

  it('returns focus to the keyed trigger on close', async () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} viewTransition={false} />
      </>,
    );

    const trigger = screen.getByTestId('t-b1');
    trigger.focus();
    fireEvent.click(trigger);
    act(() => handle.goTo('b2'));
    act(() => handle.close());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => flushRaf());

    expect(document.activeElement).toBe(screen.getByTestId('t-b2'));
  });

  it('closes a hidden +N item with a crossfade onto its overflow tile without crossfade props', () => {
    const handle = createHandle<Payload>();
    const x: Message = { id: 'x', images: ['x0', 'x1', 'x2', 'x3', 'x4', 'x5'] };
    render(
      <>
        {x.images.slice(0, 4).map((src, i) => (
          <LightboxTrigger
            key={src}
            handle={handle}
            itemId={src}
            overflowItemIds={i === 3 ? x.images.slice(4) : undefined}
            payload={{ messageId: 'x' }}
            data-testid={`t-${src}`}
          >
            {({ imageRef }) => <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />}
          </LightboxTrigger>
        ))}
        <Viewer handle={handle} messages={[x]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-x3'));
    act(() => handle.goTo('x5'));
    act(() => handle.close());

    expect(morphNameOf(screen.getByTestId('t-x3'))).toBe(MORPH);
    expect(document.documentElement.getAttribute('data-ramka-crossfade')).not.toBeNull();
  });
});

/** A virtualized row: `row.set(false)` unmounts the message's tiles. */
function createVirtualRow(handle: LightboxHandle<Payload>, message: Message) {
  const row = { set: (_mounted: boolean) => {} };
  function VirtualRow() {
    const [mounted, set] = React.useState(true);
    row.set = (next) => act(() => set(next));
    return mounted ? <MessageTiles message={message} handle={handle} /> : null;
  }
  return { VirtualRow, row };
}

function morphNamedElements() {
  return [...document.querySelectorAll<HTMLElement>('*')].filter((el) => morphNameOf(el) === MORPH);
}

describe('keyed triggers: virtualization and close races', () => {
  it('a new open during a reveal wait aborts it and stays open on the new item', () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    const reveal = vi.fn((_details: { signal: AbortSignal }) => new Promise<void>(() => {}));
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} scrollTriggerIntoView={{ type: 'onClose', reveal }} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    row.set(false);
    act(() => handle.close());
    const { signal } = reveal.mock.calls[0]![0];
    act(() => handle.open('b2', { payload: { messageId: 'B' } }));
    for (let i = 0; i < 12; i += 1) act(() => flushRaf());

    expect(signal.aborted).toBe(true);
    expect(handle.isOpen).toBe(true);
    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
  });

  it('a second close during a reveal wait joins the first', async () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    let resolve: () => void = () => {};
    const reveal = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const onOpenChange = vi.fn();
    render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          scrollTriggerIntoView={{ type: 'onClose', reveal }}
          onOpenChange={onOpenChange}
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    row.set(false);
    onOpenChange.mockClear();
    act(() => handle.close());
    act(() => handle.close());
    await act(async () => {
      row.set(true);
      resolve();
    });
    await settleRevealWait(handle, 5);

    expect(reveal).toHaveBeenCalledOnce();
    expect(handle.isOpen).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it('a remounted origin trigger takes over aria-expanded and the close morph', () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} />
      </>,
    );

    const original = screen.getByTestId('t-b1');
    fireEvent.click(original);
    row.set(false);
    row.set(true);
    const remounted = screen.getByTestId('t-b1');
    expect(remounted).not.toBe(original);
    expect(remounted).toHaveAttribute('aria-expanded', 'true');

    act(() => handle.close());
    expect(morphNameOf(remounted)).toBe(MORPH);
  });

  it('without view transitions, a close skips the reveal wait', () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    const reveal = vi.fn();
    render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          scrollTriggerIntoView={{ type: 'onClose', reveal }}
          viewTransition={false}
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    row.set(false);
    act(() => handle.close());

    expect(handle.isOpen).toBe(false);
  });

  it('with no mounted trigger and no reveal, the close fades instead of morphing', () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    render(
      <>
        <VirtualRow />
        <Viewer handle={handle} messages={[messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    row.set(false);
    act(() => handle.close());

    expect(handle.isOpen).toBe(false);
    expect(morphNamedElements()).toEqual([]);
  });

  it("asks to reveal on navigation ('onChange') and aborts that reveal on the next navigation", () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const handle = createHandle<Payload>();
      const { VirtualRow, row } = createVirtualRow(handle, messageB);
      const reveal = vi.fn((_details: { reason: string; itemId: string; signal: AbortSignal }) => {});
      render(
        <>
          <VirtualRow />
          <Viewer
            handle={handle}
            messages={[messageB]}
            scrollTriggerIntoView={[{ type: 'onChange', behavior: 'instant', reveal }]}
          />
        </>,
      );

      fireEvent.click(screen.getByTestId('t-b0'));
      row.set(false);
      act(() => handle.goTo('b2'));
      act(() => vi.advanceTimersByTime(200));

      expect(reveal).toHaveBeenCalledOnce();
      const details = reveal.mock.calls[0]![0];
      expect(details).toMatchObject({ reason: 'onChange', itemId: 'b2' });
      expect(details.signal.aborted).toBe(false);

      act(() => handle.goTo('b1'));
      expect(details.signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("asks to reveal once the open completes ('onOpenComplete') when the trigger isn't mounted", async () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    const reveal = vi.fn((_details: { reason: string; itemId: string }) => {});
    render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          viewTransition={false}
          scrollTriggerIntoView={[{ type: 'onOpenComplete', behavior: 'instant', reveal }]}
        />
      </>,
    );

    row.set(false);
    act(() => handle.open('b2', { payload: { messageId: 'B' } }));
    // Open completes after a frame plus the (empty) animations' settle microtask.
    await act(async () => {
      flushRaf();
      await Promise.resolve();
    });

    expect(reveal).toHaveBeenCalledOnce();
    expect(reveal.mock.calls[0]![0]).toMatchObject({ reason: 'onOpenComplete', itemId: 'b2' });
  });

  it("a close doesn't call another moment's reveal when there's no onClose option", () => {
    const handle = createHandle<Payload>();
    const { VirtualRow, row } = createVirtualRow(handle, messageB);
    const reveal = vi.fn((_details: { reason: string; itemId: string }) => {});
    render(
      <>
        <VirtualRow />
        <Viewer
          handle={handle}
          messages={[messageB]}
          scrollTriggerIntoView={[{ type: 'onChange', behavior: 'instant', reveal }]}
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b1'));
    row.set(false);
    act(() => handle.close());

    expect(reveal).not.toHaveBeenCalled();
  });
});

describe('keyed triggers: galleries and stand-ins', () => {
  it('opening another gallery while open swaps the viewer to it', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-a0'));
    act(() => handle.open('b2', { payload: { messageId: 'B' } }));

    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
    expect(screen.queryByTestId('item-a0')).toBeNull();
    expect(screen.getByTestId('t-b2')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('t-a0')).toHaveAttribute('aria-expanded', 'false');
  });

  it("reports the opened item when it sits at the active index of another gallery's item", () => {
    const handle = createHandle<Payload>();
    const onValueChange = vi.fn();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageA, messageB]} onValueChange={onValueChange} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-a0'));
    expect(onValueChange).toHaveBeenLastCalledWith('a0', expect.objectContaining({ index: 0 }));
    act(() => handle.close());
    fireEvent.click(screen.getByTestId('t-b0'));
    expect(onValueChange).toHaveBeenLastCalledWith('b0', expect.objectContaining({ index: 0 }));
    expect(screen.getByTestId('item-b0')).toHaveAttribute('data-active');
  });

  it('the same item rendered twice (a reply quote): the clicked copy is the origin', () => {
    const handle = createHandle<Payload>();
    render(
      <>
        <MessageTiles message={messageB} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageB]} />
      </>,
    );

    const [first, second] = screen.getAllByTestId('t-b1') as [HTMLElement, HTMLElement];
    fireEvent.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(first).toHaveAttribute('data-morph-target');
    expect(second).not.toHaveAttribute('data-morph-target');
    act(() => handle.close());
    expect(morphNameOf(first)).toBe(MORPH);
    expect(morphNameOf(second)).toBe('');
  });

  it("an item's own trigger beats an overflow stand-in, and closes without a crossfade", () => {
    const handle = createHandle<Payload>();
    const x: Message = { id: 'x', images: ['x0', 'x1', 'x2', 'x3', 'x4', 'x5'] };
    render(
      <>
        {x.images.slice(0, 4).map((src, i) => (
          <LightboxTrigger
            key={src}
            handle={handle}
            itemId={src}
            overflowItemIds={i === 3 ? x.images.slice(4) : undefined}
            payload={{ messageId: 'x' }}
            data-testid={`t-${src}`}
          >
            {({ imageRef }) => <img ref={imageRef} src={`${src}-thumb.jpg`} alt="" />}
          </LightboxTrigger>
        ))}
        {/* x5 also appears on its own, e.g. quoted in a reply. */}
        <LightboxTrigger handle={handle} itemId="x5" payload={{ messageId: 'x' }} data-testid="t-x5">
          {({ imageRef }) => <img ref={imageRef} src="x5-thumb.jpg" alt="" />}
        </LightboxTrigger>
        <Viewer handle={handle} messages={[x]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-x3'));
    act(() => handle.goTo('x5'));
    expect(hiddenTriggers()).toEqual(['t-x5']);
    act(() => handle.close());

    expect(morphNameOf(screen.getByTestId('t-x5'))).toBe(MORPH);
    expect(morphNameOf(screen.getByTestId('t-x3'))).toBe('');
    expect(document.documentElement.getAttribute('data-ramka-crossfade')).toBeNull();
  });
});

describe('keyed triggers: deep links, payload and controlled state', () => {
  it('defaultOpen + defaultPayload + defaultValue renders the linked gallery on first render', () => {
    const handle = createHandle<Payload>();
    const onPayload = vi.fn();
    render(
      <>
        <MessageTiles message={messageA} handle={handle} />
        <MessageTiles message={messageB} handle={handle} />
        <Viewer
          handle={handle}
          messages={[messageA, messageB]}
          onPayload={onPayload}
          defaultOpen
          defaultPayload={{ messageId: 'B' }}
          defaultValue="b2"
          viewTransition={false}
        />
      </>,
    );

    expect(onPayload).toHaveBeenNthCalledWith(1, { messageId: 'B' });
    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
  });

  it('the hook sees defaultPayload, then the next opening trigger replaces it', async () => {
    const seen: (Payload | undefined)[] = [];
    function HookViewer() {
      const payload = useLightboxPayload<Payload>();
      seen.push(payload);
      const message = [messageA, messageB].find((m) => m.id === payload?.messageId);
      return (
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
            <SlidesHost slideCount={message?.images.length ?? 0}>
              {(message?.images ?? []).map((src, i) => (
                <LightboxItem key={src} index={i} itemId={src} data-testid={`item-${src}`}>
                  {({ imageRef }) => <img ref={imageRef} src={`${src}-full.jpg`} alt="" />}
                </LightboxItem>
              ))}
            </SlidesHost>
          </LightboxContent>
        </LightboxPortal>
      );
    }
    const handle = createHandle<Payload>();
    render(
      <LightboxRoot<Payload>
        handle={handle}
        defaultOpen
        defaultPayload={{ messageId: 'B' }}
        viewTransition={false}
        awaitImageDecode={false}
      >
        {messageA.images.map((src) => (
          <LightboxTrigger key={src} itemId={src} payload={{ messageId: 'A' }} data-testid={`t-${src}`} />
        ))}
        <HookViewer />
      </LightboxRoot>,
    );
    expect(seen[0]).toEqual({ messageId: 'B' });

    act(() => handle.close());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => flushRaf());
    // Kept through the close, until the next open.
    expect(seen[seen.length - 1]).toEqual({ messageId: 'B' });

    fireEvent.click(screen.getByTestId('t-a1'));
    expect(seen[seen.length - 1]).toEqual({ messageId: 'A' });
    expect(screen.getByTestId('item-a1')).toHaveAttribute('data-active');
  });

  it('controlled open: a keyed open reports the itemId, and the parent can close it', () => {
    const handle = createHandle<Payload>();
    const onValueChange = vi.fn();
    let setOpen: (open: boolean) => void = () => {};
    function Controlled() {
      const [open, set] = React.useState(false);
      setOpen = set;
      return (
        <>
          <MessageTiles message={messageB} handle={handle} />
          <Viewer
            handle={handle}
            messages={[messageB]}
            open={open}
            onOpenChange={set}
            onValueChange={onValueChange}
            viewTransition={false}
          />
        </>
      );
    }
    render(<Controlled />);

    fireEvent.click(screen.getByTestId('t-b2'));
    expect(handle.isOpen).toBe(true);
    expect(screen.getByTestId('item-b2')).toHaveAttribute('data-active');
    expect(onValueChange).toHaveBeenLastCalledWith('b2', expect.objectContaining({ index: 2 }));

    act(() => setOpen(false));
    expect(handle.isOpen).toBe(false);
  });
});

describe('keyed triggers: dev warnings and notification cost', () => {
  it('useLightboxPayload throws outside a Root', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useLightboxPayload();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useLightboxPayload must be used within a Lightbox.Root');
  });

  it('errors on a Trigger without an itemId, even one given a legacy index', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Loose = LightboxTrigger as unknown as React.ComponentType<Record<string, unknown>>;
    const needsItemId = expect.stringContaining('[ramka] Lightbox.Trigger needs an `itemId`');

    render(
      <LightboxRoot>
        <Loose />
      </LightboxRoot>,
    );
    expect(error).toHaveBeenCalledWith(needsItemId);

    cleanup();
    error.mockClear();
    render(
      <LightboxRoot>
        <Loose index={0} />
      </LightboxRoot>,
    );
    expect(error).toHaveBeenCalledWith(needsItemId);
  });

  it('does not error on a Trigger with an itemId', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <LightboxRoot>
        <LightboxTrigger itemId="a" />
      </LightboxRoot>,
    );

    expect(error).not.toHaveBeenCalledWith(expect.stringContaining('needs an `itemId`'));
  });

  it('goTo to a missing itemId warns and stays put', () => {
    const handle = createHandle<Payload>();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <MessageTiles message={messageB} handle={handle} />
        <Viewer handle={handle} messages={[messageB]} />
      </>,
    );

    fireEvent.click(screen.getByTestId('t-b0'));
    act(() => handle.goTo('nope'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no mounted Lightbox.Item has itemId "nope"'));
    expect(screen.getByTestId('item-b0')).toHaveAttribute('data-active');
  });

  it('warns when two Items in the open gallery share an itemId', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <LightboxRoot defaultOpen viewTransition={false} awaitImageDecode={false}>
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
            <SlidesHost slideCount={2}>
              <LightboxItem index={0} itemId="same" />
              <LightboxItem index={1} itemId="same" />
            </SlidesHost>
          </LightboxContent>
        </LightboxPortal>
      </LightboxRoot>,
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Two Lightbox.Items share itemId "same"'));
  });

  it('a keyed trigger on an unbound handle warns and opens nothing', () => {
    const handle = createHandle<Payload>();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<MessageTiles message={messageA} handle={handle} />);

    fireEvent.click(screen.getByTestId('t-a0'));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('before a Lightbox.Root'));
    expect(handle.isOpen).toBe(false);
  });

  it('mounting triggers while closed notifies no one; while open, one commit notifies once', async () => {
    const handle = createHandle<Payload>();
    const many = Array.from({ length: 50 }, (_, m) => ({ id: `n${m}`, images: [`n${m}-0`, `n${m}-1`] }));
    let showMany: (show: boolean) => void = () => {};
    function Feed() {
      const [show, set] = React.useState(false);
      showMany = (next) => set(next);
      return (
        <>
          <MessageTiles message={messageA} handle={handle} />
          {show ? many.map((message) => <MessageTiles key={message.id} message={message} handle={handle} />) : null}
        </>
      );
    }
    render(
      <>
        <Feed />
        <Viewer handle={handle} messages={[messageA, ...many]} />
      </>,
    );
    const notify = vi.fn();
    const unsubscribe = subscribeLightboxHandle(handle, notify);

    await act(async () => {
      showMany(true);
      await Promise.resolve();
    });
    await act(async () => {
      showMany(false);
      await Promise.resolve();
    });
    expect(notify).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('t-a0'));
    await act(async () => {
      await Promise.resolve();
    });
    notify.mockClear();
    await act(async () => {
      showMany(true);
      await Promise.resolve();
    });
    expect(notify).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
