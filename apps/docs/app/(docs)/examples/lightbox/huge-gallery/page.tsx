import type { Metadata } from 'next';

import { HugeGallery } from './huge-gallery';

export const metadata: Metadata = {
  title: 'Huge gallery example',
  description:
    'A 5,000-photo lightbox that mounts only the slides around the active one, on a native scroll-snap track, built with ramka.',
};

export default function HugeGalleryPage() {
  return <HugeGallery />;
}
