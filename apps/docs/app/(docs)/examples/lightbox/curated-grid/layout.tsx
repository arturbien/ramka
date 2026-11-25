import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Metadata only: the page is a client component and cannot export it itself.
export const metadata: Metadata = {
  title: 'Curated grid example',
  description:
    'A vacation-rental cover grid that shows five picks from a 21-photo tour: photos without a tile close onto the "Show all photos" tile, built with ramka.',
};

export default function CuratedGridLayout({ children }: { children: ReactNode }) {
  return children;
}
