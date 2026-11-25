import type { Metadata } from 'next';

import { ExampleShell } from '../../../../_components/example-shell';
import { PhotoTile } from './photo-viewer';
import { EXAMPLE_PAGE_TITLE, interceptedPhotos } from './photos';

export const metadata: Metadata = {
  title: EXAMPLE_PAGE_TITLE,
  description:
    'A photo grid wired to Next.js intercepted + parallel routes: clicking a tile morphs the lightbox open and soft-navigates to the photo URL; loading that URL cold renders a standalone photo page instead. Built with ramka.',
};

/**
 * Each tile is a `Lightbox.Trigger` rendered as a `<Link>` (see PhotoTile): the
 * click opens the viewer through the gesture path, so it morphs from the tile,
 * and the same click navigates to the photo URL, which Next.js intercepts
 * (`@modal/(.)photos/[id]`) while this page stays on screen. A refresh on a
 * photo URL still renders a different presentation (the standalone page);
 * the Shareable albums example keeps the viewer open on refresh instead.
 *
 * `scroll={false}` on the Links keeps the grid's scroll position — without
 * it, Next scrolls the page to the top on every navigation.
 */
export default function InterceptedRoutesGridPage() {
  return (
    <ExampleShell
      title="Intercepted routes"
      description="The nextgram pattern with a morph: a @modal parallel-route slot and an (.)photos/[id] intercepting route, with one controlled lightbox in the layout. Every tile is a Lightbox.Trigger rendered as a Next.js Link, so a click morphs the viewer open from the tile and soft-navigates to the photo URL in one go. Swiping rewrites the URL in place, closing morphs back onto the tile and pops the entry, and browser Back and Forward close and reopen the viewer. Hard-loading a photo URL skips interception entirely and renders a standalone photo page: one URL, two presentations."
      docsHref="/docs/lightbox/state-lifecycle"
      docsLabel="State & lifecycle docs"
    >
      <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {interceptedPhotos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
    </ExampleShell>
  );
}
