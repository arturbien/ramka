<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { arrowKeyDelta, resolveIndex } from './gestures.js';
  import { getModel, getStrip, setGroup } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, ...rest }: Props = $props();
  const lb = getModel();
  const strip = getStrip();
  const thumbs = new Map<number, HTMLElement>();
  let focusWithin = $state(false);
  setGroup({ thumbs });

  $effect(() => {
    untrack(() => lb.tablists++);
    return () => untrack(() => lb.tablists--);
  });

  function onkeydown(e: KeyboardEvent) {
    const delta = arrowKeyDelta(e.key, lb.dir);
    const count = lb.count;
    let next: number;
    if (delta) next = resolveIndex(lb.index + delta, count, lb.loop);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    else return;
    e.preventDefault();
    e.stopPropagation();
    if (lb.scrolling || !count || next === lb.index) return;
    if (strip) strip.select(next, false);
    else lb.go(next, 'thumbnail');
    thumbs.get(next)?.focus();
  }
</script>

<div
  role="tablist"
  data-ramka-thumbnail-group
  data-focus-within={focusWithin || undefined}
  {...rest}
  onkeydown={(e) => {
    rest.onkeydown?.(e);
    if (!e.defaultPrevented) onkeydown(e);
  }}
  onfocusin={(e) => {
    rest.onfocusin?.(e);
    focusWithin = true;
  }}
  onfocusout={(e) => {
    rest.onfocusout?.(e);
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusWithin = false;
  }}
>
  {@render children?.()}
</div>
