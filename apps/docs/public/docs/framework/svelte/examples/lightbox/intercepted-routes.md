# Intercepted routes

The nextgram pattern with SvelteKit shallow routing: plain links whose clicks push the photo URL and open an already-open controlled lightbox over the grid. Back closes it, hard loads get a standalone photo page (one URL, two presentations).

## Source

```tsx docs/framework/svelte/examples/lightbox/intercepted-routes/page.tsx
import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Intercepted routes example · Svelte',
  description:
    'A photo grid wired to SvelteKit shallow routing: clicking a tile pushes the photo URL and opens the lightbox over the grid; loading that URL cold renders a standalone photo page instead. Built with ramka.',
};

export default function SvelteInterceptedRoutesPage() {
  return (
    <ExampleShell
      title="Intercepted routes"
      description={
        <>
          The nextgram pattern in SvelteKit: a grid of plain links whose clicks become shallow routing. Each click calls
          goto(url, &#123; shallow: true, state &#125;) with the photo URL, and the grid renders an already-open,
          controlled lightbox from that state, so the URL reads
          /docs/framework/svelte/examples/lightbox/intercepted-routes/photos/3 while the grid stays underneath. Browser
          Back closes it. Hard-loading the same photo URL skips the shallow state entirely and renders the real
          photos/[id] route, a standalone photo page: one URL, two presentations. Compare with the URL-synced state
          example, which keeps one presentation (grid + viewer) on refresh and keeps trigger morphs.
        </>
      }
      docsHref={svelteDocsPages.stateLifecycle.href}
      docsLabel="State & lifecycle docs"
    >
      <SvelteDemo id="examples/intercepted-routes/Grid" />
    </ExampleShell>
  );
}
```

```svelte svelte/src/lib/examples/intercepted-routes/Grid.svelte
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PhotoModal from './PhotoModal.svelte';
  import {
    EXAMPLE_PAGE_TITLE,
    interceptedPhotoTitle,
    interceptedPhotos,
    photoHref,
    type InterceptedPhoto,
  } from './photos.js';

  const selected = $derived(page.state.photo);
  const selectedIndex = $derived(interceptedPhotos.findIndex((photo) => photo.id === selected));

  function intercept(event: MouseEvent, photo: InterceptedPhoto) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goto(photoHref(photo), { shallow: true, state: { photo: photo.id } });
  }
</script>

<svelte:head>
  <title>{selectedIndex === -1 ? EXAMPLE_PAGE_TITLE : interceptedPhotoTitle(interceptedPhotos[selectedIndex])}</title>
</svelte:head>

<div class="grid">
  {#each interceptedPhotos as photo (photo.id)}
    <a href={photoHref(photo)} onclick={(event) => intercept(event, photo)}>
      <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
    </a>
  {/each}
</div>

{#if selectedIndex !== -1}
  <PhotoModal initialIndex={selectedIndex} />
{/if}

<style>
  .grid {
    display: grid;
    max-width: 42rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  a {
    display: block;
    overflow: hidden;
    border-radius: 0.75rem;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    border-radius: 0.75rem;
    object-fit: cover;
    background-color: #f5f5f5;
    transition-property:
      color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow,
      transform, translate, scale, rotate, filter, backdrop-filter;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  img:hover {
    opacity: 0.9;
  }

  :global(:is(.dark, [data-theme='dark'])) img {
    background-color: #262626;
  }
</style>
```

```svelte svelte/src/lib/examples/intercepted-routes/PhotoModal.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import Gallery from '#lib/examples/url-synced-state/Gallery.svelte';
  import { interceptedPhotos, photoHref } from './photos.js';

  interface Props {
    initialIndex: number;
  }

  let { initialIndex }: Props = $props();
  let open = $state(true);
  let index = $state(untrack(() => initialIndex));

  function onValueChange(next: number) {
    const photo = interceptedPhotos[next];
    goto(photoHref(photo), { shallow: true, replace: true, state: { photo: photo.id } });
  }

  function onOpenChangeComplete(isOpen: boolean) {
    if (!isOpen) history.back();
  }
</script>

<Lightbox.Root bind:open bind:index {onValueChange} {onOpenChangeComplete} count={interceptedPhotos.length} loop>
  <Gallery items={interceptedPhotos} ariaLabel="Gallery photos" captionFallback={interceptedPhotos[index].caption} />
</Lightbox.Root>
```

