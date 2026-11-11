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
