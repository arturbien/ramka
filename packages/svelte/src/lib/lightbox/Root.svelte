<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { ensureStyles, styleTag, type MorphPreset } from './morph.js';
  import {
    LightboxModel,
    getNonce,
    setModel,
    triggerMorph,
    type BeforeCloseContext,
    type BeforeOpenContext,
    type LightboxHandle,
    type MorphTo,
    type NavigationSource,
    type ScrollTriggerIntoView,
    type TextDirection,
  } from './state.svelte.js';

  interface Props {
    open?: boolean;
    index?: number;
    loop?: boolean;
    count?: number;
    dir?: TextDirection;
    viewTransition?: boolean | MorphPreset;
    morphTo?: MorphTo;
    scrollTriggerIntoView?: ScrollTriggerIntoView;
    awaitImageDecode?: boolean | number;
    handle?: LightboxHandle;
    onOpenChange?: (open: boolean) => void;
    onOpenChangeComplete?: (open: boolean) => void;
    onValueChange?: (value: number, meta: { source: NavigationSource }) => void;
    onBeforeOpen?: (ctx: BeforeOpenContext) => void | Promise<void>;
    onBeforeClose?: (ctx: BeforeCloseContext) => void;
    children?: Snippet;
  }

  let { open = $bindable(false), index = $bindable(0), ...props }: Props = $props();

  const uid = $props.id();
  const lb = setModel(
    new LightboxModel(
      {
        get open() {
          return open;
        },
        set open(v) {
          open = v;
        },
        get index() {
          return index;
        },
        set index(v) {
          index = v;
        },
      },
      () => props,
      uid,
    ),
  );

  const nonce = getNonce();
  const serverOpen = untrack(() => open);

  /** Opens at `i`, morphing from its Trigger when one is registered. */
  export function show(i = index) {
    return lb.show(i, undefined, 'imperative');
  }

  /** Closes, morphing back to the Trigger picked by `morphTo`. */
  export function close() {
    return lb.close();
  }

  $effect(() => {
    ensureStyles(nonce);
    return () => lb.destroy();
  });

  $effect.pre(() => {
    const { handle } = props;
    if (!handle) return;
    handle.state = lb;
    return () => {
      if (handle.state === lb) handle.state = undefined;
    };
  });

  $effect(() => {
    const opened = open;
    if (opened) lb.present = true;
    else if (!lb.present) return;
    let cancelled = false;
    settled().then(() => {
      if (cancelled) return;
      if (!opened) lb.present = false;
      lb.settle(opened);
    });
    return () => (cancelled = true);
  });

  $effect(() => {
    if (!open) return;
    const target = lb.closeTarget();
    const el = target && triggerMorph(target);
    if (!el) return;
    el.setAttribute('data-morph-target', '');
    return () => el.removeAttribute('data-morph-target');
  });

  let lastIndex = -1;
  $effect(() => {
    const i = index;
    if (!open) return void (lastIndex = -1);
    if (lastIndex === -1) lastIndex = i;
    if (lb.scrolling || i === lastIndex) return;
    const timer = setTimeout(() => {
      lastIndex = i;
      lb.scrollTrigger('onChange');
    }, 120);
    return () => clearTimeout(timer);
  });

  async function settled() {
    await lb.transition;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const running = (lb.portal?.getAnimations({ subtree: true }) ?? []).filter(
      (a) => a.effect?.getComputedTiming().iterations !== Infinity,
    );
    await Promise.allSettled(running.map((a) => a.finished));
  }
</script>

<svelte:head>
  {#if serverOpen}{@html styleTag(nonce)}{/if}
</svelte:head>

{@render props.children?.()}
