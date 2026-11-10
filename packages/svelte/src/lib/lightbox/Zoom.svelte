<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { computeMaxZoom } from './gestures.js';
  import { getItem, getModel, setZoom, type ZoomApi } from './state.svelte.js';
  import { ZoomController } from './zoom.js';

  const FALLBACK_MAX = 4;

  interface ZoomSnippetState {
    zoom: number;
    maxZoom: number;
    offsetX: number;
    offsetY: number;
    canZoomIn: boolean;
    canZoomOut: boolean;
    dragging: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    scrollToZoom?: boolean;
    wheelSensitivity?: number;
    keyboardPanDistance?: number;
    doubleClickDelay?: number;
    onZoomChange?: (zoom: number) => void;
    children?: Snippet<[ZoomSnippetState]>;
  }

  let {
    minZoom = 1,
    maxZoom,
    zoomStep = 2,
    scrollToZoom = false,
    wheelSensitivity = 100,
    keyboardPanDistance = 50,
    doubleClickDelay = 300,
    onZoomChange,
    children,
    ...rest
  }: Props = $props();
  const lb = getModel();
  const item = getItem();
  const safariPinch = typeof window !== 'undefined' && 'GestureEvent' in window && navigator.maxTouchPoints === 0;
  let scale = $state(untrack(() => minZoom));
  let offset = $state({ x: 0, y: 0 });
  let dragging = $state(false);
  let pinching = $state(false);
  let measured = $state<number>();
  let controller: ZoomController | undefined;
  const max = $derived(maxZoom ?? measured ?? FALLBACK_MAX);
  const zoomed = $derived(scale > minZoom + 0.01);
  const canZoomIn = $derived(scale < max - 0.01);
  const zoom = $derived(scale);
  const offsetX = $derived(offset.x);
  const offsetY = $derived(offset.y);

  export { zoom, max as maxZoom, offsetX, offsetY, canZoomIn, zoomed as canZoomOut };

  /** Steps zoom in by `zoomStep`. */
  export const zoomIn = () => controller?.zoomIn();
  /** Steps zoom out by `zoomStep`. */
  export const zoomOut = () => controller?.zoomOut();
  /** Zooms to an absolute level, optionally recentering on an offset from the center. */
  export const zoomTo = (target: number, options?: { rapid?: boolean; dx?: number; dy?: number }) =>
    controller?.zoomTo(target, options);
  /** Resets zoom and pan to rest. */
  export const reset = (rapid = false) => controller?.reset(rapid);
  /** Pans by content-space pixels, positive moves the content left and up. */
  export const changeOffsets = (dx: number, dy: number) => controller?.changeOffsets(dx, dy);

  const api: ZoomApi = {
    get zoom() {
      return scale;
    },
    get minZoom() {
      return minZoom;
    },
    get maxZoom() {
      return max;
    },
    get panDistance() {
      return keyboardPanDistance;
    },
    get gesturing() {
      return pinching || dragging;
    },
    get canZoomIn() {
      return canZoomIn;
    },
    get canZoomOut() {
      return zoomed;
    },
    zoomIn,
    zoomOut,
    reset: () => reset(),
    pan: (dx, dy) => controller?.pan(dx, dy),
  };
  setZoom(api);

  function surface(viewport: HTMLElement) {
    return untrack(() => mount(viewport));
  }

  function mount(viewport: HTMLElement) {
    const content = viewport.firstElementChild as HTMLElement;
    const c = (controller = new ZoomController(
      viewport,
      content,
      () => ({
        min: minZoom,
        max,
        step: zoomStep,
        scrollToZoom,
        wheelSensitivity,
        doubleClickDelay,
        panViewport: () => lb.stageEl ?? lb.contentEl ?? viewport,
      }),
      {
        onchange: (s) => {
          if (s !== scale) onZoomChange?.(s);
          scale = s;
          offset = { x: c.x / s, y: c.y / s };
        },
        ondrag: (on) => (dragging = on),
        onpinch: (on) => (pinching = on),
      },
    ));
    const measure = () => {
      const img = content.querySelector('img');
      const box = viewport.getBoundingClientRect();
      measured = img?.naturalWidth
        ? computeMaxZoom(img.naturalWidth, img.naturalHeight, box.width, box.height, minZoom, FALLBACK_MAX)
        : undefined;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    viewport.addEventListener('load', measure, true);
    const index = item?.index;
    if (index !== undefined) lb.zooms.set(index, api);
    const handlers = {
      pointerdown: c.onpointerdown,
      pointermove: c.onpointermove,
      pointerup: c.onpointerup,
      pointercancel: c.onpointerup,
      dblclick: c.ondblclick,
    };
    const types = Object.keys(handlers) as (keyof typeof handlers)[];
    for (const type of types) viewport.addEventListener(type, handlers[type] as EventListener);
    viewport.addEventListener('wheel', c.onwheel, { passive: false });
    const gestures = safariPinch ? ['gesturestart', 'gesturechange', 'gestureend'] : [];
    for (const type of gestures) viewport.addEventListener(type, c.ongesture);
    $effect(() => {
      if (item && !item.active && c.scale !== minZoom) c.reset(true);
    });
    return () => {
      for (const type of types) viewport.removeEventListener(type, handlers[type] as EventListener);
      for (const type of gestures) viewport.removeEventListener(type, c.ongesture);
      viewport.removeEventListener('wheel', c.onwheel);
      viewport.removeEventListener('load', measure, true);
      observer.disconnect();
      c.destroy();
      if (index !== undefined && lb.zooms.get(index) === api) lb.zooms.delete(index);
      controller = undefined;
    };
  }
</script>

<div data-ramka-zoom data-zoom={zoomed || undefined} data-dragging={dragging || undefined} {...rest} {@attach surface}>
  <div data-ramka-zoom-content>
    {@render children?.({
      zoom: scale,
      maxZoom: max,
      offsetX: offset.x,
      offsetY: offset.y,
      canZoomIn,
      canZoomOut: zoomed,
      dragging,
    })}
  </div>
</div>
