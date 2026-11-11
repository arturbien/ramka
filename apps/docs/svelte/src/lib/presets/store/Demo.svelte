<script lang="ts">
  import { Lightbox, type LightboxItem, type ProductInfo } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const product: ProductInfo = {
    name: 'Terra 27L Backpack',
    price: '$149',
    compareAtPrice: '$189',
    badge: 'New colour',
    description:
      'Waxed canvas, full-grain leather straps, and a padded 16″ laptop sleeve. Weather-ready for the daily commute or a weekend on the trail.',
    highlights: [
      'Water-resistant waxed canvas shell',
      'Padded 16″ laptop compartment',
      'Magnetic quick-access top pocket',
      'Lifetime repair guarantee',
    ],
    stockNote: 'In stock — ships in 2 days',
  };

  const photo = (id: string) => ({
    src: `/photos/store-pack-${id}.jpg`,
    thumb: `/photos/store-pack-${id}-thumb.jpg`,
  });

  const images: LightboxItem[] = [
    { ...photo('a'), alt: 'Terra 27L backpack, front view', width: 1200, height: 1500 },
    { ...photo('b'), alt: 'Terra 27L backpack, side profile', width: 1200, height: 1500 },
    { ...photo('c'), alt: 'Detail of the waxed canvas and zippers', width: 1200, height: 1200 },
    { ...photo('d'), alt: 'The backpack on a trail at golden hour', width: 1600, height: 1000 },
    {
      ...photo('e'),
      alt: 'Interior compartments, laptop sleeve visible',
      width: 1200,
      height: 1500,
    },
  ];

  let selected = $state(0);
  let added = $state(false);
  const current = $derived(images[selected]);
  const ctaLabel = $derived(added ? 'Added to bag ✓' : 'Add to bag');
</script>

<div class="store-demo">
  <Lightbox.Root loop onValueChange={(value) => (selected = value)} awaitImageDecode={false}>
    <div class="layout">
      <div class="gallery">
        <Lightbox.Trigger index={selected} class="store-demo-trigger">
          {#snippet children({ imageRef })}
            {#key current.src}
              <img
                src={current.thumb}
                alt={current.alt}
                width={current.width}
                height={current.height}
                class="main-image"
                draggable="false"
                {@attach imageRef}
              />
            {/key}
          {/snippet}
        </Lightbox.Trigger>

        <div class="thumbs" role="listbox" aria-label="Select product image">
          {#each images as img, i (img.src)}
            <button
              type="button"
              role="option"
              aria-selected={i === selected}
              aria-label={img.alt}
              class="thumb"
              data-selected={i === selected || undefined}
              onclick={() => (selected = i)}
            >
              <img src={img.thumb} alt="" draggable="false" />
            </button>
          {/each}
        </div>
      </div>

      <div class="info">
        <p class="badge">{product.badge}</p>
        <h3 class="name">{product.name}</h3>
        <p class="price">
          <span>{product.price}</span>
          <s>{product.compareAtPrice}</s>
        </p>
        <p class="description">{product.description}</p>
        <button type="button" class="cta" onclick={() => (added = true)}>{ctaLabel}</button>
      </div>
    </div>

    <CloseOnBack />
    <Lightbox.Gallery
      items={images}
      {product}
      ariaLabel="{product.name} gallery"
      {ctaLabel}
      onAddToCart={() => (added = true)}
    />
  </Lightbox.Root>
</div>

<style>
  .store-demo {
    width: 100%;
    max-width: 42rem;
    line-height: 1.5;
  }
  .layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .gallery {
    min-width: 0;
    flex: 1 1 0%;
  }
  .store-demo :global(.store-demo-trigger) {
    display: block;
    width: 100%;
    overflow: hidden;
    background-color: #f5f5f5;
  }
  .main-image {
    display: block;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  .thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .thumb {
    box-sizing: border-box;
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    flex-shrink: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
    border: 1px solid #e5e5e5;
    background: transparent;
    opacity: 0.7;
    transition-property: color, background-color, border-color, outline-color, opacity, box-shadow, transform;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .thumb:hover {
    opacity: 1;
  }
  .thumb[data-selected] {
    border-color: #171717;
    opacity: 1;
  }
  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .info {
    width: 100%;
  }
  .badge {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #b45309;
  }
  .name {
    margin: 0.375rem 0 0;
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    color: #171717;
  }
  .price {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0.25rem 0 0;
    font-size: 15px;
  }
  .price span {
    color: #171717;
  }
  .price s {
    font-size: 13px;
    color: #a3a3a3;
  }
  .description {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    line-height: 1.625;
    color: #525252;
  }
  .cta {
    box-sizing: border-box;
    width: 100%;
    margin-top: 1.5rem;
    padding: 0.625rem 1.25rem;
    border: 0;
    border-radius: 9999px;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    background-color: #171717;
    color: #fff;
    transition-property: color, background-color, border-color, outline-color, opacity, box-shadow, transform;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta:hover {
    background-color: #404040;
  }

  @media (min-width: 768px) {
    .layout {
      flex-direction: row;
      align-items: flex-start;
      gap: 2rem;
    }
    .info {
      width: 14rem;
      flex-shrink: 0;
    }
  }

  :global(.dark) .store-demo :global(.store-demo-trigger) {
    background-color: #262626;
  }
  :global(.dark) .thumb {
    border-color: #404040;
  }
  :global(.dark) .thumb[data-selected] {
    border-color: #f5f5f5;
  }
  :global(.dark) .badge {
    color: #fbbf24;
  }
  :global(.dark) .name {
    color: #fafafa;
  }
  :global(.dark) .price span {
    color: #f5f5f5;
  }
  :global(.dark) .description {
    color: #a3a3a3;
  }
  :global(.dark) .cta {
    background-color: #f5f5f5;
    color: #171717;
  }
  :global(.dark) .cta:hover {
    background-color: #d4d4d4;
  }
</style>
