import type { Metadata } from 'next';

import { ApiPartSection } from '../../../../../../_components/api/api-part';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import {
  svelteApiParts,
  svelteContextApi,
  svelteDocumentViewTransitionApi,
  svelteImperativeApi,
} from '../../../../../../_content/svelte/api/parts';
import { svelteApiHref, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';

export const metadata: Metadata = {
  title: 'Lightbox API reference · Svelte',
  description:
    'API reference for the ramka Svelte lightbox parts: Root, Trigger, Slides, Zoom, thumbnails, captions, counter, context getters, types, and imperative handles.',
};

const byConcern: { label: string; links: { href: string; title: string }[] }[] = [
  {
    label: 'State',
    links: [
      { href: svelteApiHref.root, title: 'Root' },
      { href: svelteApiHref.createHandle, title: 'createHandle' },
    ],
  },
  {
    label: 'Trigger / Item',
    links: [
      { href: svelteApiHref.trigger, title: 'Trigger' },
      { href: svelteApiHref.item, title: 'Item' },
      { href: svelteApiHref.media, title: 'Media' },
    ],
  },
  {
    label: 'Layout',
    links: [
      { href: svelteApiHref.slides, title: 'Slides' },
      { href: svelteApiHref.slide, title: 'Slide' },
    ],
  },
  {
    label: 'View transitions',
    links: [
      { href: svelteApiHref.root, title: 'Root (VT props)' },
      { href: svelteApiHref.documentVt, title: 'Document (VT)' },
    ],
  },
  {
    label: 'Shell',
    links: [
      { href: svelteApiHref.portal, title: 'Portal' },
      { href: svelteApiHref.backdrop, title: 'Backdrop' },
      { href: svelteApiHref.content, title: 'Content' },
    ],
  },
  {
    label: 'Gestures',
    links: [
      { href: svelteApiHref.content, title: 'Content' },
      { href: svelteApiHref.zoom, title: 'Zoom' },
      { href: svelteApiHref.zoomIn, title: 'ZoomIn' },
      { href: svelteApiHref.zoomOut, title: 'ZoomOut' },
    ],
  },
  {
    label: 'Chrome',
    links: [
      { href: svelteApiHref.close, title: 'Close' },
      { href: svelteApiHref.previous, title: 'Previous' },
      { href: svelteApiHref.next, title: 'Next' },
      { href: svelteApiHref.counter, title: 'Counter' },
      { href: svelteApiHref.caption, title: 'Caption' },
      { href: svelteApiHref.thumbnailGroup, title: 'ThumbnailGroup' },
      { href: svelteApiHref.thumbnail, title: 'Thumbnail' },
      { href: svelteApiHref.thumbnailStrip, title: 'ThumbnailStrip' },
      { href: svelteApiHref.thumbnailStripTrack, title: 'ThumbnailStripTrack' },
    ],
  },
];

const toc: DocsTocItem[] = [
  { id: 'by-concern', title: 'By concern' },
  ...svelteApiParts.map((part) => ({ id: part.id, title: part.name })),
  { id: svelteDocumentViewTransitionApi.id, title: 'Document (VT)' },
  { id: 'types', title: 'Types' },
  { id: 'context', title: 'Context', children: svelteContextApi.map((part) => ({ id: part.id, title: part.name })) },
  {
    id: 'imperative',
    title: 'Imperative handles',
    children: svelteImperativeApi.map((part) => ({ id: part.id, title: part.name })),
  },
];

export default function SvelteApiPage() {
  return (
    <DocsShell
      title="API reference"
      description={
        <>
          Props, data attributes, and CSS variables for every{' '}
          <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink> part.
        </>
      }
      toc={toc}
    >
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Each part spreads native attributes onto its element (listed as <code className="text-xs">...rest</code>).
        Custom props are listed below. Guides: <DocsLink href={svelteDocsPages.composition.href}>Composition</DocsLink>,{' '}
        <DocsLink href={svelteDocsPages.viewTransitions.href}>View transitions</DocsLink>,{' '}
        <DocsLink href={svelteDocsPages.gestures.href}>Gestures</DocsLink>.
      </p>

      <DocsSection id="by-concern" title="By concern">
        <ul className="space-y-3">
          {byConcern.map((group) => (
            <li key={group.label}>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{group.label}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {group.links.map((link) => (
                  <DocsLink key={link.title} href={link.href}>
                    {link.title}
                  </DocsLink>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </DocsSection>

      {svelteApiParts.map((part) => (
        <ApiPartSection key={part.id} part={part} />
      ))}

      <ApiPartSection part={svelteDocumentViewTransitionApi} />

      <DocsSection id="types" title="Types">
        <p>
          Helper types you will see in callbacks and snippets, exported on the <code className="text-xs">Lightbox</code>{' '}
          namespace (<code className="text-xs">Lightbox.NavigationSource</code> and so on):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">NavigationSource</code>:{' '}
            <code className="text-xs">
              &apos;trigger&apos; | &apos;keyboard&apos; | &apos;thumbnail&apos; | &apos;button&apos; |
              &apos;scroll&apos; | &apos;imperative&apos;
            </code>
            . Second argument to Root <code className="text-xs">onValueChange</code>. Handle{' '}
            <code className="text-xs">open</code>/<code className="text-xs">goTo</code> use{' '}
            <code className="text-xs">&apos;imperative&apos;</code>; scroll-driven Slides use{' '}
            <code className="text-xs">&apos;scroll&apos;</code>.
          </li>
          <li>
            <code className="text-xs">Crossfade</code>:{' '}
            <code className="text-xs">&apos;open&apos; | &apos;close&apos; | &apos;both&apos;</code> for Trigger{' '}
            <code className="text-xs">crossfade</code>. See{' '}
            <DocsLink href={`${svelteDocsPages.viewTransitions.href}#crossfade`}>View transitions: crossfade</DocsLink>.
          </li>
          <li>
            <code className="text-xs">MorphTo</code>:{' '}
            <code className="text-xs">&apos;active&apos; | &apos;origin&apos; | &apos;closest&apos;</code> for Root{' '}
            <code className="text-xs">morphTo</code>, and <code className="text-xs">MorphPreset</code>:{' '}
            <code className="text-xs">
              &apos;default&apos; | &apos;snappy&apos; | &apos;relaxed&apos; | &apos;spring&apos;
            </code>{' '}
            for Root <code className="text-xs">viewTransition</code>.
          </li>
          <li>
            Snippet state types such as <code className="text-xs">TriggerContext</code> and{' '}
            <code className="text-xs">ItemContext</code> (<code className="text-xs">active</code>,{' '}
            <code className="text-xs">visible</code>, refs) are documented on{' '}
            <DocsLink href={svelteApiHref.trigger}>Trigger</DocsLink> /{' '}
            <DocsLink href={svelteApiHref.item}>Item</DocsLink>.
          </li>
        </ul>
      </DocsSection>

      <DocsSection id="context" title="Context">
        <p>
          Context getters for nested wrapper components, the Svelte form of the React hooks. Call them during component
          initialization inside the matching part.
        </p>
      </DocsSection>
      {svelteContextApi.map((part) => (
        <ApiPartSection key={part.id} part={part} />
      ))}

      <DocsSection id="imperative" title="Imperative handles">
        <p>
          Use <code className="text-xs">Lightbox.createHandle()</code> on Root (and optional detached Triggers). Zoom
          exposes its controls through <code className="text-xs">bind:this</code>.
        </p>
      </DocsSection>
      {svelteImperativeApi.map((part) => (
        <ApiPartSection key={part.id} part={part} />
      ))}

      <DocsPager prev={svelteDocsPages.csp} />
    </DocsShell>
  );
}
