<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setNonce } from './state.svelte.js';

  let { nonce, children }: { nonce?: string; children?: Snippet } = $props();

  setNonce(() => nonce);
</script>

{@render children?.()}
