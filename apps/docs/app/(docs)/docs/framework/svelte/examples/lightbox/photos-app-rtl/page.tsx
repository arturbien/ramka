import type { Metadata } from 'next';

import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Photos app example (RTL) · Svelte',
  description:
    'The photos app example mirrored for a right-to-left locale: dir="rtl" on Lightbox.Root mirrors navigation, the thumbnail strip, and the arrow keys.',
};

export default function SveltePhotosAppRtlPage() {
  return <SvelteDemo id="examples/photos-app/PhotosApp" props={{ dir: 'rtl' }} />;
}
