# Infinite scroll

An endless feed where the lightbox paginates too — one photo array drives grid tiles and slides; the grid keeps a few screens of photos loaded below the viewport, and onValueChange fetches ahead inside the open viewer, appending to Root itemIds. Lightbox.VirtualSlides and a virtualized grid keep only nearby slides and tiles mounted however long the feed gets; a reveal callback brings the viewed photo’s row back for the close morph.

## Source

```tsx examples/lightbox/infinite-scroll/page.tsx
import type { Metadata } from 'next';

import { InfiniteScrollFeed } from './infinite-scroll-feed';

export const metadata: Metadata = {
  title: 'Infinite scroll example',
  description:
    'An endless photo feed whose lightbox paginates too: swiping near the end fetches the next page and appends slides to the native scroll-snap track while the viewer stays open, built with ramka.',
};

export default function InfiniteScrollPage() {
  return <InfiniteScrollFeed />;
}
```
