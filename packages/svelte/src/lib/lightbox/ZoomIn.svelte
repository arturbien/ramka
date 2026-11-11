<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { warnUnnamed } from './dom.js';
  import { getModel, getZoom } from './state.svelte.js';

  let { children, ...rest }: HTMLButtonAttributes = $props();
  const lb = getModel();
  const local = getZoom();
  const zoom = $derived(local ?? lb.activeZoom);
  const disabled = $derived(!zoom?.canZoomIn);
</script>

<button
  type="button"
  {disabled}
  data-ramka-zoom-in
  data-disabled={disabled || undefined}
  {...rest}
  onclick={(e) => {
    rest.onclick?.(e);
    if (!e.defaultPrevented) zoom?.zoomIn();
  }}
  {@attach warnUnnamed('Lightbox.ZoomIn')}
>
  {@render children?.()}
</button>
