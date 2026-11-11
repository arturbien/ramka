<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { containTouchScroll } from './dom.js';
  import { getModel } from './state.svelte.js';

  let props: HTMLAttributes<HTMLDivElement> = $props();
  const lb = getModel();
</script>

<div
  aria-hidden="true"
  data-ramka-backdrop
  data-open={lb.open || undefined}
  data-closed={!lb.open || undefined}
  data-pulling={lb.pulling || undefined}
  data-pull-snapping={lb.pullSnapping || undefined}
  {...props}
  onclick={(e) => {
    props.onclick?.(e);
    if (!e.defaultPrevented) lb.close();
  }}
  {@attach containTouchScroll}
></div>
