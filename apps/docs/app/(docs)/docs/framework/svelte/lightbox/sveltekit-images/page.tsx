import type { Metadata } from 'next';

import { DocsDemo } from '../../../../../../_components/docs-demo';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteApiHref, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'SvelteKit images · Svelte',
  description:
    'Using blurred LQIP placeholders and SvelteKit image pipelines with the ramka Svelte lightbox: when the trigger image bridge covers loading, and when a placeholder should.',
};

const toc: DocsTocItem[] = [
  { id: 'rule', title: 'When to use a placeholder' },
  { id: 'do', title: 'Do' },
  { id: 'dont', title: 'Don’t' },
  { id: 'no-trigger-image', title: 'No trigger image' },
  { id: 'checklist', title: 'Checklist' },
];

const sourceAspect = `${svelteDocsPages.viewTransitions.href}#source-aspect`;

const tableWrap = 'overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800';
const headRow = 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400';
const th = 'px-3 py-2 font-medium whitespace-nowrap';
const td = 'px-3 py-2 align-top';
const tdLabel = 'px-3 py-2 align-top text-neutral-700 dark:text-neutral-300';
const row = 'border-t border-neutral-200 dark:border-neutral-800';
const h3 = 'text-sm font-semibold text-neutral-900 dark:text-neutral-100';

