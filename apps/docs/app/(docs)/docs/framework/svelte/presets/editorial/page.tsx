import type { Metadata } from 'next';

import { ComponentPreview } from '../../../../../../_components/component-preview';
import { ExampleShell } from '../../../../../../_components/example-shell';
import { readSourceFiles } from '../../../../../../_components/read-source-files';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Editorial lightbox preset · Svelte',
  description:
    'A newsroom article-figure lightbox for Svelte: near-black surface with a caption and credit block, built from ramka lightbox primitives.',
};

export default async function SvelteEditorialPresetPage() {
  const files = await readSourceFiles([
    {
      path: 'svelte/src/lib/presets/editorial/index.ts',
      name: 'index.ts',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Gallery.svelte',
      name: 'Gallery.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Trigger.svelte',
      name: 'Trigger.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Portal.svelte',
      name: 'Portal.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Backdrop.svelte',
      name: 'Backdrop.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Content.svelte',
      name: 'Content.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Slides.svelte',
      name: 'Slides.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Slide.svelte',
      name: 'Slide.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Item.svelte',
      name: 'Item.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Media.svelte',
      name: 'Media.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Counter.svelte',
      name: 'Counter.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Caption.svelte',
      name: 'Caption.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Close.svelte',
      name: 'Close.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Previous.svelte',
      name: 'Previous.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Next.svelte',
      name: 'Next.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/lightbox.css',
      name: 'lightbox.css',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/editorial/Demo.svelte',
      name: 'Demo.svelte',
      group: 'example',
      note: 'App composition for the preview. Not part of the package; import the styled Lightbox from ./index.js and swap the scoped styles for your own tokens.',
    },
  ]);

  return (
    <ExampleShell
      title="Editorial"
      description={
        <>
          The viewer newsrooms use for article figures: a near-black surface in both color schemes, a typography-forward
          caption and credit block under the media, and ghost controls. Keyboard-first, no zoom: a reading context, not
          an inspection one. Copy the{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files (
          <code className="text-xs">index.ts</code>, the <code className="text-xs">.svelte</code> parts and{' '}
          <code className="text-xs">lightbox.css</code>) into your design system, then wire triggers in your app. The{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Example</strong> tab shows an article
          excerpt whose inline figures open the viewer with their caption and credit.
        </>
      }
      docsHref={svelteDocsPages.overview.href}
      docsLabel="Lightbox overview"
    >
      <ComponentPreview files={files}>
        <SvelteDemo id="presets/editorial/Demo" />
      </ComponentPreview>
    </ExampleShell>
  );
}
