<script lang="ts">
  import { BROWSER, DEV } from 'esm-env';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { nearestIndex, slideOffsets } from './geometry.js';
  import { getModel, setSlides } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    preload?: number;
    ssrSlideShift?: boolean;
    children?: Snippet;
  }

  let { preload = 1, ssrSlideShift = false, children, ...rest }: Props = $props();
  const lb = getModel();
  setSlides({
    get preload() {
      return preload;
    },
  });
  const shift = $derived(!BROWSER && ssrSlideShift);
  let el: HTMLElement;
  let jumpTarget: number | null = null;
  let settleTimer = 0;

  const nearest = () => nearestIndex(slideOffsets(el), el.scrollLeft);

  function scrollToIndex(i: number, behavior: ScrollBehavior) {
    const target = slideOffsets(el).find((s) => s.index === i);
    if (!target || Math.abs(el.scrollLeft - target.offset) < 1) return;
    jumpTarget = target.offset;
    el.scrollTo({ left: target.offset, behavior });
  }

  function settle() {
    clearTimeout(settleTimer);
    jumpTarget = null;
    lb.scrolling = false;
    const i = nearest();
    if (i >= 0) lb.setIndex(i, 'scroll');
  }

  function onscroll() {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 150);
    if (jumpTarget !== null) return;
    lb.scrolling = true;
    const i = nearest();
    if (i >= 0) lb.setIndex(i, 'scroll');
  }

  function onscrollend() {
    if (jumpTarget === null || Math.abs(el.scrollLeft - jumpTarget) < 1) settle();
  }

  function track(node: HTMLElement) {
    el = node;
    lb.slidesEl = node;
    let mounted = false;
    if (DEV) {
      const computed = getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
      if (computed !== lb.dir)
        console.warn(
          `[ramka] Lightbox.Root resolves dir="${lb.dir}" but Lightbox.Slides renders with direction: ${computed}. Navigation will resolve the wrong slide. Pass dir="${computed}" to Lightbox.Root.`,
        );
    }
    $effect(() => {
      const i = lb.index;
      const instant = lb.instant;
      lb.instant = false;
      const from = nearest();
      if (from === i && mounted) return;
      scrollToIndex(i, mounted && !instant && Math.abs(from - i) === 1 ? 'smooth' : 'instant');
      mounted = true;
    });
    const release = () => (jumpTarget = null);
    node.addEventListener('pointerdown', release, { capture: true, passive: true });
    node.addEventListener('wheel', release, { capture: true, passive: true });
    const widths = new WeakMap<Element, number>();
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const { target } of entries) {
        const width = (target as HTMLElement).offsetWidth;
        if (widths.has(target) && widths.get(target) !== width) changed = true;
        widths.set(target, width);
      }
      if (changed && !lb.scrolling) scrollToIndex(lb.index, 'instant');
    });
    observer.observe(node);
    $effect(() => {
      if (!lb.count) return;
      for (const { slide } of slideOffsets(node)) observer.observe(slide);
    });
    return () => {
      observer.disconnect();
      node.removeEventListener('pointerdown', release, true);
      node.removeEventListener('wheel', release, true);
      clearTimeout(settleTimer);
      if (lb.slidesEl === node) lb.slidesEl = undefined;
    };
  }
</script>

<div
  role="group"
  data-ramka-slides
  data-active-index={lb.index}
  data-direction={lb.direction}
  data-orientation="horizontal"
  data-locked={lb.zoomed || lb.pulling || undefined}
  data-scrolling={lb.scrolling || undefined}
  data-ssr-shift={shift || undefined}
  style:--lightbox-ssr-index={shift ? lb.index : undefined}
  style:--lightbox-ssr-shift-sign={shift ? (lb.dir === 'rtl' ? 1 : -1) : undefined}
  {...rest}
  {onscroll}
  {onscrollend}
  {@attach track}
>
  {@render children?.()}
</div>
