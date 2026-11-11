<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const lightbox = Lightbox.createHandle();
</script>

<button type="button" onclick={() => lightbox.open(0)}>פתיחת הגלריה</button>
<button type="button" onclick={() => lightbox.goTo(3)}>מעבר לתמונה 4</button>

<Lightbox.Root handle={lightbox} dir="rtl">
  {@render children()}
</Lightbox.Root>
