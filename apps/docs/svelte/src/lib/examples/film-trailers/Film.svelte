<script lang="ts" module>
  /** One Blender open movie: poster for the trigger, video sized to its own frame. */
  export interface FilmItem {
    id: string;
    title: string;
    year: number;
    genre: string;
    poster: string;
    posterWidth: number;
    posterHeight: number;
    video: string;
    videoWidth: number;
    videoHeight: number;
  }
</script>

<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import Play from '@lucide/svelte/icons/play';
  import SoloViewer from './SoloViewer.svelte';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  let { film }: { film: FilmItem } = $props();

  let readyToPlay = $state(false);

  function playback(video: HTMLVideoElement) {
    if (readyToPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }
</script>

<Lightbox.Root
  onOpenChange={(open) => {
    if (!open) readyToPlay = false;
  }}
  onOpenChangeComplete={(open) => (readyToPlay = open)}
>
  <CloseOnBack />
  <Lightbox.Trigger index={0} crossfade="close" class="film-trailers-trigger">
    {#snippet children({ morphRef })}
      <div class="film-trailers-poster" {@attach morphRef}>
        <img src={film.poster} alt={film.title} width={film.posterWidth} height={film.posterHeight} loading="lazy" />
        <div class="film-trailers-play">
          <div class="film-trailers-play-circle">
            <Play aria-hidden="true" />
          </div>
        </div>
      </div>
      <div class="film-trailers-meta">
        <div class="film-trailers-title">{film.title}</div>
        <div class="film-trailers-subtitle">{film.year} · {film.genre}</div>
      </div>
    {/snippet}
  </Lightbox.Trigger>

  <SoloViewer ariaLabel={film.title} caption={film.title}>
    <Lightbox.Zoom>
      <Lightbox.Media width={film.videoWidth} height={film.videoHeight} class="film-trailers-media">
        <video
          {@attach playback}
          src={film.video}
          poster={film.poster}
          width={film.videoWidth}
          height={film.videoHeight}
          controls
          playsinline
          muted
          preload="metadata"
        ></video>
      </Lightbox.Media>
    </Lightbox.Zoom>
  </SoloViewer>
</Lightbox.Root>

<style>
  :global(.film-trailers-trigger) {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 14px;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: left;
    cursor: pointer;
  }
  :global(.film-trailers-trigger:focus-visible) {
    outline: 2px solid oklch(62.3% 0.214 259.815);
    outline-offset: 2px;
  }
  .film-trailers-poster {
    position: relative;
    overflow: hidden;
    border-radius: 14px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2 / 3;
    border-radius: 14px;
    object-fit: cover;
  }
  .film-trailers-play {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background-color: rgb(0 0 0 / 0.25);
    opacity: 0;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @media (hover: hover) {
    :global(.film-trailers-trigger:hover) .film-trailers-play {
      opacity: 1;
    }
  }
  .film-trailers-play-circle {
    display: flex;
    width: 3rem;
    height: 3rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: rgb(255 255 255 / 0.95);
    color: #000;
  }
  .film-trailers-play-circle :global(svg) {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
  .film-trailers-meta {
    padding: 0.625rem 0.125rem 0;
  }
  .film-trailers-title {
    font-size: 0.875rem;
    line-height: 1.375;
    font-weight: 500;
  }
  .film-trailers-subtitle {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #737373;
  }
  :global(:is(.dark, [data-theme='dark'])) .film-trailers-subtitle {
    color: #a3a3a3;
  }
  :global(.film-trailers-media) {
    overflow: hidden;
    border-radius: 14px;
  }
  video {
    object-fit: cover;
  }
</style>
