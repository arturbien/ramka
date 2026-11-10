'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

type SvelteDemos = {
  mount: (id: string, target: HTMLElement, props?: Record<string, unknown>) => Promise<() => void>;
};

const entry = '/svelte-demos/entry.js';

/** Mounts a Svelte demo from `svelte/src/lib/<id>.svelte`, built by `svelte/vite.config.mts`, on the client. */
export function SvelteDemo({
  id,
  props,
  minHeight,
  className,
}: {
  id: string;
  props?: Record<string, unknown>;
  minHeight?: CSSProperties['minHeight'];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const propsKey = JSON.stringify(props ?? {});

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (import(/* webpackIgnore: true */ /* turbopackIgnore: true */ entry) as Promise<SvelteDemos>)
      .then(({ mount }) => mount(id, target, JSON.parse(propsKey)))
      .then((unmount) => {
        if (cancelled) unmount();
        else cleanup = unmount;
      })
      .catch((error: unknown) => console.error(error));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [id, propsKey]);

  return <div ref={ref} data-svelte-demo={id} className={className} style={{ minHeight }} />;
}
