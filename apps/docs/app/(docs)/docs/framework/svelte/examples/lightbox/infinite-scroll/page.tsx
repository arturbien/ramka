import type { Metadata } from 'next';

import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Infinite scroll example · Svelte',
  description:
    'An endless photo feed whose lightbox paginates too: swiping near the end fetches the next page and appends slides to the native scroll-snap track while the viewer stays open, built with ramka.',
};

export default function SvelteInfiniteScrollPage() {
  return <SvelteDemo id="examples/infinite-scroll/InfiniteScroll" />;
}
