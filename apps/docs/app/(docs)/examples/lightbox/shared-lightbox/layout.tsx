import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Metadata only: the page is a client component and cannot export it itself.
export const metadata: Metadata = {
  title: 'Shared lightbox example',
  description:
    'One lightbox for many galleries: a virtualized React group chat where every photo, in any message, opens in a single shared morphing lightbox, built with ramka.',
};

export default function SharedLightboxLayout({ children }: { children: ReactNode }) {
  return children;
}
