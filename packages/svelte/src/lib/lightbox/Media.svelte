<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getEntry, setMedia } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    width?: number;
    height?: number;
    children?: Snippet;
  }

  let { width, height, children, ...rest }: Props = $props();
  const entry = getEntry();
  let auto = $state<{ w: number; h: number }>();
  let element = $state<HTMLElement | null>(null);
  setMedia({
    get element() {
      return element;
    },
  });
  const w = $derived(width ?? auto?.w);
  const h = $derived(height ?? auto?.h);
  const sized = $derived(!!w && !!h);

  function media(el: HTMLElement) {
    element = el;
    if (entry) entry.media = el;
    const img = el.querySelector('img, video') as HTMLImageElement | HTMLVideoElement | null;
    const read = () => {
      const w =
        img instanceof HTMLImageElement ? Number(img.getAttribute('width')) || img.naturalWidth : img?.videoWidth;
      const h =
        img instanceof HTMLImageElement ? Number(img.getAttribute('height')) || img.naturalHeight : img?.videoHeight;
      if (w && h) auto = { w, h };
    };
    read();
    img?.addEventListener('load', read);
    img?.addEventListener('loadedmetadata', read);
    return () => {
      element = null;
      if (entry?.media === el) entry.media = undefined;
      img?.removeEventListener('load', read);
      img?.removeEventListener('loadedmetadata', read);
    };
  }
</script>

<div
  data-ramka-media
  data-width={sized ? w : undefined}
  data-height={sized ? h : undefined}
  style:--ramka-ratio={sized ? w! / h! : undefined}
  {...rest}
  {@attach media}
>
  {@render children?.()}
</div>
