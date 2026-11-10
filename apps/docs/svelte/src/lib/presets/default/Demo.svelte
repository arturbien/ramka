<script lang="ts">
  import { Lightbox, type LightboxItem } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const photo = (id: string) => ({
    src: `/photos/preset-trip-${id}.jpg`,
    thumb: `/photos/preset-trip-${id}-thumb.jpg`,
  });

  const trip: LightboxItem[] = [
    { ...photo('a'), alt: 'Maya on the ridge', caption: 'Maya Chen', width: 1200, height: 1200 },
    {
      ...photo('b'),
      alt: 'Cliffside road at sunset',
      caption: 'Cliffside road at sunset',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('c'),
      alt: 'Turquoise cove',
      caption: 'A turquoise cove',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('d'),
      alt: 'Trail through pines',
      caption: 'Through the pines',
      width: 1200,
      height: 1500,
    },
    {
      ...photo('e'),
      alt: 'Camp under the stars',
      caption: 'Camp under the stars',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('f'),
      alt: 'Morning coffee on the rocks',
      caption: 'Morning on the rocks',
      width: 1200,
      height: 1200,
    },
    {
      ...photo('g'),
      alt: 'Waterfall in the canyon',
      caption: 'Hidden waterfall',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('h'),
      alt: 'Wildflowers on the hillside',
      caption: 'Wildflower meadow',
      width: 1200,
      height: 1500,
    },
    {
      ...photo('i'),
      alt: 'Kayaks on calm water',
      caption: 'Kayak at dawn',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('j'),
      alt: 'Sunset over the lake',
      caption: 'Golden hour',
      width: 1200,
      height: 1200,
    },
    {
      ...photo('k'),
      alt: 'Boardwalk through the marsh',
      caption: 'Coastal marsh',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('l'),
      alt: 'Fire lookout tower',
      caption: 'Summit lookout',
      width: 1200,
      height: 1500,
    },
  ];

  const extra = trip.length - 4;
  const portrait = trip[0];
  const listing = trip[1];
</script>

<div class="demo preset-default-demo">
  <Lightbox.Root morphTo="closest" awaitImageDecode={false}>
    <p class="label">+N overlay with crossfade</p>
    <div class="album">
      {#each trip.slice(0, 4) as img, i (img.src)}
        {@const overlay = i === 3 && extra > 0}
        <Lightbox.Trigger index={i} crossfade={overlay ? 'both' : undefined} class="tile">
          {#snippet children({ morphRef, imageRef })}
            <span class="tile-morph corner-{i}" {@attach morphRef}>
              <img width={img.width} height={img.height} src={img.thumb} alt={img.alt} {@attach imageRef} />
              {#if overlay}
                <span class="more">+{extra}</span>
              {/if}
            </span>
          {/snippet}
        </Lightbox.Trigger>
      {/each}
    </div>
    <CloseOnBack />
    <Lightbox.Gallery items={trip} ariaLabel="Trip photos" />
  </Lightbox.Root>

  <Lightbox.Root awaitImageDecode={false}>
    <p class="label">Child morph via morphRef</p>
    <Lightbox.Trigger index={0} class="card listing">
      {#snippet children({ morphRef, imageRef })}
        <img
          class="listing-image"
          width={listing.width}
          height={listing.height}
          src={listing.thumb}
          alt={listing.alt}
          {@attach morphRef}
          {@attach imageRef}
        />
        <span class="listing-body">
          <span class="title">Cliffside cottage</span>
          <span class="meta">Big Sur, CA · Sleeps 4</span>
          <span class="price">$420 <span>night</span></span>
        </span>
      {/snippet}
    </Lightbox.Trigger>
    <CloseOnBack />
    <Lightbox.Gallery items={[{ ...listing, caption: 'Cliffside cottage · Big Sur' }]} ariaLabel="Cliffside cottage" />
  </Lightbox.Root>

  <Lightbox.Root awaitImageDecode={false}>
    <p class="label">Whole trigger morph</p>
    <Lightbox.Trigger index={0} crossfade="both" class="user">
      {#snippet children({ morphRef, imageRef })}
        <span class="card user-card" {@attach morphRef}>
          <img width={portrait.width} height={portrait.height} src={portrait.thumb} alt="" {@attach imageRef} />
          <span class="user-text">
            <span class="title">Maya Chen</span>
            <span class="meta">@mayachen</span>
            <span class="role">Photographer</span>
          </span>
        </span>
      {/snippet}
    </Lightbox.Trigger>
    <CloseOnBack />
    <Lightbox.Gallery items={[portrait]} ariaLabel="Maya Chen portrait" />
  </Lightbox.Root>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
    max-width: 28rem;
  }
  .demo img {
    display: block;
  }
  .label {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    color: #737373;
  }
  .album {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 2px;
    aspect-ratio: 3 / 2;
    width: 100%;
    overflow: hidden;
    border-radius: 0.75rem;
  }
  .demo :global(.tile) {
    position: relative;
    display: block;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .tile-morph {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .corner-0 {
    border-top-left-radius: 0.75rem;
  }
  .corner-1 {
    border-top-right-radius: 0.75rem;
  }
  .corner-2 {
    border-bottom-left-radius: 0.75rem;
  }
  .corner-3 {
    border-bottom-right-radius: 0.75rem;
  }
  .tile-morph img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .more {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 0.5);
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
    color: #fff;
  }

  .demo :global(.card),
  .card {
    box-sizing: border-box;
    border: 1px solid #d4d4d4;
    border-radius: 1rem;
    background: #fff;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.06),
      0 4px 12px rgb(0 0 0 / 0.06);
  }
  .title {
    display: block;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #171717;
  }
  .meta {
    display: block;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #737373;
  }

  .demo :global(.listing) {
    display: block;
    width: 100%;
    overflow: hidden;
    text-align: start;
  }
  .listing-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    border-radius: 1rem 1rem 0 0;
    object-fit: cover;
  }
  .listing-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.75rem;
  }
  .price {
    display: block;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: #262626;
  }
  .price span {
    font-weight: 400;
    color: #737373;
  }

  .demo :global(.user) {
    display: block;
    width: 11rem;
    border-radius: 1rem;
  }
  .user-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    text-align: center;
  }
  .user-card img {
    width: 4rem;
    height: 4rem;
    border-radius: 9999px;
    object-fit: cover;
  }
  .user-text {
    min-width: 0;
  }
  .role {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #525252;
  }

  :global(.dark .preset-default-demo .card) {
    border-color: #525252;
    background: #262626;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.4),
      0 4px 16px rgb(0 0 0 / 0.35);
  }
  :global(.dark) .title {
    color: #fafafa;
  }
  :global(.dark) .price {
    color: #e5e5e5;
  }
  :global(.dark) .role {
    color: #a3a3a3;
  }
</style>
