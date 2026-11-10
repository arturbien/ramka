<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import Gallery from './Gallery.svelte';
  import { BASE_PATH, GALLERY_PAGE_TITLE, galleryPhotos, photoIndexFromPathname, photoPageTitle } from './photos.js';

  const COLUMN_UNITS = 120;
  const GAP_UNITS = 9;
  const span = (photo: { width: number; height: number }) =>
    Math.round((COLUMN_UNITS * photo.height) / photo.width) + GAP_UNITS;

  const pathname = $derived((page.shallow?.url ?? page.url).pathname);
  const urlIndex = $derived(photoIndexFromPathname(pathname));
  const deepLinkVisit = untrack(() => urlIndex !== -1);

  let open = $state(deepLinkVisit);
  let index = $state(untrack(() => Math.max(urlIndex, 0)));
  let written: string | undefined;
  let ssr = $state(deepLinkVisit);

  $effect.pre(() => {
    const i = urlIndex;
    if (pathname === written) return void (written = undefined);
    untrack(() => {
      open = i !== -1;
      if (i !== -1) index = i;
    });
  });

  function hydrated() {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => (ssr = false));
    });
    return () => cancelAnimationFrame(frame);
  }

  function write(path: string, push: boolean) {
    written = path;
    goto(path, { shallow: true, replace: !push });
  }

  function onOpenChange(next: boolean) {
    if (next) write(`${BASE_PATH}/${galleryPhotos[index].id}`, true);
    else write(BASE_PATH, false);
  }

  function onValueChange(next: number) {
    if (open) write(`${BASE_PATH}/${galleryPhotos[next].id}`, false);
  }
</script>

<svelte:head>
  <title>{open ? photoPageTitle(galleryPhotos[index]) : GALLERY_PAGE_TITLE}</title>
</svelte:head>

<Lightbox.Root
  bind:open
  bind:index
  {onOpenChange}
  {onValueChange}
  count={galleryPhotos.length}
  loop
  scrollTriggerIntoView={[
    { type: 'onChange', behavior: 'instant' },
    { type: 'onOpenComplete', behavior: 'instant' },
  ]}
>
  <div class="masonry" {@attach hydrated}>
    <div class="grid">
      {#each galleryPhotos as photo, i (photo.id)}
        <Lightbox.Trigger
          index={i}
          class="tile"
          style="grid-row-end: span {span(photo)}; margin-bottom: calc(var(--masonry-unit) * {GAP_UNITS})"
        >
          <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
        </Lightbox.Trigger>
      {/each}
    </div>
  </div>

  <Gallery
    items={galleryPhotos}
    ariaLabel="Gallery photos"
    captionFallback={deepLinkVisit ? galleryPhotos[index].caption : undefined}
    ssrSlideShift
    inPlace={deepLinkVisit}
    portalClass={deepLinkVisit ? ['url-synced-state-in-place', ssr && 'url-synced-state-ssr'] : undefined}
  />
</Lightbox.Root>

<style>
  .masonry {
    max-width: 42rem;
    container-type: inline-size;
  }

  .grid {
    --masonry-unit: calc(100cqw / 249);
    display: grid;
    grid-auto-flow: dense;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: var(--masonry-unit);
    column-gap: calc(var(--masonry-unit) * 9);
  }

  @media (min-width: 640px) {
    .grid {
      --masonry-unit: calc(100cqw / 378);
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .grid :global(.tile) {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 0.75rem;
    background: transparent;
    cursor: pointer;
  }

  .grid :global(.tile:focus-visible) {
    outline: 2px solid #2b7fff;
    outline-offset: 2px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
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
