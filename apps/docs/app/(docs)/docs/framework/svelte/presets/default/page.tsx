import type { Metadata } from 'next';

import { ComponentPreview } from '../../../../../../_components/component-preview';
import { ExampleShell } from '../../../../../../_components/example-shell';
import { readSourceFiles } from '../../../../../../_components/read-source-files';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Default lightbox preset · Svelte',
  description:
    'A copy-paste Svelte lightbox preset: morphing open, swipe navigation, zoom, thumbnails, and captions, styled like the ramka docs and ready for a design system.',
};

export default async function SvelteDefaultPresetPage() {
  const files = await readSourceFiles([
    {
      path: 'svelte/src/lib/presets/default/index.ts',
      name: 'index.ts',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/default/Gallery.svelte',
      name: 'Gallery.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/default/Trigger.svelte',
      name: 'Trigger.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/default/lightbox.css',
      name: 'lightbox.css',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/default/Demo.svelte',
      name: 'Demo.svelte',
      group: 'example',
      note: 'App composition for the preview. Not part of the package; import the styled Lightbox from ./index.js and compose triggers like this.',
    },
  ]);

  return (
    <ExampleShell
      title="Default"
      description={
        <>
          Plain CSS: <code className="text-xs">Gallery.svelte</code> and <code className="text-xs">Trigger.svelte</code>{' '}
          pair with <code className="text-xs">lightbox.css</code>, and <code className="text-xs">index.ts</code> exports
          the styled <code className="text-xs">Lightbox</code> namespace. Drop the{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files into a
          design-system entry, then compose triggers in your app. Gallery includes a top-right{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Theater / Peek</strong> toggle
          (desktop) to switch between full-width and aspect-sized slide tracks. The{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Example</strong> tab shows the live
          preview (<code className="text-xs">+N</code> crossfade, child <code className="text-xs">morphRef</code>,
          whole-trigger morph). It is app UI, not part of the skin.
        </>
      }
      docsHref={svelteDocsPages.overview.href}
      docsLabel="Lightbox overview"
    >
      <ComponentPreview files={files}>
        <SvelteDemo id="presets/default/Demo" />
      </ComponentPreview>
    </ExampleShell>
  );
}
