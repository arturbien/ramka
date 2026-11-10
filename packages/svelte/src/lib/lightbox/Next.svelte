<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { warnUnnamed } from './dom.js';
  import { getModel } from './state.svelte.js';

  let { children, ...rest }: HTMLButtonAttributes = $props();
  const lb = getModel();
</script>

<button
  type="button"
  disabled={!lb.canNext}
  data-ramka-next
  data-disabled={!lb.canNext || undefined}
  {...rest}
  onclick={(e) => {
    rest.onclick?.(e);
    if (!e.defaultPrevented) lb.go(lb.index + 1, 'button');
  }}
  {@attach warnUnnamed('Lightbox.Next')}
>
  {@render children?.()}
</button>
