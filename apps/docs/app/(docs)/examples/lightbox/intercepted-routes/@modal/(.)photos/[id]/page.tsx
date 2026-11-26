import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PhotoRoute } from '../../../photo-viewer';
import { interceptedPhotos, interceptedPhotoTitle } from '../../../photos';

interface InterceptedPhotoRouteProps {
  params: Promise<{ id: string }>;
}

// The intercepted navigation resolves metadata from this route, not the grid
// underneath; without a title here the tab falls back to the site default.
export async function generateMetadata({ params }: InterceptedPhotoRouteProps): Promise<Metadata> {
  const { id } = await params;
  const photo = interceptedPhotos.find((p) => p.id === id);
  return photo ? { title: interceptedPhotoTitle(photo) } : {};
}

/**
 * The intercepting route: `(.)` matches `photos/[id]` at the same segment
 * level, so a soft navigation from the grid renders THIS page into the
 * layout's `@modal` slot instead of navigating to the standalone photo page —
 * the grid stays mounted underneath. Hard loads never come here (interception
 * is client-navigation-only); they get `photos/[id]/page.tsx`.
 *
 * It renders nothing: the viewer lives in the layout, and this only keeps it
 * on the photo the URL names.
 */
export default async function InterceptedPhotoRoute({ params }: InterceptedPhotoRouteProps) {
  const { id } = await params;
  if (!interceptedPhotos.some((photo) => photo.id === id)) notFound();
  return <PhotoRoute photoId={id} />;
}
