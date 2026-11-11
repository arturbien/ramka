import type { Metadata } from 'next';

import { ComponentPreview } from '../../../../../../_components/component-preview';
import { ExampleShell } from '../../../../../../_components/example-shell';
import { readSourceFiles } from '../../../../../../_components/read-source-files';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Stories lightbox preset · Svelte',
  description:
    'An Instagram Stories-style viewer for Svelte: an avatar tray that crossfades into 9:16 video with a scroll-driven 3D page turn, built with ramka.',
};

export default async function SvelteStoriesPresetPage() {
  const files = await readSourceFiles([
    {
      path: 'svelte/src/lib/presets/stories/index.ts',
      name: 'index.ts',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/Root.svelte',
      name: 'Root.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/Trigger.svelte',
      name: 'Trigger.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/Gallery.svelte',
      name: 'Gallery.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/StoryVideo.svelte',
      name: 'StoryVideo.svelte',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/lightbox.css',
      name: 'lightbox.css',
      group: 'package',
    },
    {
      path: 'svelte/src/lib/presets/stories/Demo.svelte',
      name: 'Demo.svelte',
      group: 'example',
      note: 'App composition for the preview, with scoped styles. Not part of the package; swap the styles for your own tokens/CSS.',
    },
  ]);

  return (
    <ExampleShell
      title="Stories"
      description={
        <>
          Instagram-style stories: a horizontal row of avatars, each dissolving into a vertical video via{' '}
          <code className="text-xs">crossfade=&quot;both&quot;</code> (the circle is not the 9:16 frame, so a geometry
          morph would look wrong). Inside the viewer, slides are a native snap scroller with a CSS view-timeline
          rotateY: cards hinge on their leading edge as they enter and on their trailing edge as they leave. Copy the{' '}
          <strong className="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files (
          <code className="text-xs">index.ts</code>, the <code className="text-xs">.svelte</code> files and{' '}
          <code className="text-xs">lightbox.css</code>) into your design system, then wire triggers in your app.
        </>
      }
      docsHref={svelteDocsPages.overview.href}
      docsLabel="Lightbox overview"
    >
      <ComponentPreview files={files} frame={false}>
        <SvelteDemo id="presets/stories/Demo" />
      </ComponentPreview>
    </ExampleShell>
  );
}
