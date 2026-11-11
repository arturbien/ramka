<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { containTouchScroll, guardNativePinch, warnUnnamed } from './dom.js';
  import { arrowKeyDelta, zoomProgress } from './gestures.js';
  import { pullToDismiss } from './pull.js';
  import { getModel } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    pullToClose?: boolean;
    children?: Snippet;
  }

  let { pullToClose = true, children, ...rest }: Props = $props();
  const lb = getModel();
  const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
  const parked = $derived(!lb.present);
  const locked = $derived(lb.present || lb.closing);
  const progress = $derived(
    lb.activeZoom ? zoomProgress(lb.activeZoom.zoom, lb.activeZoom.minZoom, lb.activeZoom.maxZoom) : 0,
  );

  let dialogEl: HTMLElement;
  let pressedScrim = false;

  function dialog(el: HTMLElement) {
    dialogEl = el;
    lb.contentEl = el;
    $effect(() => {
      if (!locked) return;
      const returnFocus = document.activeElement as HTMLElement | null;
      const html = document.documentElement;
      const { overflow, paddingRight } = html.style;
      html.style.paddingRight = `${window.innerWidth - html.clientWidth}px`;
      html.style.overflow = 'hidden';
      queueMicrotask(() => el.focus({ preventScroll: true }));
      const unguard = guardNativePinch();
      return () => {
        unguard();
        html.style.overflow = overflow;
        html.style.paddingRight = paddingRight;
        returnFocus?.focus({ preventScroll: true });
      };
    });
    return () => {
      if (lb.contentEl === el) lb.contentEl = undefined;
    };
  }

  function trapTab(e: KeyboardEvent) {
    const nodes = [...dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (n) => n.checkVisibility() && !n.closest('[inert]'),
    );
    if (!nodes.length) return e.preventDefault();
    const [first, last] = [nodes[0], nodes[nodes.length - 1]];
    const current = document.activeElement;
    if (!dialogEl.contains(current)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && (current === first || current === dialogEl)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (e.key === 'Escape' && lb.preparing) {
      e.preventDefault();
      lb.close();
      return;
    }
    if (!lb.open) return;
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target !== document.body && !dialogEl.contains(target)) return;
    if (e.key === 'Tab') return trapTab(e);
    if (e.key === 'Escape') {
      e.preventDefault();
      lb.close();
      return;
    }
    if (target?.isContentEditable || target?.closest(EDITABLE)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const stage = lb.stageEl;
    const outsideStage =
      !!stage && !!target && target !== dialogEl && target !== document.body && !stage.contains(target);
    const zoom = lb.activeZoom;
    const zoomKeys: Record<string, (() => void) | undefined> = {
      '+': zoom?.zoomIn,
      '=': zoom?.zoomIn,
      '-': zoom?.zoomOut,
      _: zoom?.zoomOut,
      '0': zoom?.reset,
    };
    if (e.key in zoomKeys) {
      e.preventDefault();
      if (!lb.scrolling && !outsideStage) zoomKeys[e.key]?.();
      return;
    }
    const arrow = e.key.startsWith('Arrow');
    if (outsideStage && (arrow || e.key === 'Home' || e.key === 'End')) return;
    if (arrow && lb.zoomed && zoom) {
      const d = zoom.panDistance;
      const pan: Record<string, [number, number]> = {
        ArrowLeft: [d, 0],
        ArrowRight: [-d, 0],
        ArrowUp: [0, d],
        ArrowDown: [0, -d],
      };
      e.preventDefault();
      zoom.pan(...pan[e.key]);
      return;
    }
    const delta = arrowKeyDelta(e.key, lb.dir);
    const next = delta ? lb.index + delta : e.key === 'Home' ? 0 : e.key === 'End' ? lb.count - 1 : null;
    if (next === null) return;
    e.preventDefault();
    lb.go(next, 'keyboard');
  }
</script>

<svelte:document {onkeydown} />

<div
  role="dialog"
  id="{lb.id}-content"
  aria-modal={parked ? undefined : 'true'}
  tabindex={parked ? undefined : -1}
  data-ramka-content
  data-open={lb.open || undefined}
  data-closed={!lb.open || undefined}
  data-pulling={lb.pulling || undefined}
  data-pull-snapping={lb.pullSnapping || undefined}
  data-pull-dismissing={lb.pullDismissing || undefined}
  data-zooming={lb.zooming || undefined}
  data-zoomed={lb.zoomed || undefined}
  style:--lightbox-zoom-progress={progress || undefined}
  {...rest}
  onpointerdown={(e) => {
    rest.onpointerdown?.(e);
    pressedScrim = e.target === e.currentTarget;
  }}
  onclick={(e) => {
    rest.onclick?.(e);
    const scrim = pressedScrim && e.target === e.currentTarget;
    pressedScrim = false;
    if (scrim && !e.defaultPrevented) lb.close();
  }}
  {@attach dialog}
  {@attach containTouchScroll}
  {@attach warnUnnamed('Lightbox.Content (role="dialog")', {
    namedByContent: false,
    hint: 'Pass `aria-label` (e.g. aria-label="Image viewer") or `aria-labelledby` so screen readers announce the dialog.',
  })}
  {@attach pullToClose && pullToDismiss(lb)}
>
  {@render children?.()}
</div>
