<script lang="ts">
  import type { GalleryItem } from '#lib/gallery/items.js';
  import { lqip } from './images/lqip.js';

  let { item, blur = false }: { item: GalleryItem; blur?: boolean } = $props();
  const nonce = Math.random().toString(36).slice(2);
</script>

<img
  src="/api/slow-image?ms=500&url={encodeURIComponent(item.src)}&n={nonce}"
  alt={item.alt}
  width={item.width}
  height={item.height}
  draggable="false"
  class="bg-cover select-none"
  style={blur ? lqip(item) : undefined}
/>
