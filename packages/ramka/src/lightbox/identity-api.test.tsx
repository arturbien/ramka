import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LightboxContent } from './lightbox-content';
import { LightboxCounter } from './lightbox-counter';
import { createHandle } from './lightbox-handle';
import { LightboxItem } from './lightbox-item';
import { LightboxNext } from './lightbox-next';
import { LightboxPortal } from './lightbox-portal';
import { LightboxRoot, type LightboxRootProps } from './lightbox-root';
import { installSlidesLayoutMocks, resetSlidesLayoutMocks, SlidesHost } from './lightbox-slides-test-utils';
import { LightboxTrigger } from './lightbox-trigger';

/*
 * The active item is named by `itemId`, not by position: `value`,
 * `defaultValue`, `onValueChange` and the handle all speak ids, so the
 * open item survives items being added in front of it.
 */

beforeEach(() => {
  installSlidesLayoutMocks();
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
  }
});

afterEach(() => {
  cleanup();
  resetSlidesLayoutMocks();
  vi.restoreAllMocks();
});

function Gallery({ ids, ...rootProps }: { ids: readonly string[] } & Omit<LightboxRootProps, 'children'>) {
  return (
    <LightboxRoot viewTransition={false} awaitImageDecode={false} {...rootProps}>
      {ids.map((id) => (
        <LightboxTrigger key={id} itemId={id} data-testid={`t-${id}`}>
          {id}
        </LightboxTrigger>
      ))}
      <LightboxPortal>
        <LightboxContent aria-label="Viewer">
          <SlidesHost slideCount={ids.length}>
            {ids.map((id, i) => (
              <LightboxItem key={id} index={i} itemId={id} data-testid={`item-${id}`} />
            ))}
          </SlidesHost>
          <LightboxCounter data-testid="counter" />
          <LightboxNext data-testid="next">Next</LightboxNext>
        </LightboxContent>
      </LightboxPortal>
    </LightboxRoot>
  );
}

describe('identity-first value', () => {
  it('opens at the item named by defaultValue', () => {
    render(<Gallery ids={['a', 'b', 'c']} defaultOpen defaultValue="c" />);
    expect(screen.getByTestId('item-c')).toHaveAttribute('data-active');
    expect(screen.getByTestId('counter')).toHaveTextContent('3 / 3');
  });

  it('reports the itemId and its index on navigation', () => {
    const onValueChange = vi.fn();
    render(<Gallery ids={['a', 'b', 'c']} defaultOpen defaultValue="a" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByTestId('next'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ index: 1 }));
  });

  it('does not report opening at the item that is already active', () => {
    const onValueChange = vi.fn();
    render(<Gallery ids={['a', 'b', 'c']} defaultValue="b" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByTestId('t-b'));
    expect(screen.getByTestId('item-b')).toHaveAttribute('data-active');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('follows a controlled value by id', () => {
    function Controlled() {
      const [value, setValue] = React.useState('a');
      return (
        <>
          <button type="button" data-testid="pick-c" onClick={() => setValue('c')} />
          <Gallery ids={['a', 'b', 'c']} defaultOpen value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByTestId('item-a')).toHaveAttribute('data-active');
    fireEvent.click(screen.getByTestId('pick-c'));
    expect(screen.getByTestId('item-c')).toHaveAttribute('data-active');
    fireEvent.click(screen.getByTestId('next'));
    // Wraps only with loop; without it Next is disabled at the end, so stay on c.
    expect(screen.getByTestId('item-c')).toHaveAttribute('data-active');
  });

  it('keeps the open item when items are prepended in front of it', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Gallery ids={['a', 'b', 'c']} defaultOpen defaultValue="b" onValueChange={onValueChange} />,
    );
    expect(screen.getByTestId('item-b')).toHaveAttribute('data-active');

    rerender(
      <Gallery ids={['new1', 'new2', 'a', 'b', 'c']} defaultOpen defaultValue="b" onValueChange={onValueChange} />,
    );

    expect(screen.getByTestId('item-b')).toHaveAttribute('data-active');
    expect(screen.getByTestId('item-a')).not.toHaveAttribute('data-active');
    expect(screen.getByTestId('counter')).toHaveTextContent('4 / 5');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a controlled item when items are prepended in front of it', () => {
    const { rerender } = render(<Gallery ids={['a', 'b']} defaultOpen value="b" />);
    rerender(<Gallery ids={['z', 'a', 'b']} defaultOpen value="b" />);
    expect(screen.getByTestId('item-b')).toHaveAttribute('data-active');
    expect(screen.getByTestId('counter')).toHaveTextContent('3 / 3');
  });

  it('warns when value names no mounted item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Gallery ids={['a', 'b']} defaultOpen value="nope" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('value "nope" does not match'));
  });

  it('warns when defaultValue names no mounted item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Gallery ids={['a', 'b']} defaultOpen defaultValue="nope" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('defaultValue "nope" does not match'));
  });
});

