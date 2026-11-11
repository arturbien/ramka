import type { Metadata } from 'next';
import Link from 'next/link';

import { CodeBlock } from '../../../../../_components/code-block';
import { DocsLink } from '../../../../../_components/docs-link';
import { DocsPager } from '../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../_components/docs-shell';
import { SvelteDemo } from '../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../_content/svelte/docs-pages';
import { svelteExamplesBase } from '../../../../../_content/svelte/examples';
import { svelteExcerpts } from '../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Lightbox overview · Svelte',
  description:
    'Headless lightbox primitives for Svelte built on native scrolling and View Transitions: morphing open, swipe navigation, pinch to zoom, and pull to dismiss. Start here.',
};

const guideLinks: { title: string; description: string; href: string }[] = [
  {
    title: svelteDocsPages.stateLifecycle.title,
    description: 'bind:open, bind:index, show() and close(), open-change callbacks.',
    href: svelteDocsPages.stateLifecycle.href,
  },
  {
    title: svelteDocsPages.composition.title,
    description: 'Slides + Zoom chrome, media sizing, and the Item snippet.',
    href: svelteDocsPages.composition.href,
  },
  {
    title: svelteDocsPages.images.title,
    description: 'Plain img with width and height, srcset, and enhanced:img.',
    href: svelteDocsPages.images.href,
  },
  {
    title: svelteDocsPages.viewTransitions.title,
    description: 'Morph on by default, crossfade, morphTo, and presets.',
    href: svelteDocsPages.viewTransitions.href,
  },
  {
    title: svelteDocsPages.gestures.title,
    description: 'Pull-to-dismiss, zoom, keyboard, and what wins when.',
    href: svelteDocsPages.gestures.href,
  },
  {
    title: svelteDocsPages.rtl.title,
    description: 'Reading direction, what mirrors and what stays physical.',
    href: svelteDocsPages.rtl.href,
  },
  {
    title: svelteDocsPages.api.title,
    description: 'Props, data attributes, and CSS variables for every part.',
    href: svelteDocsPages.api.href,
  },
];

const toc: DocsTocItem[] = [
  { id: 'usage-guidelines', title: 'Usage guidelines' },
  { id: 'anatomy', title: 'Anatomy' },
  { id: 'next-steps', title: 'Next steps' },
];

export default function SvelteLightboxOverviewPage() {
  return (
    <DocsShell
      title="Lightbox"
      description={
        <>
          Accessible primitives for fullscreen media lightboxes: compound Svelte components in the style of Bits UI.
          Cosmetically unstyled: you own colors, chrome, and radius values. ramka owns state, focus, gestures, morphs,
          and the structural styles those mechanics need.
        </>
      }
      toc={toc}
    >
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <SvelteDemo id="docs/HeroDemo" />
      </div>

      <DocsSection id="usage-guidelines" title="Usage guidelines">
        <p>Work through these decisions in order:</p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>State</strong>: uncontrolled, or <code className="text-xs">bind:open</code> and{' '}
            <code className="text-xs">bind:index</code>? See{' '}
            <DocsLink href={svelteDocsPages.stateLifecycle.href}>State &amp; lifecycle</DocsLink>.
          </li>
          <li>
            <strong>Layout</strong>: default to the swipe carousel (
            <DocsLink href={`${svelteDocsPages.composition.href}#slides`}>Slides + Zoom</DocsLink>). See{' '}
            <DocsLink href={svelteDocsPages.composition.href}>Composition</DocsLink>.
          </li>
          <li>
            <strong>Morph</strong>: on by default. Wrap destination media in{' '}
            <code className="text-xs">Lightbox.Media</code>, put an <code className="text-xs">img</code> inside each
            Trigger, choose <code className="text-xs">crossfade</code> and <code className="text-xs">morphTo</code>, or
            pass <code className="text-xs">viewTransition=&#123;false&#125;</code> to opt out. See{' '}
            <DocsLink href={svelteDocsPages.viewTransitions.href}>View transitions</DocsLink>.
          </li>
          <li>
            <strong>Gestures</strong>: pull-to-dismiss on Content, Zoom on media, keyboard on Content. See{' '}
            <DocsLink href={svelteDocsPages.gestures.href}>Gestures</DocsLink>.
          </li>
          <li>
            <strong>Cosmetics vs mechanics</strong>: colors, chrome, and radius <em>values</em> are yours. Structural
            styles (view-transition morph CSS, morph host box, zoom overflow, slide snap alignment) are applied by the
            library or through Media <code className="text-xs">width</code>/<code className="text-xs">height</code>.
            Slide track width (full-bleed or snug cards) is your CSS, see{' '}
            <DocsLink href={`${svelteDocsPages.composition.href}#slides`}>Composition: Slides + Zoom</DocsLink>. Style
            with the documented <code className="text-xs">data-*</code> attributes and CSS variables from the{' '}
            <DocsLink href={svelteDocsPages.api.href}>API reference</DocsLink>.
          </li>
        </ol>
      </DocsSection>

      <DocsSection id="anatomy" title="Anatomy">
        <p>
          Import the namespace and compose parts. The sketch below is the default gallery shape (Slides + Zoom +
          chrome). Every part is optional except Root, which holds the state.
        </p>
        <CodeBlock code={svelteExcerpts.anatomy.code} title="Gallery.svelte" lang="svelte" />
      </DocsSection>

      <DocsSection id="next-steps" title="Next steps">
        <ul className="grid gap-3 sm:grid-cols-2">
          {guideLinks.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="block h-full rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
              >
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{guide.title}</div>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Browse product demos under <DocsLink href={`${svelteExamplesBase}/photos-app`}>Examples</DocsLink>. The guides
          above are canonical for behavior; examples are compositions.
        </p>
      </DocsSection>

      <DocsPager next={svelteDocsPages.stateLifecycle} />
    </DocsShell>
  );
}
