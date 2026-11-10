import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SvelteDemo } from '../../../../../../../../../_components/svelte-demo';
import { interceptedPhotoTitle, interceptedPhotos } from '@/svelte/src/lib/examples/intercepted-routes/photos';

interface PhotoRouteProps {
  params: Promise<{ id: string }>;
}

/** Prerender every photo's standalone page. */
export function generateStaticParams() {
  return interceptedPhotos.map((photo) => ({ id: photo.id }));
}

/** Per-photo title, description and share card. */
export async function generateMetadata({ params }: PhotoRouteProps): Promise<Metadata> {
  const { id } = await params;
  const photo = interceptedPhotos.find((p) => p.id === id);
  if (!photo) return {};
  const title = interceptedPhotoTitle(photo);
  return {
    title,
    description: `${photo.alt}: the standalone hard-load presentation of an intercepted photo route.`,
    openGraph: {
      title,
      description: photo.alt,
      images: [{ url: photo.src, width: photo.width, height: photo.height, alt: photo.alt }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SvelteInterceptedPhotoPage({ params }: PhotoRouteProps) {
  const { id } = await params;
  if (!interceptedPhotos.some((photo) => photo.id === id)) notFound();
  return <SvelteDemo id="examples/intercepted-routes/PhotoPage" props={{ id }} />;
}
