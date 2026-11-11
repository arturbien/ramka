<script lang="ts">
  import { Lightbox } from '#lib';

  let { report }: { report: (name: string, value: unknown) => void } = $props();
  const outside = {
    item: Lightbox.getItem(),
    trigger: Lightbox.getTrigger(),
    stage: Lightbox.getStage(),
    media: Lightbox.getMedia(),
  };
  $effect(() => report('outside', outside));
</script>
