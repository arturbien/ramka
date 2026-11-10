import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExampleShell } from '../../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../../../_content/svelte/docs-pages';
import { GALLERY_PAGE_TITLE, galleryPhotos, photoPageTitle } from '@/svelte/src/lib/examples/url-synced-state/photos';

interface UrlSyncedStateRouteProps {
  params: Promise<{ id?: string[] }>;
}

/** Prerender the grid plus every photo permalink. */
export function generateStaticParams() {
  return [{ id: [] }, ...galleryPhotos.map((photo) => ({ id: [photo.id] }))];
}

/** Per-photo title, description and share card on deep links. */
export async function generateMetadata({ params }: UrlSyncedStateRouteProps): Promise<Metadata> {
  const { id } = await params;
  const photo = id?.length ? galleryPhotos.find((p) => p.id === id[0]) : undefined;
  if (photo) {
    const title = photoPageTitle(photo);
    return {
      title,
      description: `${photo.alt}: a deep link straight into the lightbox, driven by a SvelteKit optional parameter and ramka's controlled open / index props.`,
      openGraph: {
        title,
        description: photo.alt,
        images: [{ url: photo.src, width: photo.width, height: photo.height, alt: photo.alt }],
      },
      twitter: { card: 'summary_large_image' },
    };
  }
  return {
    title: GALLERY_PAGE_TITLE,
    description:
      'A masonry lightbox wired to SvelteKit routing: every photo is a shareable URL. Deep links open the viewer, swipes rewrite the URL, browser Back closes it. Built with ramka.',
  };
}

export default async function SvelteUrlSyncedStatePage({ params }: UrlSyncedStateRouteProps) {
  const { id } = await params;
  if (id?.length && (id.length > 1 || !galleryPhotos.some((photo) => photo.id === id[0]))) notFound();
  return (
    <ExampleShell
      title="URL-synced state"
      description={
        <>
          Every photo in this masonry wall is its own URL, driven by a SvelteKit optional parameter: the page lives at
          an [[id]] route, and the lightbox is controlled via bind:open / bind:index on Lightbox.Root. Tapping a tile
          opens the viewer and pushes /docs/framework/svelte/examples/lightbox/url-synced-state/5 with SvelteKit shallow
          routing (goto with shallow: true), swiping rewrites that URL in place (replace: true), and the browser Back
          button closes the viewer. Loading a photo URL cold serves per-photo metadata and opens the viewer as soon as
          the page mounts: deep-link visits render the Portal in place (container=&#123;null&#125;) instead of moving it
          into document.body, and Slides ssrSlideShift paints the right photo on the first frame. Because the URL writes
          happen in the gesture callbacks, trigger taps keep the view-transition morph.
        </>
      }
      docsHref={svelteDocsPages.stateLifecycle.href}
      docsLabel="State & lifecycle docs"
    >
      <SvelteDemo id="examples/url-synced-state/Demo" />
    </ExampleShell>
  );
}