describe('opening by itemId', () => {
  it('mounts slide content only around the opened item, never around the previous index', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `p${i}`);
    const contentMounts = new Set<string>();
    function Content({ id }: { id: string }) {
      React.useLayoutEffect(() => {
        contentMounts.add(id);
      }, [id]);
      return null;
    }
    render(
      <LightboxRoot viewTransition={false} awaitImageDecode={false}>
        {ids.map((id) => (
          <LightboxTrigger key={id} itemId={id} data-testid={`t-${id}`} />
        ))}
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
            <SlidesHost slideCount={ids.length}>
              {ids.map((id, i) => (
                <LightboxItem key={id} index={i} itemId={id} data-testid={`item-${id}`}>
                  <Content id={id} />
                </LightboxItem>
              ))}
            </SlidesHost>
          </LightboxContent>
        </LightboxPortal>
      </LightboxRoot>,
    );

    fireEvent.click(screen.getByTestId('t-p10'));

    expect(screen.getByTestId('item-p10')).toHaveAttribute('data-active');
    expect(contentMounts.has('p10')).toBe(true);
    expect(contentMounts.has('p0')).toBe(false);
  });
});

describe('identity-first handle', () => {
  it('open(itemId) and goTo(itemId) address items by id', () => {
    const handle = createHandle();
    const onValueChange = vi.fn();
    render(<Gallery ids={['a', 'b', 'c']} handle={handle} onValueChange={onValueChange} />);

    act(() => handle.open('b'));
    expect(screen.getByTestId('item-b')).toHaveAttribute('data-active');
    expect(onValueChange).toHaveBeenLastCalledWith('b', expect.objectContaining({ index: 1, source: 'imperative' }));

    act(() => handle.goTo('c'));
    expect(screen.getByTestId('item-c')).toHaveAttribute('data-active');
  });

  it('goTo an unknown id warns and stays put', () => {
    const handle = createHandle();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Gallery ids={['a', 'b']} handle={handle} defaultOpen defaultValue="a" />);
    act(() => handle.goTo('zzz'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no mounted Lightbox.Item has itemId "zzz"'));
    expect(screen.getByTestId('item-a')).toHaveAttribute('data-active');
  });

  it('a trigger click reports source "trigger"', () => {
    const onValueChange = vi.fn();
    render(<Gallery ids={['a', 'b', 'c']} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByTestId('t-c'));
    expect(onValueChange).toHaveBeenCalledWith('c', expect.objectContaining({ index: 2, source: 'trigger' }));
  });
});

describe('overflowItemIds in a per-gallery Root', () => {
  // A curated "Show all photos" grid: five photos chosen out of order, and the
  // +N tile stands in for the photos the grid doesn't show.
  const all = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  function CuratedGrid() {
    return (
      <LightboxRoot viewTransition={false} awaitImageDecode={false}>
        <LightboxTrigger itemId="p4" data-testid="t-p4" />
        <LightboxTrigger itemId="p0" data-testid="t-p0" />
        <LightboxTrigger itemId="p6" overflowItemIds={['p1', 'p2', 'p3', 'p5']} data-testid="t-more">
          +4
        </LightboxTrigger>
        <LightboxPortal>
          <LightboxContent aria-label="Viewer">
            <SlidesHost slideCount={all.length}>
              {all.map((id, i) => (
                <LightboxItem key={id} index={i} itemId={id} data-testid={`item-${id}`} />
              ))}
            </SlidesHost>
            <LightboxNext data-testid="next">Next</LightboxNext>
          </LightboxContent>
        </LightboxPortal>
      </LightboxRoot>
    );
  }

  it('the +N tile stands in for the photos the grid does not show', () => {
    render(<CuratedGrid />);
    fireEvent.click(screen.getByTestId('t-p0'));
    expect(screen.getByTestId('item-p0')).toHaveAttribute('data-active');
    expect(screen.getByTestId('t-p0')).toHaveAttribute('data-morph-target');

    // p1 has no tile of its own: the +N tile is its close target.
    fireEvent.click(screen.getByTestId('next'));
    expect(screen.getByTestId('item-p1')).toHaveAttribute('data-active');
    expect(screen.getByTestId('t-more')).toHaveAttribute('data-morph-target');
    expect(screen.getByTestId('t-p0')).not.toHaveAttribute('data-morph-target');
  });
});
