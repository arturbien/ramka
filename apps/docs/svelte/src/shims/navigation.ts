import { syncPage } from './state.svelte.js';

interface GotoOptions {
  replace?: boolean;
  shallow?: boolean;
  state?: App.PageState;
}

/** Stand-in for SvelteKit's `goto`: shallow history writes only, since the demos never navigate for real. */
export function goto(url: string | URL, { replace = false, state = {} }: GotoOptions = {}): Promise<void> {
  const target = new URL(url, location.href);
  history[replace ? 'replaceState' : 'pushState'](state, '', target);
  syncPage();
  return Promise.resolve();
}
