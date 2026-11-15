'use client';

import type { EmptyClickCloseOptions } from './use-empty-click-close';

export interface EmptyClickRuntime {
  EmptyClickClose: (props: EmptyClickCloseOptions) => null;
}

let cached: EmptyClickRuntime | null = null;
let pending: Promise<EmptyClickRuntime> | null = null;

/**
 * `closeOnEmptyClick` is opt-in, so its target / gesture checks live in their
 * own chunk and only load when a Content mounts with the prop on.
 */
function loadEmptyClickRuntime(): Promise<EmptyClickRuntime> {
  if (cached) return Promise.resolve(cached);
  pending ??= import('./lightbox-empty-click-runtime').then(
    (mod) => {
      cached = { EmptyClickClose: mod.EmptyClickClose };
      return cached;
    },
    (error: unknown) => {
      // See lightbox-morph-loader: let the next mount retry.
      pending = null;
      throw error;
    },
  );
  return pending;
}

function getEmptyClickRuntimeSync(): EmptyClickRuntime | null {
  return cached;
}

export { loadEmptyClickRuntime, getEmptyClickRuntimeSync };
