import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Metadata only: the page is a client component and cannot export it itself.
export const metadata: Metadata = {
  title: 'Text message example',
  description:
    'A virtualized group chat in React where every photo opens in one shared morphing lightbox, built with ramka.',
};

export default function TextMessageLayout({ children }: { children: ReactNode }) {
  return children;
}
