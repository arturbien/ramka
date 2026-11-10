<script lang="ts">
  import { Lightbox, type LightboxItem } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const photo = (name: string) => ({
    src: `/photos/edit-${name}.jpg`,
    thumb: `/photos/edit-${name}-thumb.jpg`,
  });

  const figures: LightboxItem[] = [
    {
      ...photo('harbor'),
      alt: 'The old harbor at dawn, boats resting in still water',
      caption: 'The old harbor at dawn. Most of the fleet has not left the quay in a decade.',
      credit: 'Photograph: Anna Beck',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('nets'),
      alt: 'Fishing nets stacked on the pier',
      caption: 'Nets stacked on the pier — mended each winter, used less each spring.',
      credit: 'Photograph: Anna Beck',
      width: 1000,
      height: 1400,
    },
    {
      ...photo('market'),
      alt: 'The near-empty fish market hall in the early morning',
      caption: 'The market hall opens at five. By seven, the day’s catch is gone.',
      credit: 'Photograph: Jonas Ravn',
      width: 1600,
      height: 1000,
    },
  ];
</script>

{#snippet figure(index: number)}
  {@const item = figures[index]}
  <figure>
    <Lightbox.Trigger {index} class="editorial-demo-trigger">
      <span class="morph" data-ramka-morph>
        <img src={item.thumb} alt={item.alt} width={item.width} height={item.height} draggable="false" />
      </span>
    </Lightbox.Trigger>
    <figcaption>
      {item.caption} <span class="credit">{item.credit}</span>
    </figcaption>
  </figure>
{/snippet}

<article class="editorial-demo">
  <Lightbox.Root
    loop
    awaitImageDecode={false}
    scrollTriggerIntoView={[
      { type: 'onOpenComplete', behavior: 'instant', block: 'nearest' },
      { type: 'onClose', behavior: 'instant', block: 'nearest' },
    ]}
  >
    <p class="kicker">Dispatch</p>
    <h3>The last fishermen of the northern coast</h3>
    <p class="byline">By Anna Beck · 8 min read</p>

    <p class="body first">
      The village wakes before the light does. For sixty years the boats went out whatever the weather; now, on most
      mornings, only three engines cough to life along the whole quay.
    </p>

    <div class="spaced">{@render figure(0)}</div>

    <p class="body spaced">
      Ask anyone here when it changed and they will not name a year. The harbor emptied the way harbors do — one
      retirement at a time, one son who moved to the city, one quota that made a small boat pointless.
    </p>

    <div class="pair spaced">
      {@render figure(1)}
      {@render figure(2)}
    </div>

    <CloseOnBack />
    <Lightbox.Gallery items={figures} ariaLabel="Article photographs" />
  </Lightbox.Root>
</article>

<style>
  .editorial-demo {
    width: 100%;
    max-width: 36rem;
    text-align: start;
  }
  p,
  h3,
  figure {
    margin: 0;
  }
  .kicker {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #a3a3a3;
  }
  h3 {
    margin-top: 0.5rem;
    font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
    font-size: 26px;
    font-weight: 400;
    line-height: 1.375;
    letter-spacing: -0.025em;
    color: #171717;
  }
  .byline {
    margin-top: 0.5rem;
    font-size: 13px;
    color: #737373;
  }
  .body {
    font-size: 15px;
    line-height: 1.75rem;
    color: #404040;
  }
  .first {
    margin-top: 1.25rem;
  }
  .spaced {
    margin-top: 1.5rem;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .editorial-demo :global(.editorial-demo-trigger) {
    display: block;
    width: 100%;
    overflow: hidden;
    border-radius: 0.5rem;
    scroll-margin-block: 1.25rem;
  }
  .morph {
    display: block;
    overflow: hidden;
    border-radius: 0.5rem;
  }
  .morph img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  figcaption {
    margin-top: 0.5rem;
    font-size: 13px;
    line-height: 1.25rem;
    color: #737373;
  }
  .credit {
    color: #a3a3a3;
  }
  :global(:is(.dark, [data-theme='dark'])) h3 {
    color: #fafafa;
  }
  :global(:is(.dark, [data-theme='dark'])) .body {
    color: #d4d4d4;
  }
  :global(:is(.dark, [data-theme='dark'])) .credit {
    color: #525252;
  }
</style>
