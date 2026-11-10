<script lang="ts">
  import { flushSync, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { scrollProgress } from './geometry.js';
  import { getModel, setStrip } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    scrubOnSelect?: boolean;
    selectViewTransition?: boolean;
    wrapSelectCommit?: (commit: () => void, slides: HTMLElement | null, index: number) => void;
    children?: Snippet;
    indicator?: Snippet;
  }

  let {
    scrubOnSelect = true,
    selectViewTransition = true,
    wrapSelectCommit,
    children,
    indicator,
    ...rest
  }: Props = $props();
  const lb = getModel();
  let root = $state<HTMLElement>();
  let track = $state<HTMLElement>();
  let scrub: Animation | null = null;
  let scrubbing = $state(false);
  let positioned = $state(false);
  let frame = 0;

  const SCRUB_DURATION = 450;
  const SCRUB_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const translate = (x: number) => `translate3d(${x}px, 0, 0)`;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function centers(el: HTMLElement) {
    const map = new Map<number, number>();
    for (const thumb of el.querySelectorAll<HTMLElement>('[data-ramka-thumbnail]'))
      map.set(Number(thumb.dataset.index), thumb.offsetLeft + thumb.offsetWidth / 2);
    return map;
  }

  function travel(el: HTMLElement, at: number, map = centers(el)) {
    const lo = Math.floor(at);
    const a = map.get(lo) ?? 0;
    const b = map.get(lo + 1) ?? a;
    return root!.clientWidth / 2 - el.offsetLeft - (a + (b - a) * (at - lo));
  }

  function sync() {
    const el = track;
    if (scrub || !el || !root || !lb.slidesEl || !lb.count) return;
    const map = centers(el);
    el.style.setProperty('--lightbox-thumbnail-strip-travel', `${travel(el, lb.count - 1, map)}px`);
    el.style.transform = translate(travel(el, scrollProgress(lb.slidesEl), map));
    positioned = true;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), sync()));
  }

  function scrubTo(i: number) {
    const el = track;
    if (!scrubOnSelect || !el || !root || reduced()) return;
    const from = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    const to = travel(el, i);
    if (Math.abs(from - to) < 0.5) return;
    scrub?.cancel();
    const anim = (scrub = el.animate([{ transform: translate(from) }, { transform: translate(to) }], {
      duration: SCRUB_DURATION,
      easing: SCRUB_EASING,
      fill: 'forwards',
    }));
    scrubbing = true;
    anim.finished.then(
      () => {
        if (scrub !== anim) return;
        el.style.transform = translate(to);
        anim.cancel();
        scrub = null;
        scrubbing = false;
        sync();
      },
      () => {},
    );
  }

  setStrip({
    select(i, viewTransition) {
      if (i === lb.index || lb.scrolling) return;
      scrubTo(i);
      const slides = lb.slidesEl ?? null;
      const host = slides as (HTMLElement & { startViewTransition?: (cb: () => void) => unknown }) | null;
      const apply = () => flushSync(() => lb.go(i, 'thumbnail', true));
      const commit = () => {
        if (viewTransition && selectViewTransition && !reduced() && host?.startViewTransition)
          host.startViewTransition(apply);
        else apply();
      };
      if (wrapSelectCommit) wrapSelectCommit(commit, slides, i);
      else commit();
    },
    setTrack(el) {
      track = el;
    },
  });

  $effect(() => {
    const strip = { scrub: scrubTo };
    lb.strip = strip;
    return () => {
      if (lb.strip === strip) lb.strip = undefined;
    };
  });

  $effect(() => {
    const el = track;
    const slides = lb.slidesEl;
    if (!el || !root || !slides) return;
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    observer.observe(el);
    sync();
    slides.addEventListener('scroll', schedule, { passive: true });
    return () => {
      observer.disconnect();
      slides.removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
      frame = 0;
    };
  });

  $effect(() => () => scrub?.cancel());
</script>

<div
  data-ramka-thumbnail-strip
  data-scrubbing={scrubbing || undefined}
  data-positioned={positioned || undefined}
  {...rest}
  {@attach (node) => {
    root = node;
  }}
>
  {@render children?.()}
  {@render indicator?.()}
</div>
