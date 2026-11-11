<script lang="ts">
  import { Lightbox } from '#lib';

  let { report }: { report: (name: string, value: unknown) => void } = $props();
  const media = Lightbox.getMedia();
  const item = Lightbox.getItem();
  $effect(() =>
    report('media', {
      element: media?.element?.hasAttribute('data-ramka-media'),
      index: item?.index,
    }),
  );
</script>
