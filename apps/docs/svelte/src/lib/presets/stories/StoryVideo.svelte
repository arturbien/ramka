<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  interface Props {
    src: string;
    poster: string;
    alt: string;
    width: number;
    height: number;
    active: boolean;
  }

  let { src, poster, alt, width, height, active }: Props = $props();
  const lb = Lightbox.getLightbox();

  const playing = $derived(active && lb.open && !lb.pulling && !lb.pullDismissing);

  function playback(video: HTMLVideoElement) {
    if (playing) video.play().catch(() => {});
    else video.pause();
  }
</script>

<video
  {src}
  {poster}
  {width}
  {height}
  playsinline
  muted
  loop
  preload={active ? 'auto' : 'metadata'}
  aria-label={alt}
  class="stl-video"
  {@attach playback}
></video>
