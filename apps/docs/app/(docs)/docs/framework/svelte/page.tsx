import type { Metadata } from 'next';
import Link from 'next/link';

import { CodeBlock } from '../../../../_components/code-block';
import { docsLinkClassName } from '../../../../_components/docs-link';
import { lightboxDocsPages } from '../../../../_content/lightbox/docs-pages';
import { svelteDocsPages } from '../../../../_content/svelte/docs-pages';
import { svelteExamplesBase } from '../../../../_content/svelte/examples';
import { svelteExcerpts } from '../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Installation · Svelte',
  description:
    'Install the ramka Svelte lightbox with npm, pnpm, or yarn, and open your first morphing image gallery in a few lines of code.',
};

const h2 = 'text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
const body = 'text-[15px] leading-7 text-neutral-600 dark:text-neutral-400';

export default function SvelteInstallationPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14 md:px-10 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-600">
        Getting started
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">ramka</h1>
      <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-7 text-neutral-500 dark:text-neutral-400">
        Unstyled, accessible lightbox primitives for Svelte 5, in the style of Bits UI. Compose your own lightbox UI on
        headless parts with view-transition morph by default, swipe slides, zoom, and pull-to-dismiss.
      </p>

      <section className="mt-14 space-y-4">
        <h2 className={h2}>Installation</h2>
        <CodeBlock code="pnpm add @ramka/svelte" lang="bash" />
        <p className={body}>
          Peer dependency: <code className="text-xs">svelte</code> &gt;= 5.40. Works in SvelteKit and plain Vite apps.
        </p>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className={h2}>Quick start</h2>
        <CodeBlock code={svelteExcerpts['quick-start'].code} title="Gallery.svelte" lang="svelte" />
        <p className={body}>
          The trigger is a plain <code className="text-xs">&lt;button&gt;</code>; its first{' '}
          <code className="text-xs">img</code> is the morph source. Every string in the viewer is yours: the library
          ships none, so nothing it renders is ever in the wrong language.
        </p>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className={h2}>Licensing</h2>
        <p className={body}>
          ramka is free software under the{' '}
          <Link href="/license" className={docsLinkClassName}>
            MIT License
          </Link>
          , for open-source and proprietary use.
        </p>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className={h2}>Coming from React?</h2>
        <p className={body}>
          This is the Svelte 5 port of{' '}
          <Link href="/docs" className={docsLinkClassName}>
            ramka
          </Link>{' '}
          by{' '}
          <a href="https://github.com/arturbien" className={docsLinkClassName} target="_blank" rel="noreferrer">
            Artur Bień
          </a>
          . The parts and their names match{' '}
          <Link href={lightboxDocsPages.api.href} className={docsLinkClassName}>
            @ramka/react
          </Link>{' '}
          one to one. What changes:
        </p>
        <ul className={`list-disc space-y-2 pl-5 ${body}`}>
          <li>
            No <code className="text-xs">render</code> prop. Render props become snippets, and refs such as{' '}
            <code className="text-xs">imageRef</code> and <code className="text-xs">morphRef</code> become attachments (
            <code className="text-xs">&#123;@attach imageRef&#125;</code>).
          </li>
          <li>
            <code className="text-xs">bind:open</code> and <code className="text-xs">bind:index</code> replace{' '}
            <code className="text-xs">open</code>/<code className="text-xs">defaultOpen</code> and{' '}
            <code className="text-xs">value</code>/<code className="text-xs">defaultValue</code>.
          </li>
          <li>
            Counter’s snippet gets <code className="text-xs">&#123; current, total &#125;</code>. The caption type is
            exported as <code className="text-xs">CaptionContent</code>.
          </li>
          <li>
            Zoom takes <code className="text-xs">minZoom</code>, <code className="text-xs">maxZoom</code>,{' '}
            <code className="text-xs">zoomStep</code>, <code className="text-xs">scrollToZoom</code>,{' '}
            <code className="text-xs">wheelSensitivity</code>, <code className="text-xs">keyboardPanDistance</code>,{' '}
            <code className="text-xs">doubleClickDelay</code> and <code className="text-xs">onZoomChange</code>;{' '}
            <code className="text-xs">bind:this</code> exposes <code className="text-xs">zoomIn</code>,{' '}
            <code className="text-xs">zoomOut</code>, <code className="text-xs">zoomTo</code> and{' '}
            <code className="text-xs">reset</code>.
          </li>
          <li>ThumbnailStrip needs a ThumbnailStripTrack child around the thumbnails.</li>
          <li>
            React hooks become context getters: <code className="text-xs">getLightbox</code>,{' '}
            <code className="text-xs">getTrigger</code>, <code className="text-xs">getItem</code>,{' '}
            <code className="text-xs">getStage</code>.
          </li>
          <li>The morph and pull engines ship in one bundle instead of loading lazily.</li>
        </ul>
      </section>

      <section className="mt-14 rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Next steps</h2>
        <ul className={`mt-3 space-y-2.5 ${body}`}>
          <li>
            <Link href={svelteDocsPages.overview.href} className={docsLinkClassName}>
              Lightbox overview
            </Link>
            : guidelines and anatomy, then{' '}
            <Link href={svelteDocsPages.composition.href} className={docsLinkClassName}>
              Composition
            </Link>
            .
          </li>
          <li>
            <Link href={`${svelteExamplesBase}/photos-app`} className={docsLinkClassName}>
              Examples
            </Link>
            : live product demos and API pattern pages.
          </li>
        </ul>
      </section>
    </div>
  );
}
