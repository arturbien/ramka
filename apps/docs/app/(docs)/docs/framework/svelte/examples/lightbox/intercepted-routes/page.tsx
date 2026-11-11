import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Intercepted routes example · Svelte',
  description:
    'A photo grid wired to SvelteKit shallow routing: clicking a tile pushes the photo URL and opens the lightbox over the grid; loading that URL cold renders a standalone photo page instead. Built with ramka.',
};

export default function SvelteInterceptedRoutesPage() {
  return (
    <ExampleShell
      title="Intercepted routes"
      description={
        <>
          The nextgram pattern in SvelteKit: a grid of plain links whose clicks become shallow routing. Each click calls
          goto(url, &#123; shallow: true, state &#125;) with the photo URL, and the grid renders an already-open,
          controlled lightbox from that state, so the URL reads
          /docs/framework/svelte/examples/lightbox/intercepted-routes/photos/3 while the grid stays underneath. Browser
          Back closes it. Hard-loading the same photo URL skips the shallow state entirely and renders the real
          photos/[id] route, a standalone photo page: one URL, two presentations. Compare with the URL-synced state
          example, which keeps one presentation (grid + viewer) on refresh and keeps trigger morphs.
        </>
      }
      docsHref={svelteDocsPages.stateLifecycle.href}
      docsLabel="State & lifecycle docs"
    >
      <SvelteDemo id="examples/intercepted-routes/Grid" />
    </ExampleShell>
  );
}