export default function SvelteKitImagesPage() {
  return (
    <DocsShell
      title="SvelteKit images"
      description={
        <>
          Use blurred placeholders (LQIP) with ramka. Lightbox-side blur depends on whether that item has a trigger
          image. Part of <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink>.
        </>
      }
      toc={toc}
    >
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        The demos on this page delay every full-size lightbox image by about 500ms and bypass the browser cache on each
        open, so you can watch the placeholder mechanisms work on every open, with no DevTools throttling.
      </div>

      <DocsSection id="rule" title="When to use a placeholder">
        <p>
          SvelteKit has no built-in blur placeholder like <code className="text-xs">next/image</code>. The usual setup
          is a tiny image from your pipeline (<code className="text-xs">vite-imagetools</code>,{' '}
          <code className="text-xs">sharp</code> at build time, or your CDN) painted as the{' '}
          <code className="text-xs">background-image</code> of the <code className="text-xs">&lt;img&gt;</code> until
          the real pixels arrive. This page calls that the LQIP. <code className="text-xs">@sveltejs/enhanced-img</code>{' '}
          works too: its output is a plain <code className="text-xs">&lt;img&gt;</code>, so everything below applies.
        </p>
        <p>
          Decide <strong>per item index</strong>, not per gallery. ramka paints an open bridge only when that index has
          a registered trigger image (<code className="text-xs">imageRef</code>).
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>Image</th>
                <th className={th}>LQIP</th>
                <th className={th}>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr className={row}>
                <td className={tdLabel}>
                  Image inside <code className="text-xs">Lightbox.Trigger</code>
                </td>
                <td className={td}>Yes</td>
                <td className={td}>
                  A regular page image: the LQIP covers its own load. ramka never paints a placeholder here.
                </td>
              </tr>
              <tr className={row}>
                <td className={tdLabel}>
                  Image inside <code className="text-xs">Lightbox.Thumbnail</code>
                </td>
                <td className={td}>Yes</td>
                <td className={td}>
                  Same as a trigger: a regular page image. ramka bridges only the destination media, never strip
                  thumbnails, so the LQIP is the only thing covering the thumb’s own load.
                </td>
              </tr>
              <tr className={row}>
                <td className={tdLabel}>
                  Lightbox image, index <em>has</em> a trigger image (<code className="text-xs">imageRef</code>)
                </td>
                <td className={td}>No</td>
                <td className={td}>
                  While the full-size image loads, ramka paints the trigger’s image (already decoded and on screen) onto
                  a canvas <em>behind</em> the lightbox image. An LQIP background sits on the lightbox image itself, in
                  front of that canvas, so it hides a sharp placeholder behind a blurry one.
                </td>
              </tr>
              <tr className={row}>
                <td className={tdLabel}>
                  Lightbox image, index has <em>no</em> trigger image
                </td>
                <td className={td}>Yes</td>
                <td className={td}>
                  ramka has no trigger image to paint, so the LQIP is the only loading placeholder (see{' '}
                  <DocsLink href="#no-trigger-image">No trigger image</DocsLink>).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>One exception:</strong> pages that server-render the lightbox already open (deep links). The bridge is
          painted on gesture opens. A server-rendered open has no gesture, and before hydration nothing is decoded to
          paint from, while an LQIP is part of the server HTML itself. For those visits, destination blur is the only
          placeholder that can exist on first paint: enable it for the deep-link visit and keep destinations clean for
          regular visits (decide once per mount).
        </p>
      </DocsSection>

      <DocsSection id="do" title="Do">
        <p>
          Use the same asset for trigger and destination. Put the LQIP on the trigger; leave the destination clean. A
          square trigger crop is CSS only: keep the source aspect matched to Media. See{' '}
          <DocsLink href={sourceAspect}>View transitions: Source aspect</DocsLink> for a live Do / Don’t.
        </p>
        <DocsDemo code={svelteExcerpts['images-do'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/images/ImageDemo" props={{ kind: 'do' }} />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="dont" title="Don’t">
        <p>
          An LQIP on a lightbox image whose index has a trigger image covers ramka’s bridge with a blur while the full
          image loads.
        </p>
        <DocsDemo code={svelteExcerpts['images-dont'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/images/ImageDemo" props={{ kind: 'dont' }} />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="no-trigger-image" title="No trigger image">
        <p>
          If an index has no trigger <code className="text-xs">imageRef</code>, ramka has nothing to paint. Use a
          destination LQIP for those items only, not for siblings that still have a trigger image.
        </p>
        <h3 className={`mt-8 ${h3}`}>+N extras</h3>
        <p>
          Open the +N tile, then swipe past the triggered photos. Overflow slides show the LQIP; indexes 0 and 1 stay on
          ramka’s trigger-image bridge. Close uses{' '}
          <DocsLink href={`${svelteDocsPages.viewTransitions.href}#morph-to`}>morphTo=&quot;closest&quot;</DocsLink>.
        </p>
        <DocsDemo code={svelteExcerpts['images-plus-n'].code} title="Album.svelte" lang="svelte">
          <SvelteDemo id="docs/images/PlusNDemo" />
        </DocsDemo>
        <h3 className={`mt-10 ${h3}`}>Non-image trigger</h3>
        <p>
          Initials and swatches have a Trigger but no trigger image. Blur on the lightbox image is the loading
          placeholder.
        </p>
        <DocsDemo code={svelteExcerpts['images-non-image'].code} title="Team.svelte" lang="svelte">
          <SvelteDemo id="docs/images/NonImageTriggerDemo" />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="checklist" title="Checklist">
        <ul className="list-disc space-y-2 pl-5">
          <li>Per index: trigger image means no destination LQIP; no trigger image means a destination LQIP is fine</li>
          <li>
            Match Media <code className="text-xs">width</code>/<code className="text-xs">height</code> to the image
            source aspect
          </li>
          <li>
            Trigger and destination must share that intrinsic aspect (CSS-crop the tile; don’t serve a differently
            cropped file). See <DocsLink href={sourceAspect}>Source aspect</DocsLink>
          </li>
          <li>
            Trigger: <code className="text-xs">imageRef</code> (or{' '}
            <DocsLink href={svelteApiHref.context}>getTrigger()</DocsLink>); an LQIP on the trigger image is fine
          </li>
          <li>
            <code className="text-xs">ThumbnailStrip</code> thumbs are regular images: an LQIP is fine, same as triggers
          </li>
          <li>
            Prefer <code className="text-xs">fetchpriority=&quot;high&quot;</code> on the open destination. See{' '}
            <DocsLink href={svelteDocsPages.viewTransitions.href}>View transitions</DocsLink>
          </li>
          <li>
            <code className="text-xs">sizes=&quot;100vw&quot;</code> for fullscreen
          </li>
          <li>
            Skip <code className="text-xs">size-full</code> on the image: Media already fills a direct img child
          </li>
        </ul>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.composition} next={svelteDocsPages.viewTransitions} />
    </DocsShell>
  );
}
