import type { Metadata } from 'next';

import { CodeBlock } from '../../../../_components/code-block';
import { DocsLink } from '../../../../_components/docs-link';
import { DocsPager } from '../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../_components/docs-shell';
import { lightboxApiHref, lightboxDocsPages } from '../../../../_content/lightbox/docs-pages';
import { lightboxExcerpts } from '../../../../_content/lightbox/excerpts/generated';

export const metadata: Metadata = {
  title: 'Large galleries',
  description:
    'A React lightbox for thousands of photos: Lightbox.VirtualSlides mounts only the slides near the active one, plus a virtualized grid and loading more.',
};

const toc: DocsTocItem[] = [
  { id: 'when', title: 'When you need it' },
  { id: 'switch', title: 'Switching from Slides' },
  { id: 'rules', title: 'Rules' },
  { id: 'virtual-grid', title: 'Virtualized grids' },
  { id: 'load-more', title: 'Loading more' },
];

export default function LightboxLargeGalleriesPage() {
  return (
    <DocsShell
      title="Large galleries"
      description={
        <>
          Thousands of photos, or a feed that keeps growing. Part of{' '}
          <DocsLink href={lightboxDocsPages.overview.href}>Lightbox</DocsLink>.
        </>
      }
      toc={toc}
    >
      <DocsSection id="when" title="When you need it">
        <p>
          <DocsLink href={lightboxApiHref.slides}>Slides</DocsLink> renders one slide for every photo. A few hundred is
          fine. Thousands make opening slow and keep every slide in memory.
        </p>
        <p>
          <DocsLink href={lightboxApiHref.virtualSlides}>VirtualSlides</DocsLink> renders only the slides around the one
          on screen: 7 by default, with photos in the middle 3. Two empty spacers stand in for the rest, so scrolling,
          snapping, and swiping work exactly like Slides.
        </p>
        <p>
          Two props tune the window. <code className="text-xs">preload</code> (default 1) is how many slides on each
          side get their photo. <code className="text-xs">overscan</code> (default 2) adds empty slides past that.
        </p>
      </DocsSection>

      <DocsSection id="switch" title="Switching from Slides">
        <p>Three changes:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Pass <code className="text-xs">itemIds</code> to <DocsLink href={lightboxApiHref.root}>Root</DocsLink>:
            every photo’s id, in order. That’s how the viewer knows the count without rendering them. Forget it and
            nothing renders (you’ll get a warning in development).
          </li>
          <li>
            Children become a function, <code className="text-xs">(index, itemId) =&gt; …</code>, that returns one
            slide. It only runs for the slides being rendered.
          </li>
          <li>
            Make every slide as wide as the scroller: <code className="text-xs">flex: 0 0 100%</code>. Positions of the
            slides that aren’t rendered are worked out from that one width.
          </li>
        </ol>
        <CodeBlock code={lightboxExcerpts['virtual-slides'].code} title={lightboxExcerpts['virtual-slides'].title} />
      </DocsSection>

      <DocsSection id="rules" title="Rules">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">Same-width slides.</strong> No snug
            or mixed-width slides. Development builds warn if the widths differ.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">Space slides with CSS</strong>{' '}
            <code className="text-xs">gap</code>, not margins. The spacers include the gap; they don’t know about
            margins.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">
              No <code className="text-xs">:nth-child</code> on slides.
            </strong>{' '}
            The spacers are siblings, so the counts are off. To style the active photo, use{' '}
            <DocsLink href={lightboxApiHref.item}>Item</DocsLink>’s <code className="text-xs">data-active</code>.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">
              No <code className="text-xs">ssrSlideShift</code>.
            </strong>{' '}
            If the server renders the viewer already open, the first paint may jump on hydration. Opening on the client
            is unaffected.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">
              Thumbnails aren’t virtualized.
            </strong>{' '}
            A strip with thousands of thumbnails renders all of them, so leave it out of very large galleries.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">About 8,000 slides max.</strong>{' '}
            Firefox can’t lay out a track wider than ~8 million pixels: 8,000 slides on a 1000px-wide viewer.
            Development builds warn past that.
          </li>
        </ul>
      </DocsSection>

      <DocsSection id="virtual-grid" title="Virtualized grids">
        <p>
          VirtualSlides handles the viewer. The grid of thumbnails behind it is yours, and with thousands of photos you
          will want to virtualize that too (TanStack Virtual, react-window, …).
        </p>
        <p>
          That breaks one thing: closing. The viewer morphs back into the photo’s tile, but if you swiped 200 photos
          ahead, that tile’s row isn’t rendered. There is nothing to land on.
        </p>
        <p>
          Fix it with <code className="text-xs">reveal</code> on{' '}
          <DocsLink href={`${lightboxDocsPages.viewTransitions.href}#scroll-trigger`}>scrollTriggerIntoView</DocsLink>.
          When the tile isn’t mounted, the lightbox calls <code className="text-xs">reveal</code> instead of scrolling,
          and you scroll your virtualizer to the right row.
        </p>
        <CodeBlock
          code={lightboxExcerpts['virtual-grid-reveal'].code}
          title={lightboxExcerpts['virtual-grid-reveal'].title}
        />
        <p>On close, what you return decides what happens next:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">Nothing</strong> — the close waits a
            few frames for the tile to appear and stop moving, then morphs into it.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">A Promise</strong> — the close waits
            for it first. Use this when your scroll is async.
          </li>
          <li>
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">
              <code className="text-xs">false</code>
            </strong>{' '}
            — the tile can’t be shown. The viewer closes right away.
          </li>
        </ul>
        <p>
          Keep <code className="text-xs">behavior: &apos;instant&apos;</code>. A smooth scroll is still moving when the
          morph starts.
        </p>
      </DocsSection>

      <DocsSection id="load-more" title="Loading more">
        <p>
          Append new ids to <code className="text-xs">itemIds</code>. The track grows and the photo on screen stays
          where it is, even while the viewer is open.
        </p>
        <p>
          To fetch before the user hits the end, watch the index in <code className="text-xs">onValueChange</code>:
        </p>
        <CodeBlock
          code={lightboxExcerpts['virtual-slides-load-more'].code}
          title={lightboxExcerpts['virtual-slides-load-more'].title}
        />
        <p>
          The <DocsLink href="/examples/lightbox/infinite-scroll">Infinite scroll</DocsLink> example puts it all
          together: VirtualSlides, a virtualized grid with <code className="text-xs">reveal</code>, and loading ahead
          from both the grid and the viewer.
        </p>
      </DocsSection>

      <DocsPager prev={lightboxDocsPages.viewTransitions} next={lightboxDocsPages.gestures} />
    </DocsShell>
  );
}
