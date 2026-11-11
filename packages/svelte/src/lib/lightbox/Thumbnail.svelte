<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { getGroup, getModel, getStrip } from './state.svelte.js';

  interface Props extends HTMLButtonAttributes {
    index: number;
    children?: Snippet;
  }

  let { index, children, ...rest }: Props = $props();
  const lb = getModel();
  const strip = getStrip();
  const group = getGroup();
  const active = $derived(lb.index === index);

  function register(el: HTMLElement) {
    const i = index;
    group?.thumbs.set(i, el);
    return () => {
      if (group?.thumbs.get(i) === el) group.thumbs.delete(i);
    };
  }

  function follow(el: HTMLElement) {
    const track = el.parentElement;
    if (strip || !active || !track) return;
    const offset = el.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({
      left: track.scrollLeft + offset - (track.clientWidth - el.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }
</script>

<button
  type="button"
  role="tab"
  id="{lb.id}-tab-{index}"
  aria-selected={active}
  aria-controls="{lb.id}-panel-{index}"
  tabindex={active ? 0 : -1}
  data-index={index}
  data-ramka-thumbnail
  data-active={active || undefined}
  {...rest}
  onclick={(e) => {
    rest.onclick?.(e);
    if (e.defaultPrevented) return;
    if (strip) strip.select(index, true);
    else lb.go(index, 'thumbnail');
  }}
  {@attach register}
  {@attach follow}
>
  {@render children?.()}
</button>
