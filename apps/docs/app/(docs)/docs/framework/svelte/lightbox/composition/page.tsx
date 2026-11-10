import type { Metadata } from 'next';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Kbd, KbdGroup, KbdIcon } from '@/components/ui/kbd';

import { CodeBlock } from '../../../../../../_components/code-block';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { svelteApiHref, svelteBase, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExamplesBase } from '../../../../../../_content/svelte/examples';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Composition · Svelte',
  description:
    'Compose ramka lightbox primitives into any Svelte layout: Slides with Zoom, media fill and fit-box sizing, Stage for split layouts, custom chrome, and dynamic item counts.',
};

const toc: DocsTocItem[] = [
  { id: 'slides', title: 'Slides + Zoom' },
  { id: 'media-layout', title: 'Media layout' },
  { id: 'stage', title: 'Stage (split layouts)' },
  { id: 'chrome', title: 'Chrome' },
  { id: 'item-count', title: 'Dynamic item count' },
];

export default function SvelteCompositionPage() {
  return (
    <DocsShell
      title="Composition"
      description={
        <>
          Default to Slides + Zoom (swipe carousel with pinch zoom), size media to fill Content, then layer chrome. Part
          of <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink>.
        </>
      }
      toc={toc}
    >
      <DocsSection id="slides" title="Slides + Zoom">
        <p>
          Prefer <DocsLink href={svelteApiHref.slides}>Slides</DocsLink> +{' '}
          <DocsLink href={svelteApiHref.slide}>Slide</DocsLink> for a swipeable snap carousel wired to the active index.
          Nearly every docs demo and example uses this layout. Slide boxes stay mounted;{' '}
          <code className="text-xs">preload</code> gates heavy Item content.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Nesting rule: put <code className="text-xs">Item</code> and{' '}
            <DocsLink href={svelteApiHref.zoom}>Zoom</DocsLink> <em>inside</em> each{' '}
            <code className="text-xs">Slide</code>. Pull transforms the item, not the snap box.
          </li>
          <li>
            User flings set an internal scroll lock so pull-to-dismiss, zoom chrome, and discrete prev/next do not fight
            the carousel mid-gesture.
          </li>
          <li>
            Scroll-driven index changes report <code className="text-xs">onValueChange</code> with{' '}
            <code className="text-xs">source: &apos;scroll&apos;</code>, see{' '}
            <DocsLink href={svelteApiHref.types}>NavigationSource</DocsLink>.
          </li>
          <li>
            The Item snippet’s <code className="text-xs">active</code> is the current index (drive expensive work here).{' '}
            <code className="text-xs">visible</code> means the item is in the preload window: use it for lightweight
            prefetch, not video autoplay.
          </li>
        </ul>
        <CodeBlock code={svelteExcerpts['slides-nesting'].code} title="Gallery.svelte" lang="svelte" />
        <CodeBlock code={svelteExcerpts['slide-track'].code} title="Slide track (full-bleed carousel)" lang="css" />
      </DocsSection>

      <DocsSection id="media-layout" title="Media layout">
        <p>
          ramka is <em>cosmetically</em> unstyled (colors and chrome are yours), but Media may apply <em>structural</em>{' '}
          fit-box styles through <code className="text-xs">width</code>/<code className="text-xs">height</code> so the
          morph target has a correct aspect before pixels load. Slide width is your CSS too:{' '}
          <DocsLink href={svelteApiHref.slide}>Slide</DocsLink> only bakes in snap alignment (
          <code className="text-xs">scroll-snap-align: center</code>,{' '}
          <code className="text-xs">scroll-snap-stop: always</code>); you size each snap box. For a full-bleed carousel,
          use <code className="text-xs">flex: 0 0 100%</code> and <code className="text-xs">min-width: 100%</code> on
          each slide (see the snippet above). Snug, variable-width tracks use a different width formula, see the{' '}
          <DocsLink href={`${svelteBase}/presets/default`}>Default preset</DocsLink>. Item and Zoom fill the slide
          content box; size the stack so when Zoom scales past 1× the image can cover the viewport and is not clipped by
          a shorter ancestor.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">Content</code>: fullscreen surface (<code className="text-xs">fixed inset-0</code>{' '}
            or a full dialog)
          </li>
          <li>
            <code className="text-xs">Slides</code>: <code className="text-xs">flex-1</code> (or an equivalent stretch)
          </li>
          <li>
            <code className="text-xs">Slide</code>: <code className="text-xs">flex: 0 0 100%; min-width: 100%</code> for
            a full-bleed track; <code className="text-xs">h-full</code> for height; put chrome and safe-area insets here
            as padding (not on Zoom)
          </li>
          <li>
            <code className="text-xs">Item</code>: already fills the Slide (
            <code className="text-xs">width/height: 100%</code>)
          </li>
          <li>
            <code className="text-xs">Zoom</code>: already fills and centers (structural)
          </li>
          <li>
            <code className="text-xs">Media</code>: sized fit-box (morph and placeholder host);{' '}
            <code className="text-xs">&lt;img&gt;</code> or <code className="text-xs">&lt;video&gt;</code> inside
          </li>
        </ul>
        <p>
          Keep Close, Counter, Caption, and thumbnails as <em>absolutely positioned siblings</em> of Slides (see Chrome
          below), not in-flow above or below Zoom. Resting insets belong on Slide padding and safe-area so zoomed media
          can still paint into that padding under chrome. Gesture details live in{' '}
          <DocsLink href={svelteDocsPages.gestures.href}>Gestures</DocsLink>.
        </p>
        <p>
          Set HTML <code className="text-xs">width</code> and <code className="text-xs">height</code> on the destination{' '}
          <code className="text-xs">&lt;img&gt;</code> (from known pixel dimensions or CMS metadata) so the box and
          aspect ratio exist <em>before</em> pixels load. That avoids layout shift, keeps the morph target sized on slow
          networks, and prevents an unloaded image from collapsing to 0×0 (which can skip or weaken the open morph).
          When dimensions are unknown, see{' '}
          <DocsLink href={`${svelteExamplesBase}/url-synced-state`}>URL-synced state</DocsLink>. For mixed media (photos
          plus WebGL) with <DocsLink href={svelteApiHref.root}>onBeforeOpen</DocsLink> preheat, see{' '}
          <DocsLink href={`${svelteExamplesBase}/3d-models`}>3D models</DocsLink>.
        </p>
        <p>
          To fill the maximum available space without distorting the source aspect ratio, nest Media under{' '}
          <DocsLink href={svelteApiHref.zoom}>Lightbox.Zoom</DocsLink> (a size container for{' '}
          <code className="text-xs">cqw</code>/<code className="text-xs">cqh</code>) and pass{' '}
          <code className="text-xs">width</code>/<code className="text-xs">height</code> to{' '}
          <DocsLink href={svelteApiHref.media}>Lightbox.Media</DocsLink>. Media applies the inscribed fit-box (
          <code className="text-xs">min(100cqw, 100cqh × w/h)</code> +{' '}
          <code className="text-xs">aspect-ratio: w / h</code>). Or put HTML <code className="text-xs">width</code>/
          <code className="text-xs">height</code> on the child image and omit the Media props: Media derives the box.
          When the box matches the source aspect, child <code className="text-xs">object-fit</code> is a no-op and
          Media’s grid stretch fills the box. Put border-radius on Media (the morph target). Leave chrome outside Media.
        </p>
        <CodeBlock code={svelteExcerpts['media-fit-box'].code} title="Viewer.svelte" lang="svelte" />
        <p>
          Live compositions: <DocsLink href={`${svelteBase}/presets/default`}>Default preset</DocsLink>,{' '}
          <DocsLink href={`${svelteBase}/presets/twitter`}>Twitter preset</DocsLink>,{' '}
          <DocsLink href={`${svelteBase}/presets/stories`}>Stories preset</DocsLink>,{' '}
          <DocsLink href={`${svelteExamplesBase}/photos-app`}>Photos app</DocsLink>.
        </p>
      </DocsSection>

      <DocsSection id="stage" title="Stage (split layouts)">
        <p>
          Use <DocsLink href={svelteApiHref.stage}>Lightbox.Stage</DocsLink> when Content holds more than the media
          pane, for example a thread sidebar beside the gallery. Stage is the media interaction surface: trackpad wheel
          pull-to-dismiss, Zoom pan cover geometry, and{' '}
          <KbdGroup>
            <KbdIcon label="Left arrow">
              <ArrowLeft />
            </KbdIcon>
            <KbdIcon label="Right arrow">
              <ArrowRight />
            </KbdIcon>
          </KbdGroup>{' '}
          / <Kbd>Home</Kbd> / <Kbd>End</Kbd> gallery navigation are scoped to it. Content remains the dialog shell
          (focus trap, <Kbd>Esc</Kbd>, zoom shortcuts). Place side panels as siblings of Stage under Content so they
          keep native scroll and their own keyboard behavior. Without a Stage, Content itself is the stage (default
          full-bleed viewers need no change).
        </p>
        <CodeBlock code={svelteExcerpts['composition-stage'].code} title="Stage + side panel" lang="svelte" />
        <p>
          Attach Stage’s <code className="text-xs">morphRef</code> when the open and close morph should capture the
          Stage surface (or a descendant) instead of the active item: a 9:16 stories frame, the slides track, or a
          custom bezel. Decode and the thumbnail placeholder stay on the item. In Svelte,{' '}
          <code className="text-xs">morphRef</code> is an attachment:{' '}
          <code className="text-xs">&#123;@attach morphRef&#125;</code>.
        </p>
        <CodeBlock code={svelteExcerpts['composition-stage-morph'].code} title="Stage morphRef" lang="svelte" />
        <p>
          Live examples: <DocsLink href={`${svelteBase}/presets/twitter`}>Twitter preset</DocsLink>,{' '}
          <DocsLink href={`${svelteBase}/presets/stories`}>Stories preset</DocsLink>.
        </p>
      </DocsSection>

      <DocsSection id="chrome" title="Chrome">
        <p>
          The site default viewer is Slides + Zoom with Counter, Close, ZoomIn and ZoomOut, Caption, and a desktop{' '}
          <DocsLink href={svelteApiHref.thumbnailStrip}>ThumbnailStrip</DocsLink> (scroll-linked midline track) as
          siblings inside <DocsLink href={svelteApiHref.content}>Content</DocsLink>. Midline selection chrome goes in
          the strip’s <code className="text-xs">indicator</code> snippet. Thumbnails register by{' '}
          <code className="text-xs">index</code> like Triggers. Put Backdrop and Content in{' '}
          <DocsLink href={svelteApiHref.portal}>Portal</DocsLink>. Stacking follows the usual dialog pattern:{' '}
          <code className="text-xs">isolation: isolate</code> on the app layout root and, with{' '}
          <code className="text-xs">keepMounted</code>, your own <code className="text-xs">z-index</code> on the Portal
          host (for example <code className="text-xs">class=&quot;relative z-[1]&quot;</code>). Inside the portal,
          document order keeps Backdrop under Content.
        </p>
        <p>
          Thumbnails go inside a <DocsLink href={svelteApiHref.thumbnailStripTrack}>ThumbnailStripTrack</DocsLink>, the{' '}
          <code className="text-xs">role=&quot;tablist&quot;</code> that the strip moves. Label the track, not the
          strip.
        </p>
        <CodeBlock code={svelteExcerpts['chrome-composition'].code} title="Gallery.svelte" lang="svelte" />
        <p>
          Packaged as a skin: <DocsLink href={`${svelteBase}/presets/default`}>Default preset</DocsLink>.
        </p>
      </DocsSection>

      <DocsSection id="item-count" title="Dynamic item count">
        <p>
          Items register on mount, and the item count comes from the registered items. Indices do not need to be
          contiguous, but Counter, loop edges, and preload distance all use that count. Prefer dense{' '}
          <code className="text-xs">0…n-1</code> indexes unless you leave holes on purpose. Before the viewer has
          mounted (for a counter outside it, say), Root’s <code className="text-xs">count</code> prop stands in.
        </p>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.stateLifecycle} next={svelteDocsPages.images} />
    </DocsShell>
  );
}
