import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Film trailers example · Svelte',
  description:
    'A Svelte video lightbox example: movie posters morph into fullscreen videos that autoplay on becoming active, built with ramka.',
};

export default function SvelteFilmTrailersPage() {
  return (
    <ExampleShell
      title="Film trailers"
      description={
        <>
          Each poster is its own{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Root</code> with a
          single-item gallery and a{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Item</code> snippet
          for the video.{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            crossfade=&quot;close&quot;
          </code>{' '}
          hard-cuts the open morph into the video and dissolves the live frame back into the poster on close. Video
          autoplays (muted) only after{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">onOpenChangeComplete</code>.
        </>
      }
    >
      <SvelteDemo id="examples/film-trailers/Demo" />
    </ExampleShell>
  );
}
