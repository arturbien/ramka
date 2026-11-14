import { render, screen, fireEvent, act } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * `closeOnEmptyClick` before its lazy chunk has arrived. The global test
 * setup warms every engine, so this file resets the module registry and
 * holds the chunk behind a gate to reach the cold path a first visit takes.
 */

const gate = vi.hoisted(() => {
  let open: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open: () => open() };
});

const flushMicrotasks = () => act(async () => undefined);

const origPointerEvent = globalThis.PointerEvent;

beforeEach(() => {
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
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
  } else {
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('./lightbox-empty-click-runtime');
  if (origPointerEvent) {
    (globalThis as Record<string, unknown>).PointerEvent = origPointerEvent;
  }
});

function press(el: Element, pointerId: number, detail: number) {
  act(() => {
    for (const type of ['pointerdown', 'pointerup']) {
      el.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, isPrimary: true, button: 0 }),
      );
    }
  });
  fireEvent.click(el, { button: 0, detail });
}

describe('closeOnEmptyClick before its chunk loads', () => {
  it('does nothing until the chunk arrives, then counts a double-click that started meanwhile', async () => {
    vi.resetModules();
    vi.doMock('./lightbox-empty-click-runtime', async (importOriginal) => {
      await gate.promise;
      return importOriginal();
    });
    const { LightboxRoot } = await import('./lightbox-root');
    const { LightboxPortal } = await import('./lightbox-portal');
    const { LightboxContent } = await import('./lightbox-content');
    const { getEmptyClickRuntimeSync } = await import('./lightbox-empty-click-loader');

    render(
      <LightboxRoot defaultOpen>
        <LightboxPortal>
          <LightboxContent data-testid="content" aria-label="Cold" closeOnEmptyClick pullToClose={false}>
            <div data-testid="empty">empty viewer space</div>
          </LightboxContent>
        </LightboxPortal>
      </LightboxRoot>,
    );
    const isOpen = () => screen.queryByTestId('content') !== null;
    const empty = screen.getByTestId('empty');

    // Chunk still loading: an empty click can't close yet.
    await flushMicrotasks();
    expect(getEmptyClickRuntimeSync()).toBeNull();
    press(empty, 1, 1);
    await flushMicrotasks();
    expect(isOpen()).toBe(true);

    // The chunk lands between the two clicks of a double-click. Its second
    // click (`detail` 2) belongs to a sequence whose first click was inside
    // Content, so it closes rather than waiting for a third.
    gate.open();
    await act(() => vi.waitFor(() => expect(getEmptyClickRuntimeSync()).not.toBeNull()));
    await flushMicrotasks();
    press(empty, 2, 2);
    await flushMicrotasks();
    expect(isOpen()).toBe(false);
  });
});
