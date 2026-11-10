import type { Metadata } from 'next';

import { ComponentPreview } from '../../../../../../_components/component-preview';
import { ExampleShell } from '../../../../../../_components/example-shell';
import { readSourceFiles } from '../../../../../../_components/read-source-files';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Store gallery lightbox preset · Svelte',
  description:
    'An e-commerce product gallery lightbox for Svelte: thumbnail rail and a buy panel with price, highlights, and a CTA, built from ramka lightbox primitives.',
};

export default async function SvelteStorePresetPage() {
  const files = await readSourceFiles([
    {
      path: 'svelte/src/lib/presets/store/index.ts',
      name: 'index.ts',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/store/Gallery.svelte',
      name: 'Gallery.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/store/Trigger.svelte',
      name: 'Trigger.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/store/lightbox.css',
      name: 'lightbox.css',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/store/Demo.svelte',
      name: 'Demo.svelte',
      group: 'example',
      note: 'App composition for the preview. Not part of the package; swap the scoped styles for your own tokens/CSS.',
    },
  ]);

  return (
    <ExampleShell
      title="Store"
      description={
        <>
          A full commerce viewer: the media stage (vertical thumbnail rail, pager, corner zoom) sits beside a buy panel
          with price, highlights, and the add-to-cart CTA. On mobile the panel collapses into a sticky price + CTA bar,
          so the shopper never loses the buy button while inspecting photos. Copy the{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files (
          <code className="text-xs">index.ts</code>, <code className="text-xs">Gallery.svelte</code>,{' '}
          <code className="text-xs">Trigger.svelte</code> + <code className="text-xs">lightbox.css</code>) into your
          design system, then wire triggers in your app. The{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Example</strong> tab shows a product
          card whose thumbnails swap the main image, viewer navigation synced back so the close morph lands on the
          visible image, and add-to-cart state shared between the card and the viewer.
        </>
      }
      docsHref={svelteDocsPages.overview.href}
      docsLabel="Lightbox overview"
    >
      <ComponentPreview files={files} frame={false}>
        <SvelteDemo id="presets/store/Demo" />
      </ComponentPreview>
    </ExampleShell>
  );
}
