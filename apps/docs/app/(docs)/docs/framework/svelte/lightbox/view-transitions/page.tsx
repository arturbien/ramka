import type { Metadata } from 'next';

import { CodeBlock } from '../../../../../../_components/code-block';
import { DocsDemo } from '../../../../../../_components/docs-demo';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { PropSectionTitle } from '../../../../../../_components/prop-section-title';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteApiHref, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Morph view transitions · Svelte',
  description:
    'Shared element View Transitions in a Svelte lightbox: morph attachments, trigger crossfade, source aspect handling, morphTo, scrollTriggerIntoView, and programmatic opens.',
};

const toc: DocsTocItem[] = [
  { id: 'enable', title: 'Morph refs' },
  { id: 'source-aspect', title: 'Source aspect' },
  { id: 'crossfade', title: 'Trigger crossfade' },
  { id: 'morph-to', title: 'Root morphTo' },
  { id: 'scroll-trigger', title: 'scrollTriggerIntoView' },
  { id: 'programmatic', title: 'Programmatic open' },
  { id: 'styling', title: 'Styling' },
  { id: 'timing-presets', title: 'Timing presets' },
  { id: 'injected-css', title: 'Injected CSS' },
];

export default function SvelteViewTransitionsPage() {
  return (
    <DocsShell
      title="View transitions"
      description={
        <>
          Morph open and close between a trigger and the active item with the browser View Transitions API. Part of{' '}
          <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink>. Unsupported browsers, reduced motion, and
          low-end devices fall back to a plain fade.
        </>
      }
      toc={toc}
    >
      <DocsSection id="enable" title="Morph refs">
        <p>
          Morph is on by default (<code className="text-xs">viewTransition</code> on{' '}
          <DocsLink href={svelteApiHref.root}>Root</DocsLink>). Pass{' '}
          <code className="text-xs">viewTransition=&#123;false&#125;</code> to opt out. Recommended destination shape:{' '}
          <DocsLink href={svelteApiHref.media}>Lightbox.Media</DocsLink> around the{' '}
          <code className="text-xs">&lt;img&gt;</code> or <code className="text-xs">&lt;video&gt;</code> (a sized
          fit-box that is both morph target and placeholder host). On{' '}
          <DocsLink href={svelteApiHref.trigger}>Trigger</DocsLink>, the first <code className="text-xs">img</code>{' '}
          inside is the morph source on its own. To be explicit, take the refs from the children snippet; both are
          attachments:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">imageRef</code>: attach to the Trigger thumb{' '}
            <code className="text-xs">&lt;img&gt;</code> whose pixels bridge the morph. Media finds the destination
            image (or video poster) by itself. Open reuses the already-decoded bitmap so the transition doesn’t flash
            empty space.
          </li>
          <li>
            <code className="text-xs">morphRef</code>: optional escape hatch when morph bounds should differ from Media
            or the image (tile with overlay, swatch + label).
          </li>
        </ul>
        <p>
          Nested components can read the same refs from context with{' '}
          <DocsLink href={svelteApiHref.context}>getTrigger() and getItem()</DocsLink> instead of threading the snippet
          argument. Use <code className="text-xs">awaitImageDecode</code> on{' '}
          <DocsLink href={svelteApiHref.root}>Root</DocsLink> when you want a short wait for the destination image
          before the morph starts (default cap about 200ms).
        </p>
        <CodeBlock code={svelteExcerpts['minimal-morph'].code} title="Gallery.svelte" lang="svelte" />
      </DocsSection>

      <DocsSection id="source-aspect" title="Source aspect">
        <p>
          The morph snapshots whatever pixels are on the trigger <code className="text-xs">&lt;img&gt;</code> and
          interpolates them into the destination Media box. That only looks like one photo when both sides share the{' '}
          <em>same intrinsic aspect ratio</em>: the same file, or srcset candidates of that file. A square tile is fine;
          crop it with CSS (<code className="text-xs">object-fit: cover</code>), not by baking{' '}
          <code className="text-xs">w=h&amp;fit=crop</code> into a different image.
        </p>
        <p>
          A CDN-cropped 1∶1 thumb against a 3∶2 lightbox image will reframe mid-animation: ramka paints the square thumb
          into the landscape box, then the full file lands with a different crop. Element boxes may differ. Intrinsic
          aspect must not.
        </p>
        <p>These demos delay the lightbox image by about 500ms so the handoff is visible on every open.</p>
        <DocsDemo code={svelteExcerpts['morph-aspect-do'].code} title="Do.svelte" lang="svelte">
          <SvelteDemo id="docs/vt/AspectDemo" props={{ kind: 'do' }} />
        </DocsDemo>
        <div className="mt-4">
          <DocsDemo code={svelteExcerpts['morph-aspect-dont'].code} title="Dont.svelte" lang="svelte">
            <SvelteDemo id="docs/vt/AspectDemo" props={{ kind: 'dont' }} />
          </DocsDemo>
        </div>
      </DocsSection>

      <DocsSection
        id="crossfade"
        title={
          <PropSectionTitle partHref={svelteApiHref.trigger} part="Trigger" prop="crossfade" sectionId="crossfade" />
        }
      >
        <p>
          Controls whether the morph <em>dissolves</em> between trigger and item snapshots or hard-cuts geometry only.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Omit (default)</strong>: hard-cut. Best when trigger and item show the <em>same</em> picture at the{' '}
            <em>same intrinsic aspect</em> (a CSS <code className="text-xs">object-cover</code> window or a smaller
            srcset is fine; a CDN-baked crop that changes the aspect is not, see{' '}
            <DocsLink href="#source-aspect">Source aspect</DocsLink>). Leaves{' '}
            <code className="text-xs">data-ramka-crossfade</code> unset on <code className="text-xs">&lt;html&gt;</code>{' '}
            during the transition.
          </li>
          <li>
            <code className="text-xs">both</code>: dissolve on open and close (stack → single photo, +N overlay tile).
          </li>
          <li>
            <code className="text-xs">open</code> / <code className="text-xs">close</code>: dissolve in one direction
            only (poster → live video often wants <code className="text-xs">close</code>).
          </li>
        </ul>
        <p>
          Keep trigger and item images on <code className="text-xs">object-fit: cover</code> (or the same fit) so crops
          stay coherent. Put border-radius on the morph target itself: the library interpolates{' '}
          <code className="text-xs">--lightbox-morph-border-radius-from/to</code> on{' '}
          <code className="text-xs">&lt;html&gt;</code>.
        </p>
        <DocsDemo code={svelteExcerpts['crossfade-both'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/vt/CrossfadeDemos" />
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="morph-to"
        title={<PropSectionTitle partHref={svelteApiHref.root} part="Root" prop="morphTo" sectionId="morph-to" />}
      >
        <p>
          Picks which trigger receives the <em>close</em> morph:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">active</code> (default): the trigger for the current active index. No morph if
            that index has no trigger.
          </li>
          <li>
            <code className="text-xs">origin</code>: always the trigger that opened the lightbox (one tile opens many
            items).
          </li>
          <li>
            <code className="text-xs">closest</code>: the active index if registered, otherwise the nearest registered
            trigger.
          </li>
        </ul>
        <DocsDemo code={svelteExcerpts['morph-to-closest'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/vt/MorphToDemos" />
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="scroll-trigger"
        title={
          <PropSectionTitle
            partHref={svelteApiHref.root}
            part="Root"
            prop="scrollTriggerIntoView"
            sectionId="scroll-trigger"
          />
        }
      >
        <p>
          When the page scrolls while the lightbox is open, the close morph can land off-screen. Use{' '}
          <code className="text-xs">scrollTriggerIntoView</code> to keep the target trigger in view:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">onChange</code>: scroll to the active trigger as the index changes (preemptive).
          </li>
          <li>
            <code className="text-xs">onOpenComplete</code>: reposition once open settles (invisible under the overlay;{' '}
            <code className="text-xs">instant</code> recommended).
          </li>
          <li>
            <code className="text-xs">onClose</code>: scroll just before the close morph (visible jump at close start).
          </li>
        </ul>
        <p>
          Pass one option or an array. Each option also accepts <code className="text-xs">block</code> /{' '}
          <code className="text-xs">inline</code> alignment (default <code className="text-xs">nearest</code>): use{' '}
          <code className="text-xs">inline: &apos;center&apos;</code> for horizontal snap strips with variable-width
          tiles. Pair with <code className="text-xs">morphTo</code> so the scrolled element is the same one that
          receives the morph.
        </p>
        <CodeBlock code={svelteExcerpts['view-transitions-scroll-trigger'].code} title="Gallery.svelte" lang="svelte" />
      </DocsSection>

      <DocsSection id="programmatic" title="Programmatic open">
        <p>
          Prefer <DocsLink href={svelteApiHref.root}>createHandle()</DocsLink>:{' '}
          <code className="text-xs">open(index, &#123; triggerId &#125;)</code> associates a Trigger that declared that{' '}
          <code className="text-xs">id</code> so the open morph can use that element. Without a registered trigger (or{' '}
          <code className="text-xs">triggerId</code>), the open falls back to the fade path. Trigger clicks still morph.
          Demo:{' '}
          <DocsLink href={`${svelteDocsPages.stateLifecycle.href}#imperative`}>
            State &amp; lifecycle: Imperative API
          </DocsLink>
          .
        </p>
      </DocsSection>

      <DocsSection id="styling" title="Styling">
        <p>
          You write <strong>zero</strong> view-transition CSS: the library injects the structural{' '}
          <code className="text-xs">::view-transition-*</code> rules itself (see{' '}
          <DocsLink href="#injected-css">Injected CSS</DocsLink>) and writes document hooks during a morph so your own
          skin CSS can react, for example to keep Backdrop and Content fades on the morph’s clock. Attribute and CSS
          variable tables live under <DocsLink href={svelteApiHref.documentVt}>Document (view transitions)</DocsLink>.
          Hooks:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">data-ramka-view-transition</code>: <code className="text-xs">opening</code> |{' '}
            <code className="text-xs">closing</code>
          </li>
          <li>
            <code className="text-xs">data-ramka-crossfade</code>: dissolve path (present when Trigger{' '}
            <code className="text-xs">crossfade</code> is active for this phase; absent for hard-cut)
          </li>
          <li>
            <code className="text-xs">--lightbox-morph-border-radius-from/to</code>,{' '}
            <code className="text-xs">--lightbox-morph-old/new-opacity</code>
          </li>
          <li>
            <code className="text-xs">data-ramka-vt-preset</code>,{' '}
            <code className="text-xs">--lightbox-vt-duration</code>,{' '}
            <code className="text-xs">--lightbox-vt-easing</code>,{' '}
            <code className="text-xs">--lightbox-vt-crossfade-close-easing</code>,{' '}
            <code className="text-xs">--lightbox-vt-root-easing</code>: the active timing preset, written by the library
            (see <DocsLink href="#timing-presets">Timing presets</DocsLink>)
          </li>
          <li>
            <DocsLink href={svelteApiHref.trigger}>Trigger</DocsLink> <code className="text-xs">data-morph-target</code>{' '}
            / <DocsLink href={svelteApiHref.item}>Item</DocsLink> <code className="text-xs">data-skip-fade</code>: hide
            the live morph source and suppress entrance fades on the destination while the transition layer is up
          </li>
        </ul>
        <p>
          Motion splits into <strong>timing</strong> (a preset picked on Root, see below) and <strong>structure</strong>{' '}
          (injected by the library). Your CSS only handles cosmetics, and reads the library-written variables where it
          wants to stay in sync.
        </p>
      </DocsSection>

      <DocsSection id="timing-presets" title="Timing presets">
        <p>
          Morph duration and easing are chosen with the <code className="text-xs">viewTransition</code> prop on{' '}
          <DocsLink href={svelteApiHref.root}>Root</DocsLink>: pass a preset name instead of{' '}
          <code className="text-xs">true</code>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-xs">&quot;default&quot;</code>: 360ms, sheet curve with a tamed launch (what{' '}
            <code className="text-xs">true</code> runs)
          </li>
          <li>
            <code className="text-xs">&quot;snappy&quot;</code>: 340ms, hotter launch; reads quicker
          </li>
          <li>
            <code className="text-xs">&quot;relaxed&quot;</code>: 400ms, softer launch and longer settle
          </li>
          <li>
            <code className="text-xs">&quot;spring&quot;</code>: 450ms, critically damped spring; Photos-style settle
          </li>
        </ul>
        <CodeBlock code={svelteExcerpts['view-transitions-preset'].code} title="Picking a preset" lang="svelte" />
        <p>
          Timing is preset-based rather than free-form CSS on purpose: each preset is vetted on-device to stay smooth
          and skip-safe on iOS Safari (including Low Power Mode) and Android, where arbitrary curves stutter or
          teleport. The library publishes the preset timing as <code className="text-xs">--lightbox-vt-duration</code> /{' '}
          <code className="text-xs">--lightbox-vt-easing</code> /{' '}
          <code className="text-xs">--lightbox-vt-root-easing</code> in two places: always on the{' '}
          <DocsLink href={svelteApiHref.portal}>Portal</DocsLink> host, and, together with{' '}
          <code className="text-xs">data-ramka-vt-preset</code>, on <code className="text-xs">documentElement</code> for
          the duration of a morph. Read those variables in your own CSS as the skin’s single motion clock (for example{' '}
          <code className="text-xs">transition: opacity var(--lightbox-vt-duration, 360ms) ease-out</code> on Backdrop
          and Content): during a morph the fades stay in lockstep with it, and on the non-morph paths (unsupported
          browsers, reduced motion, low-end fallback) they still run on the preset’s timing. Do not set the variables
          yourself.
        </p>
      </DocsSection>

      <DocsSection id="injected-css" title="Injected CSS">
        <p>
          On first <DocsLink href={svelteApiHref.root}>Root</DocsLink> mount the library injects one stylesheet with
          everything a morph structurally needs: no copy-paste block to maintain, and several skins on one page can
          never fight over it.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Name isolation</strong>: <code className="text-xs">startViewTransition</code> snapshots the whole
            document, so any page element with its own <code className="text-xs">view-transition-name</code> would paint{' '}
            <em>over</em> the lightbox. Every name is cleared while{' '}
            <code className="text-xs">data-ramka-view-transition</code> is set; the morph target re-applies its name
            inline with <code className="text-xs">!important</code> and stays the only captured group.
          </li>
          <li>
            <strong>Morph group</strong>: clipping and border-radius interpolation (put radius on the morph target
            element; the library writes <code className="text-xs">--lightbox-morph-border-radius-from/to</code>), timed
            by the active preset.
          </li>
          <li>
            <strong>Snapshots</strong>: hard-cut by default (<code className="text-xs">object-fit: cover</code>, no
            browser dissolve). When Trigger <code className="text-xs">crossfade</code> sets{' '}
            <code className="text-xs">data-ramka-crossfade</code>, the dissolve path (browser fade,{' '}
            <code className="text-xs">plus-lighter</code>, <code className="text-xs">object-fit: fill</code>) runs on
            the same preset clock, on a shorter window so the outgoing snapshot is gone before the size settles.
          </li>
          <li>
            <strong>Root snapshot</strong>: the page-behind crossfade, kept as a <em>single</em> root group (promoting
            Backdrop or Content into named groups tanks Safari). Fade scrim and chrome with live{' '}
            <code className="text-xs">opacity</code> transitions instead.
          </li>
          <li>
            <strong>Morph-target hide</strong>: <code className="text-xs">[data-morph-target]</code> gets{' '}
            <code className="text-xs">opacity: 0</code> with a 200ms fade-back (disabled during the transition so it
            can’t be captured mid-flight), so the live trigger never shows doubled under the morphing snapshot.
          </li>
          <li>
            <strong>Thumb-jump crossfade</strong>: the element-scoped Slides transition started when a ThumbnailStrip
            thumbnail jumps several slides, tunable with{' '}
            <code className="text-xs">--lightbox-select-vt-duration/easing</code> on Slides.
          </li>
        </ul>
        <p>
          Everything except name isolation is gated under{' '}
          <code className="text-xs">prefers-reduced-motion: no-preference</code>. The stylesheet is inserted at the{' '}
          <em>start</em> of <code className="text-xs">&lt;head&gt;</code>, so your own stylesheets cascade after it:
          overriding an injected rule takes an ordinary declaration of equal specificity, no{' '}
          <code className="text-xs">!important</code> needed.
        </p>
        <p>
          Lifecycle timing for your own CSS: Content and Backdrop stay mounted through exit animations; while a morph
          open is preparing they may be <code className="text-xs">visibility: hidden</code> so the morph layer owns the
          pixels. Prefer <code className="text-xs">onOpenChangeComplete</code> for post-motion work, see{' '}
          <DocsLink href={`${svelteDocsPages.stateLifecycle.href}#lifecycle`}>
            State &amp; lifecycle: Lifecycle callbacks
          </DocsLink>
          .
        </p>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.images} next={svelteDocsPages.gestures} />
    </DocsShell>
  );
}
