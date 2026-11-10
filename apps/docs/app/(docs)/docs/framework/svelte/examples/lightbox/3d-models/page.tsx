import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: '3D models example · Svelte',
  description:
    'A Three.js product grid in a Svelte lightbox: onBeforeOpen preheats GLB models before the morph, with a shared orbit between trigger and slide.',
};

export default function Svelte3dModelsPage() {
  return (
    <ExampleShell
      title="3D models"
      description={
        <>
          Each tile is its own{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Root</code> with a
          single-item gallery, Three.js canvases in the trigger and{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Media</code>.{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">onBeforeOpen</code> waits for
          the prepared lightbox canvas to paint a synced frame before the morph (spin stays live, like close). Rotate
          only (no zoom); orbit stays in sync with the grid tile.{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            pullToClose=&#123;false&#125;
          </code>{' '}
          so vertical drag stays with orbit.
        </>
      }
      docsHref={`${svelteDocsPages.stateLifecycle.href}#before-open`}
      docsLabel="State & lifecycle · onBeforeOpen"
    >
      <SvelteDemo id="examples/3d-models/Demo" />
    </ExampleShell>
  );
}
