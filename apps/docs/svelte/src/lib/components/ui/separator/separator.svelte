<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  role="separator"
  data-slot="separator"
  data-orientation="horizontal"
  class={[
    'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
    className,
  ]}
  {...restProps}
></div>
