<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ThumbnailGroup from './ThumbnailGroup.svelte';
  import { getStrip } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, ...rest }: Props = $props();
  const strip = getStrip();

  function register(el: HTMLElement) {
    strip?.setTrack(el);
    return () => strip?.setTrack(undefined);
  }
</script>

<ThumbnailGroup data-ramka-thumbnail-strip-track {...rest} {@attach register}>
  {@render children?.()}
</ThumbnailGroup>
