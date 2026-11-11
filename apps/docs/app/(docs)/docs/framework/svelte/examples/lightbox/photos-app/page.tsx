import type { Metadata } from 'next';

import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Photos app example · Svelte',
  description:
    'A macOS Photos-style Svelte image gallery: a square grid under a sticky blurred toolbar that opens into a morphing lightbox, built with ramka.',
};

export default function SveltePhotosAppPage() {
  return <SvelteDemo id="examples/photos-app/PhotosApp" />;
}
