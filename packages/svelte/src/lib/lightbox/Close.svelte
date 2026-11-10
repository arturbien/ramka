<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { warnUnnamed } from './dom.js';
  import { getModel } from './state.svelte.js';

  let { children, ...rest }: HTMLButtonAttributes = $props();
  const lb = getModel();
</script>

<button
  type="button"
  data-ramka-close
  {...rest}
  onclick={(e) => {
    rest.onclick?.(e);
    if (!e.defaultPrevented) lb.close();
  }}
  {@attach warnUnnamed('Lightbox.Close')}
>
  {@render children?.()}
</button>
