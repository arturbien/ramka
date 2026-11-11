<script lang="ts">
  import ProductLightbox from './ProductLightbox.svelte';
  import type { Product } from './scene.js';

  const assetBase = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models';

  const products: Product[] = [
    {
      id: 'shoe',
      name: 'Materials Variants Shoe',
      material: 'Leather · multi-variant',
      src: `${assetBase}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb`,
    },
    {
      id: 'chair',
      name: 'Damask Chair',
      material: 'Purple & gold fabric',
      src: `${assetBase}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
    },
    {
      id: 'bottle',
      name: 'Water Bottle',
      material: 'Brushed metal',
      src: `${assetBase}/WaterBottle/glTF-Binary/WaterBottle.glb`,
    },
    {
      id: 'helmet',
      name: 'Damaged Helmet',
      material: 'Sci-fi prop',
      src: `${assetBase}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
    },
  ];
</script>

<div class="models-3d">
  <div class="intro">
    <div class="eyebrow">Object studio</div>
    <h2>Khronos sample assets</h2>
    <p>Open any model. Orbit stays in sync with the grid tile.</p>
  </div>

  <div class="grid">
    {#each products as product (product.id)}
      <ProductLightbox {product} />
    {/each}
  </div>
</div>

<style>
  .models-3d {
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
</style>
