# Film trailers

Movie posters morph into a fullscreen <video> that auto-plays on becoming active.

## Source

```tsx docs/framework/svelte/examples/lightbox/film-trailers/page.tsx
import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Film trailers example · Svelte',
  description:
    'A Svelte video lightbox example: movie posters morph into fullscreen videos that autoplay on becoming active, built with ramka.',
};

export default function SvelteFilmTrailersPage() {
  return (
    <ExampleShell
      title="Film trailers"
      description={
        <>
          Each poster is its own{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Root</code> with a
          single-item gallery and a{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Item</code> snippet
          for the video.{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            crossfade=&quot;close&quot;
          </code>{' '}
          hard-cuts the open morph into the video and dissolves the live frame back into the poster on close. Video
          autoplays (muted) only after{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">onOpenChangeComplete</code>.
        </>
      }
    >
      <SvelteDemo id="examples/film-trailers/Demo" />
    </ExampleShell>
  );
}
```

```svelte svelte/src/lib/examples/film-trailers/Demo.svelte
<script lang="ts">
  import Film, { type FilmItem } from './Film.svelte';

  const base = '/svelte/examples/film-trailers';

  const films: FilmItem[] = [
    {
      id: 'bbb',
      title: 'Big Buck Bunny',
      year: 2008,
      genre: 'Animation',
      poster: `${base}/bbb-poster.jpg`,
      posterWidth: 500,
      posterHeight: 707,
      video: 'https://download.blender.org/peach/trailer/trailer_iphone.m4v',
      videoWidth: 480,
      videoHeight: 270,
    },
    {
      id: 'ed',
      title: "Elephant's Dream",
      year: 2006,
      genre: 'Sci-Fi',
      poster: `${base}/ed-poster.jpg`,
      posterWidth: 500,
      posterHeight: 707,
      video: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
      videoWidth: 426,
      videoHeight: 240,
    },
    {
      id: 'sintel',
      title: 'Sintel',
      year: 2010,
      genre: 'Fantasy',
      poster: `${base}/sintel-poster.jpg`,
      posterWidth: 500,
      posterHeight: 707,
      video: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
      videoWidth: 1280,
      videoHeight: 720,
    },
    {
      id: 'tos',
      title: 'Tears of Steel',
      year: 2012,
      genre: 'Sci-Fi',
      poster: `${base}/tos-poster.png`,
      posterWidth: 500,
      posterHeight: 741,
      video: 'https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4',
      videoWidth: 862,
      videoHeight: 360,
    },
  ];
</script>

<div class="film-trailers">
  <div class="intro">
    <div class="eyebrow">Now Streaming</div>
    <h2>Blender Open Movies</h2>
    <p>Four Creative Commons shorts from the Blender Foundation. Click any poster to watch fullscreen.</p>
  </div>

  <div class="grid">
    {#each films as film (film.id)}
      <Film {film} />
    {/each}
  </div>
</div>

<style>
  .film-trailers {
    max-width: 48rem;
  }
  .intro {
    padding-block: 1.25rem;
  }
  .eyebrow {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #737373;
  }
  h2 {
    margin: 0.25rem 0 0;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 600;
    letter-spacing: -0.025em;
  }
  p {
    max-width: 28rem;
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #737373;
  }
  :global(:is(.dark, [data-theme='dark'])) :is(.eyebrow, p) {
    color: #a3a3a3;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
```

```svelte svelte/src/lib/examples/film-trailers/Film.svelte
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
```

```svelte svelte/src/lib/examples/film-trailers/SoloViewer.svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Lightbox } from '@ramka/svelte';
  import X from '@lucide/svelte/icons/x';
  import './viewer.css';

  interface Props {
    ariaLabel: string;
    caption: string;
    preload?: number;
    pullToClose?: boolean;
    children: Snippet;
  }

  let { ariaLabel, caption, preload = 3, pullToClose = true, children }: Props = $props();
</script>

<Lightbox.Portal>
  <Lightbox.Backdrop class="film-trailers-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} {pullToClose} class="film-trailers-content">
    <Lightbox.Slides
      aria-label="Full-size images"
      aria-roledescription="carousel"
      {preload}
      class="film-trailers-slides"
    >
      <Lightbox.Slide>
        <Lightbox.Item index={0} {caption} aria-roledescription="slide" aria-label="1 of 1">
          {@render children()}
        </Lightbox.Item>
      </Lightbox.Slide>
    </Lightbox.Slides>

    <div class="film-trailers-chrome-top film-trailers-chrome-hide">
      <Lightbox.Close class="film-trailers-button" aria-label="Close">
        <X aria-hidden="true" strokeWidth={2.25} />
        <span class="film-trailers-tooltip" aria-hidden="true">Close</span>
      </Lightbox.Close>
    </div>

    <div class="film-trailers-chrome-bottom film-trailers-chrome-hide">
      <div class="film-trailers-caption-group">
        <Lightbox.Caption class="film-trailers-caption" />
      </div>
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
```

