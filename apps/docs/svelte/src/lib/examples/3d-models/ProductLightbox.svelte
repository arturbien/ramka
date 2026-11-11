<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import SoloViewer from '#lib/examples/film-trailers/SoloViewer.svelte';
  import { mountScene, waitForLightboxPainted, type Product } from './scene.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  let { product }: { product: Product } = $props();

  const FRAME_SIZE = 1024;
  let open = $state(false);
  let orbitReady = $state(false);
</script>

<Lightbox.Root
  awaitImageDecode={false}
  onOpenChange={(next) => {
    open = next;
    if (!next) orbitReady = false;
  }}
  onBeforeOpen={({ signal }) => waitForLightboxPainted(product.id, { signal, timeoutMs: 2500 })}
  onOpenChangeComplete={(next) => (orbitReady = next)}
>
  <CloseOnBack />
  <Lightbox.Trigger index={0} crossfade="both" class="models-3d-trigger">
    <div data-ramka-morph class="tile">
      <div
        class="trigger-scene"
        {@attach (host) =>
          mountScene(host, {
            product,
            role: 'trigger',
            interactive: () => false,
            autoRotate: () => !open,
          })}
      ></div>
    </div>
    <div class="meta">
      <div class="name">{product.name}</div>
      <div class="material">{product.material}</div>
    </div>
  </Lightbox.Trigger>

  <SoloViewer ariaLabel={product.name} caption="{product.name} · {product.material}" preload={0} pullToClose={false}>
    <div class="center">
      <Lightbox.Media width={FRAME_SIZE} height={FRAME_SIZE} class="models-3d-media">
        <div
          class="lightbox-scene"
          {@attach (host) =>
            mountScene(host, {
              product,
              role: 'lightbox',
              interactive: () => orbitReady,
              autoRotate: () => open,
            })}
        ></div>
      </Lightbox.Media>
    </div>
  </SoloViewer>
</Lightbox.Root>

<style>
  :global(.models-3d-trigger) {
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
    text-align: center;
    cursor: pointer;
  }
  :global(.models-3d-trigger:focus-visible) {
    outline: 2px solid oklch(62.3% 0.214 259.815);
    outline-offset: 2px;
  }
  .tile {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 14px;
    background: transparent;
  }
  .trigger-scene {
    pointer-events: none;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .meta {
    padding: 0.625rem 0.125rem 0;
    text-align: center;
  }
  .name {
    font-size: 0.875rem;
    line-height: 1.375;
    font-weight: 500;
  }
  .material {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #737373;
  }
  :global(:is(.dark, [data-theme='dark'])) .material {
    color: #a3a3a3;
  }
  .center {
    container-type: size;
    display: flex;
    width: 100%;
    height: calc(100% + var(--lightbox-inset-top) + var(--lightbox-inset-bottom));
    margin-top: calc(-1 * var(--lightbox-inset-top));
    align-items: center;
    justify-content: center;
  }
  :global(.models-3d-media) {
    overflow: hidden;
    border-radius: 14px;
    background: transparent;
  }
  .lightbox-scene {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .tile :global(.models-3d-canvas),
  .lightbox-scene :global(.models-3d-canvas) {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    background: transparent;
  }
</style>
