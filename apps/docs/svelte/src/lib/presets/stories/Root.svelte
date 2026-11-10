<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import type { ComponentProps } from 'svelte';

  let {
    open = $bindable(false),
    index = $bindable(0),
    onBeforeClose,
    ...rest
  }: ComponentProps<typeof Lightbox.Root> = $props();

  let root: ReturnType<typeof Lightbox.Root>;

  /** Opens at `i`, morphing from its Trigger when one is registered. */
  export function show(i = index) {
    return root.show(i);
  }

  /** Closes, morphing back to the Trigger picked by `morphTo`. */
  export function close() {
    return root.close();
  }

  function pauseDialogVideos(scope: Element | null) {
    for (const video of scope?.querySelectorAll('video') ?? []) video.pause();
  }
</script>

<Lightbox.Root
  bind:this={root}
  bind:open
  bind:index
  {...rest}
  onBeforeClose={(ctx) => {
    pauseDialogVideos(ctx.destination?.closest('[data-ramka-content]') ?? ctx.destination);
    onBeforeClose?.(ctx);
  }}
/>
