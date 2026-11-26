# Huge gallery

A 5,000-photo library in one lightbox. Lightbox.VirtualSlides mounts only the slides around the active one, with spacers standing in for the rest so the native scroll-snap track keeps its full length; Root itemIds lets a photo whose slide is not mounted be opened, counted and navigated to.

## Source

```tsx examples/lightbox/huge-gallery/page.tsx
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
```