```svelte svelte/src/lib/examples/intercepted-routes/PhotoPage.svelte
<script lang="ts">
  import { EXAMPLE_BASE_PATH, interceptedPhotos } from './photos.js';

  let { id }: { id: string } = $props();
  const photo = $derived(interceptedPhotos.find((p) => p.id === id)!);
</script>

<div class="page">
  <a class="back" href={EXAMPLE_BASE_PATH}>← Back to the gallery</a>
  <figure>
    <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
    <figcaption>{photo.caption}</figcaption>
  </figure>
  <p>
    You hard-loaded this photo URL, so the shallow-routing modal did not apply and you got this standalone page instead
    of the lightbox over the grid: one URL, two presentations. Navigate back to the gallery and click the same photo to
    see the modal presentation.
  </p>
</div>

<style>
  .page {
    box-sizing: border-box;
    width: 100%;
    max-width: 56rem;
    margin-inline: auto;
    padding: 3.5rem 1.5rem;
  }

  @media (min-width: 768px) {
    .page {
      padding: 4rem 2.5rem;
    }
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
    font-size: 13px;
    line-height: calc(1.25 / 0.875);
    color: #737373;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .back:hover {
    color: #262626;
  }

  :global(:is(.dark, [data-theme='dark'])) .back:hover {
    color: #e5e5e5;
  }

  figure {
    margin: 0;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 1rem;
    background-color: #f5f5f5;
  }

  :global(:is(.dark, [data-theme='dark'])) img {
    background-color: #262626;
  }

  figcaption {
    margin-top: 1rem;
    font-size: 15px;
    color: #525252;
  }

  :global(:is(.dark, [data-theme='dark'])) figcaption {
    color: #d4d4d4;
  }

  p {
    max-width: 42rem;
    margin: 2rem 0 0;
    font-size: 13px;
    line-height: 1.5rem;
    color: #737373;
  }
</style>
```

```ts svelte/src/lib/examples/intercepted-routes/photos.ts
/** One photo of the intercepted-routes grid; `id` is the stable URL segment. */
export interface InterceptedPhoto {
  id: string;
  alt: string;
  caption: string;
  src: string;
  width: number;
  height: number;
}

/** Route of the grid; every photo lives at `${EXAMPLE_BASE_PATH}/photos/<id>`. */
export const EXAMPLE_BASE_PATH = '/docs/framework/svelte/examples/lightbox/intercepted-routes';

/** Title of the grid page. */
export const EXAMPLE_PAGE_TITLE = 'Intercepted routes example';

/** Title of a photo URL, shared by the standalone page and the modal. */
export function interceptedPhotoTitle(photo: InterceptedPhoto): string {
  return `${photo.caption}: ${EXAMPLE_PAGE_TITLE}`;
}

/** URL of a photo, both for the modal (shallow) and the standalone page (hard load). */
export const photoHref = (photo: InterceptedPhoto) => `${EXAMPLE_BASE_PATH}/photos/${photo.id}`;

/** The photo catalogue shared by the grid, the modal and the standalone page. */
export const interceptedPhotos: InterceptedPhoto[] = [
  { id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge', file: 'mb-01', height: 1200 },
  { id: '2', alt: 'Empty coastal highway', caption: 'Open road', file: 'mb-02', height: 533 },
  { id: '3', alt: 'Narrow sunlit alley', caption: 'Warm alley', file: 'mb-04', height: 1200 },
  { id: '4', alt: 'Wide desert dunes', caption: 'Dunes', file: 'mb-05', height: 467 },
  { id: '5', alt: 'Calm lake reflection', caption: 'Still water', file: 'mb-07', height: 533 },
  { id: '6', alt: 'Tall concrete staircase', caption: 'Ascent', file: 'mb-08', height: 1200 },
  {
    id: '7',
    alt: 'Panoramic city skyline at dusk',
    caption: 'Dusk skyline',
    file: 'mb-10',
    height: 451,
  },
  {
    id: '8',
    alt: 'Single tree in a green field',
    caption: 'Lone tree',
    file: 'mb-11',
    height: 1161,
  },
].map(({ file, ...photo }) => ({
  ...photo,
  src: `/svelte/examples/url-synced-state/${file}.jpg`,
  width: 800,
}));
```