```css svelte/src/lib/examples/film-trailers/viewer.css
.film-trailers-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: rgb(255 255 255 / 0.9);
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, cubic-bezier(0.16, 1, 0.3, 1));
}

.film-trailers-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

@starting-style {
  .film-trailers-backdrop[data-open] {
    opacity: 0;
  }
}

.film-trailers-backdrop[data-pulling] {
  transition: none;
}

:is(.dark, [data-theme='dark']) .film-trailers-backdrop {
  background-color: rgb(0 0 0 / 0.9);
}

.film-trailers-content {
  --lightbox-inset-top: calc(4rem + env(safe-area-inset-top, 0px));
  --lightbox-inset-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  --lightbox-inset-inline: 0px;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  transition: opacity var(--lightbox-vt-duration, 360ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.film-trailers-content[data-open] {
  opacity: 1;
}

@starting-style {
  .film-trailers-content[data-open] {
    opacity: 0;
  }
}

@media (min-width: 768px) {
  .film-trailers-content {
    --lightbox-inset-top: calc(4.5rem + env(safe-area-inset-top, 0px));
    --lightbox-inset-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
    --lightbox-inset-inline: 3rem;
  }
}

.film-trailers-slides {
  flex: 1 1 0%;
  gap: 1.25rem;
  --lightbox-ssr-slide-gap: 1.25rem;
}

.film-trailers-slides::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .film-trailers-slides {
    gap: 0;
    --lightbox-ssr-slide-gap: 0px;
  }
}

.film-trailers-slides [data-ramka-slide] {
  box-sizing: border-box;
  height: 100%;
  flex: 0 0 100%;
  min-width: 100%;
  padding-top: var(--lightbox-inset-top);
  padding-bottom: var(--lightbox-inset-bottom);
  padding-inline: var(--lightbox-inset-inline);
}

.film-trailers-chrome-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .film-trailers-chrome-hide {
    opacity: 0;
  }
}

.film-trailers-content:is([data-pulling], [data-pull-dismissing]) .film-trailers-chrome-hide,
.film-trailers-content[data-zoomed] .film-trailers-chrome-bottom.film-trailers-chrome-hide {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.film-trailers-content[data-zoomed] .film-trailers-slides {
  z-index: 10;
}

.film-trailers-content[data-zoomed] .film-trailers-chrome-bottom {
  z-index: 0;
}

@media (max-width: 767px) {
  .film-trailers-content[data-zoomed] .film-trailers-chrome-top.film-trailers-chrome-hide {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 200ms,
      visibility 0s linear 200ms;
  }
}

.film-trailers-chrome-top {
  position: absolute;
  inset-inline-end: 0.75rem;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  z-index: 30;
  display: flex;
  gap: 0.5rem;
}

.film-trailers-chrome-bottom {
  box-sizing: border-box;
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: var(--lightbox-inset-bottom);
  padding: 0 0.75rem env(safe-area-inset-bottom, 0px);
}

.film-trailers-caption-group {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.film-trailers-caption {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  color: #171717;
}

:is(.dark, [data-theme='dark']) .film-trailers-caption {
  color: #fafafa;
}

.film-trailers-button {
  position: relative;
  box-sizing: border-box;
  pointer-events: auto;
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  font: inherit;
  border: 1px solid rgb(0 0 0 / 0.2);
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.55);
  color: #171717;
  box-shadow:
    0 0.5px 1px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  transition-property: background-color, box-shadow, transform, opacity, color;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.film-trailers-button svg {
  width: 18px;
  height: 18px;
}

@media (hover: hover) {
  .film-trailers-button:hover {
    background-image: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  }
}

.film-trailers-button:active {
  scale: 0.96;
  background-image: linear-gradient(rgba(0, 0, 0, 0.09), rgba(0, 0, 0, 0.09));
}

.film-trailers-button:focus {
  outline: none;
}

.film-trailers-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(0 0 0 / 0.25),
    0 0.5px 1px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.65);
}

:is(.dark, [data-theme='dark']) .film-trailers-button {
  border-color: rgb(255 255 255 / 0.25);
  background-color: rgb(23 23 23 / 0.45);
  color: #fff;
  box-shadow:
    0 0 0 0.5px #000,
    0 0.5px 1px rgba(0, 0, 0, 0.45),
    0 1px 2px rgba(0, 0, 0, 0.35),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.14);
}

@media (hover: hover) {
  :is(.dark, [data-theme='dark']) .film-trailers-button:hover {
    background-image: linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08));
  }
}

:is(.dark, [data-theme='dark']) .film-trailers-button:active {
  background-image: linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12));
}

:is(.dark, [data-theme='dark']) .film-trailers-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 0.4),
    0 0 0 0.5px #000,
    0 0.5px 1px rgba(0, 0, 0, 0.45),
    0 1px 2px rgba(0, 0, 0, 0.35),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.14);
}

.film-trailers-tooltip {
  position: absolute;
  top: calc(100% + 5px);
  right: -8px;
  z-index: 50;
  box-sizing: border-box;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  background-color: #0a0a0a;
  color: #fff;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 400;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform-origin: calc(100% - 25px) top;
  scale: 0.95;
  transition:
    opacity 150ms ease,
    scale 150ms ease,
    visibility 0s linear 150ms;
}

.film-trailers-tooltip::before {
  content: '';
  position: absolute;
  top: 4px;
  right: 25px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: inherit;
  transform: translate(50%, calc(-50% - 2px)) rotate(45deg);
}

@media (hover: hover) {
  .film-trailers-button:hover > .film-trailers-tooltip {
    opacity: 1;
    visibility: visible;
    scale: 1;
    transition:
      opacity 150ms ease 600ms,
      scale 150ms ease 600ms,
      visibility 0s linear 600ms;
  }
}

.film-trailers-button:focus-visible > .film-trailers-tooltip {
  opacity: 1;
  visibility: visible;
  scale: 1;
  transition:
    opacity 150ms ease,
    scale 150ms ease,
    visibility 0s;
}

:is(.dark, [data-theme='dark']) .film-trailers-tooltip {
  background-color: #fafafa;
  color: #000;
}
```
