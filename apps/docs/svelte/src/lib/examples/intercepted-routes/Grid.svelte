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
