import type { Metadata } from 'next';

import { ComponentPreview } from '../../../../../../_components/component-preview';
import { ExampleShell } from '../../../../../../_components/example-shell';
import { readSourceFiles } from '../../../../../../_components/read-source-files';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Twitter-style lightbox preset · Svelte',
  description:
    'A Twitter-style media viewer for Svelte: split media and thread sidebar, translucent backdrop, and edge navigation, built from ramka lightbox primitives.',
};

export default async function SvelteTwitterPresetPage() {
  const files = await readSourceFiles([
    {
      path: 'svelte/src/lib/presets/twitter/index.ts',
      name: 'index.ts',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/Gallery.svelte',
      name: 'Gallery.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/ThreadPanel.svelte',
      name: 'ThreadPanel.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/Trigger.svelte',
      name: 'Trigger.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/Icon.svelte',
      name: 'Icon.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/lightbox.css',
      name: 'lightbox.css',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/twitter/Demo.svelte',
      name: 'Demo.svelte',
      group: 'example',
      note: 'App composition for the preview, with its own scoped styles. Not part of the package; swap them for your own tokens/CSS.',
    },
  ]);

  return (
    <ExampleShell
      title="Twitter"
      description={
        <>
          X-style split viewer: a semi-translucent dark media pane with close (top-left) and previous/next on the
          gallery edges. Desktop keeps a white thread sidebar; mobile shows a bottom engagement bar and opens the thread
          as a full-screen sheet from the comment control. Copy the{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files (
          <code className="text-xs">index.ts</code>, the <code className="text-xs">.svelte</code> files and{' '}
          <code className="text-xs">lightbox.css</code>) into your design system, then wire triggers in your app. The{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Example</strong> tab shows a three-post
          feed with Facebook-style image grids: single image, three-up, and a <code className="text-xs">+N</code>{' '}
          crossfade tile, each opening the split viewer (scoped CSS only).
        </>
      }
      docsHref={svelteDocsPages.overview.href}
      docsLabel="Lightbox overview"
    >
      <ComponentPreview files={files}>
        <SvelteDemo id="presets/twitter/Demo" />
      </ComponentPreview>
    </ExampleShell>
  );
}
