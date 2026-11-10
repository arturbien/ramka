import { mount as mountComponent, unmount, type Component } from 'svelte';
import { syncPage } from './shims/state.svelte.js';

const demos = import.meta.glob<{ default: Component<Record<string, unknown>> }>('./lib/**/*.svelte');
const stylesheets = () =>
  document.querySelectorAll<HTMLLinkElement>(`link[rel="stylesheet"][href*="${import.meta.env.BASE_URL}"]`);
let mounted = 0;

addEventListener('popstate', syncPage);

/** Mounts `lib/<id>.svelte` into `target` and resolves to its cleanup; demo stylesheets are disabled while nothing is mounted. */
export async function mount(id: string, target: HTMLElement, props: Record<string, unknown> = {}) {
  const load = demos[`./lib/${id}.svelte`];
  if (!load) throw new Error(`Unknown Svelte demo: ${id}`);
  const { default: Demo } = await load();
  syncPage();
  mounted++;
  for (const link of stylesheets()) link.disabled = false;
  const instance = mountComponent(Demo, { target, props });
  return () => {
    void unmount(instance);
    if (--mounted === 0) for (const link of stylesheets()) link.disabled = true;
  };
}
