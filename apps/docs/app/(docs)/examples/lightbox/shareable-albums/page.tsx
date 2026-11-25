import type { Metadata } from 'next';

import { ShareableAlbumsDemo } from './albums-demo';
import { ALBUMS_PAGE_TITLE, findPhoto } from './albums';

/**
 * `?photo=<id>` links open the viewer on that photo. The page reads the param
 * on the server so the link renders with the viewer already open, and so a
 * shared link unfurls with the photo itself.
 */
interface ShareableAlbumsRouteProps {
  searchParams: Promise<{ photo?: string | string[] }>;
}

async function linkedPhoto({ searchParams }: ShareableAlbumsRouteProps) {
  const { photo } = await searchParams;
  return findPhoto(typeof photo === 'string' ? photo : undefined);
}

export async function generateMetadata(props: ShareableAlbumsRouteProps): Promise<Metadata> {
  const linked = await linkedPhoto(props);
  if (!linked) {
    return {
      title: ALBUMS_PAGE_TITLE,
      description:
        'A photo journal where every photo has a shareable link: one lightbox for every album, server-rendered open from the link with defaultPayload. Built with ramka.',
    };
  }
  const { album, photo } = linked;
  const title = `${photo.caption} · ${album.title} — ${ALBUMS_PAGE_TITLE}`;
  return {
    title,
    description: `${photo.alt}, from ${album.title} by ${album.author.name}.`,
    openGraph: {
      title,
      description: photo.alt,
      images: [{ url: photo.image.src, width: photo.image.width, height: photo.image.height, alt: photo.alt }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function ShareableAlbumsRoute(props: ShareableAlbumsRouteProps) {
  const linked = await linkedPhoto(props);
  return <ShareableAlbumsDemo initialPhotoId={linked?.photo.id ?? null} />;
}
