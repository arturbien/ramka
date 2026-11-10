import { fileURLToPath } from 'node:url';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/svelte-demos/',
  publicDir: false,
  plugins: [svelte({ emitCss: false })],
  resolve: {
    alias: [
      { find: /^#lib\//, replacement: src('lib/') },
      { find: '$app/navigation', replacement: src('shims/navigation.ts') },
      { find: '$app/state', replacement: src('shims/state.svelte.ts') },
      { find: '$app/env', replacement: src('shims/env.ts') },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL('../public/svelte-demos', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      input: src('entry.ts'),
      preserveEntrySignatures: 'exports-only',
      output: { entryFileNames: 'entry.js' },
    },
  },
});
