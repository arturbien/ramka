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
