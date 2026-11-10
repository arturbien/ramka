<script lang="ts">
  import { BROWSER } from 'esm-env';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { warnUnnamed } from './dom.js';
  import {
    getSlides,
    getModel,
    refs,
    setEntry,
    setItem,
    type Caption,
    type ImageRef,
    type ItemEntry,
    type MorphRef,
  } from './state.svelte.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    index: number;
    caption?: Caption;
    children?: Snippet<[{ index: number; active: boolean; visible: boolean; morphRef: MorphRef; imageRef: ImageRef }]>;
  }

  let { index, caption, children, ...rest }: Props = $props();
  const lb = getModel();
  const slides = getSlides();
  const active = $derived(lb.index === index);
  const visible = $derived(!slides || Math.abs(lb.index - index) <= slides.preload);
  let seen = false;
  const rendered = $derived.by(() => (seen ||= visible));
  const panel = $derived(lb.tablists > 0);

  const entry: ItemEntry = {
    el: undefined!,
    get caption() {
      return caption;
    },
  };
  const { morphRef, imageRef } = refs(entry);

  setItem({
    get index() {
      return index;
    },
    get active() {
      return active;
    },
    morphRef,
    imageRef,
  });
  setEntry(entry);

  function register(el: HTMLElement) {
    entry.el = el;
    const i = index;
    lb.items.set(i, entry);
    return () => {
      if (lb.items.get(i) === entry) lb.items.delete(i);
    };
  }
</script>

<div
  id="{lb.id}-panel-{index}"
  role={panel ? 'tabpanel' : 'group'}
  aria-labelledby={panel ? `${lb.id}-tab-${index}` : undefined}
  aria-hidden={!active}
  inert={!active}
  data-ramka-item
  data-index={index}
  data-active={active || undefined}
  data-ssr-active={(!BROWSER && active) || undefined}
  {...rest}
  {@attach register}
  {@attach active &&
    !panel &&
    warnUnnamed('Lightbox.Item', {
      namedByContent: false,
      hint: 'A slide is a `group`, so its caption does not name it. Pass `aria-label` carrying the position (e.g. `${i + 1} of ${photos.length}` in your own wording).',
    })}
>
  {#if rendered}
    {@render children?.({ index, active, visible, morphRef, imageRef })}
  {/if}
</div>
