<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { ensureStyles } from './morph.js';
  import {
    getModel,
    getNonce,
    refs,
    setTrigger,
    type Crossfade,
    type LightboxHandle,
    type TriggerContext,
    type TriggerEntry,
  } from './state.svelte.js';

  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    index: number;
    id?: string;
    handle?: LightboxHandle;
    crossfade?: Crossfade;
    children?: Snippet<[TriggerContext]>;
  }

  let { index, id, handle, crossfade, children, ...rest }: Props = $props();
  const root = untrack(() => handle) ? undefined : getModel();
  const lb = $derived(handle ? handle.state : root);
  const nonce = getNonce();
  const open = $derived(!!lb?.open);
  const active = $derived(lb?.index === index);

  const entry: TriggerEntry = {
    el: undefined!,
    get index() {
      return index;
    },
    get id() {
      return id;
    },
    get crossfade() {
      return crossfade;
    },
  };
  const context: TriggerContext = {
    get open() {
      return open;
    },
    get active() {
      return active;
    },
    ...refs(entry),
  };
  setTrigger(context);

  $effect(() => ensureStyles(nonce));

  function register(el: HTMLElement) {
    entry.el = el;
    const state = lb;
    if (!state) return;
    state.triggers.add(entry);
    return () => state.triggers.delete(entry);
  }
</script>

<button
  type="button"
  {id}
  aria-haspopup="dialog"
  aria-expanded={open && lb?.opener === entry}
  aria-controls={open ? lb?.contentId : undefined}
  data-ramka-trigger
  data-popup-open={open || undefined}
  data-active={active || undefined}
  data-crossfade={crossfade}
  {...rest}
  onclick={(e) => {
    rest.onclick?.(e);
    if (!e.defaultPrevented) lb?.show(index, entry, 'trigger');
  }}
  {@attach register}
>
  {@render children?.(context)}
</button>
