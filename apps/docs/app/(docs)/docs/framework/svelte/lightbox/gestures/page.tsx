import type { Metadata } from 'next';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Command, Minus, Plus } from 'lucide-react';

import { Kbd, KbdGroup, KbdIcon } from '@/components/ui/kbd';

import { CodeBlock } from '../../../../../../_components/code-block';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { PropSectionTitle } from '../../../../../../_components/prop-section-title';
import { svelteApiHref, svelteBase, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Gestures and pull to dismiss · Svelte',
  description:
    'Swipe navigation and pull to dismiss in the ramka Svelte lightbox: native scroll snapping, pull progress CSS variables, snap-back timing, and open and close fades.',
};

const toc: DocsTocItem[] = [
  { id: 'pull', title: 'Pull-to-dismiss' },
  { id: 'zoom', title: 'Zoom' },
  { id: 'keyboard', title: 'Keyboard & focus' },
  { id: 'matrix', title: 'Interaction matrix' },
];

const tableWrap = 'overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800';
const headRow = 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400';
const th = 'px-3 py-2 font-medium whitespace-nowrap';
const td = 'px-3 py-2 align-top';
const tdLabel = 'px-3 py-2 align-top text-neutral-700 dark:text-neutral-300';

const matrixRows: { state: string; pull: string; zoom: string; nav: string }[] = [
  { state: 'Idle, zoom = 1', pull: 'Allowed', zoom: 'Allowed', nav: 'Allowed' },
  { state: 'Zoomed > 1', pull: 'Blocked', zoom: 'Allowed', nav: 'Arrows pan; buttons still navigate' },
  { state: 'Slides flinging', pull: 'Blocked', zoom: 'Blocked', nav: 'Blocked until settle' },
  { state: 'Pulling', pull: 'Active', zoom: 'Should idle', nav: 'Should idle' },
];

export default function SvelteGesturesPage() {
  return (
    <DocsShell
      title="Gestures"
      description={
        <>
          Pull-to-dismiss, zoom and pan, and keyboard ownership. Part of{' '}
          <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink>. For the usual gallery chrome (pull, zoom,
          keyboard) see the <DocsLink href={`${svelteBase}/presets/default`}>Default preset</DocsLink>.
        </>
      }
      toc={toc}
    >
      <DocsSection
        id="pull"
        title={<PropSectionTitle partHref={svelteApiHref.content} part="Content" prop="pullToClose" sectionId="pull" />}
      >
        <p>
          Content enables pull-to-dismiss by default (<code className="text-xs">pullToClose</code>). Drag down (touch)
          or wheel-dismiss (trackpad) scales the surface and sets <code className="text-xs">data-pulling</code> /{' '}
          <code className="text-xs">data-pull-dismissing</code> plus{' '}
          <code className="text-xs">--lightbox-pull-progress</code> (0→1).
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            The hit target is Stage-wide (or Content when Stage is omitted): letterbox and empty Stage area can start a
            pull, matching the trackpad wheel. Interactive controls (buttons, links, inputs,{' '}
            <code className="text-xs">[data-ramka-no-pull]</code>) keep their press. Side panels outside Stage do not
            start a pull.
          </li>
          <li>
            Disabled while zoomed above 1×, and while Slides is scrolling until{' '}
            <code className="text-xs">scrollend</code> (so a gallery swipe that turns vertical cannot pull mid-gesture).
          </li>
          <li>
            Backdrop is optional. When used, nest it inside <DocsLink href={svelteApiHref.portal}>Portal</DocsLink>{' '}
            beside Content. Pull still works without a Backdrop.
          </li>
        </ul>
        <p>
          Open and close fades are plain CSS on your Backdrop and Content classes, keyed to{' '}
          <code className="text-xs">data-open</code> and <code className="text-xs">@starting-style</code>. Pull then
          modulates the open scrim (media stays opaque) through{' '}
          <code className="text-xs">--lightbox-pull-progress</code>.
        </p>
        <p>
          When a pull is released short of the threshold, the surface springs back and the library publishes{' '}
          <code className="text-xs">--lightbox-pull-snap-duration</code> /{' '}
          <code className="text-xs">--lightbox-pull-snap-easing</code> for the duration of that spring. Reference them
          in your <code className="text-xs">transition</code> (with your open and close values as the fallbacks, as
          below) and anything keyed to <code className="text-xs">--lightbox-pull-progress</code> (backdrop opacity,
          chrome, blur) eases back on the same curve and duration as the item.
        </p>
        <CodeBlock code={svelteExcerpts['open-close'].code} title="Open / close CSS" lang="css" />
        <CodeBlock code={svelteExcerpts['pull-progress'].code} title="Pull progress CSS" lang="css" />
      </DocsSection>

      <DocsSection id="zoom" title="Zoom">
        <p>
          Wrap media in <DocsLink href={svelteApiHref.zoom}>Zoom</DocsLink> (inside Item, typically inside Slide).
          Prefer <DocsLink href={svelteApiHref.media}>Media</DocsLink> inside Zoom so pan and{' '}
          <code className="text-xs">maxZoom</code> use the sized content box. Supports pinch, pan, double-tap,
          ctrl/meta+wheel (or <code className="text-xs">scrollToZoom</code>), and keyboard pan when focused.
        </p>
        <p>
          Zoomed media can cover the full Content surface only if Slide → Item → Zoom → Media fill that box, see{' '}
          <DocsLink href={`${svelteDocsPages.composition.href}#media-layout`}>Composition: Media layout</DocsLink>.
        </p>
        <p>
          <DocsLink href={svelteApiHref.zoomIn}>ZoomIn</DocsLink> /{' '}
          <DocsLink href={svelteApiHref.zoomOut}>ZoomOut</DocsLink> can sit in toolbar chrome outside Zoom: they target
          the <em>active</em> slide through Root’s active-zoom bridge. Content reflects{' '}
          <code className="text-xs">data-zooming</code> / <code className="text-xs">data-zoomed</code> for styling.
        </p>
        <CodeBlock code={svelteExcerpts['zoom-bridge'].code} title="Viewer.svelte" lang="svelte" />
      </DocsSection>

      <DocsSection id="keyboard" title="Keyboard & focus">
        <p>
          <DocsLink href={svelteApiHref.content}>Content</DocsLink> is the keyboard authority while open:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Kbd>Esc</Kbd>: close
          </li>
          <li>
            <KbdGroup>
              <KbdIcon label="Left arrow">
                <ArrowLeft />
              </KbdIcon>
              <KbdIcon label="Right arrow">
                <ArrowRight />
              </KbdIcon>
              <KbdIcon label="Up arrow">
                <ArrowUp />
              </KbdIcon>
              <KbdIcon label="Down arrow">
                <ArrowDown />
              </KbdIcon>
            </KbdGroup>
            : pan when zoomed, otherwise previous and next
          </li>
          <li>
            <KbdIcon label="Plus">
              <Plus />
            </KbdIcon>{' '}
            /{' '}
            <KbdIcon label="Minus">
              <Minus />
            </KbdIcon>{' '}
            / <Kbd>0</Kbd>: zoom in, out, reset (active Zoom)
          </li>
        </ul>
        <p>
          Image zoom uses unmodified keys only:{' '}
          <KbdGroup>
            <KbdIcon label="Command">
              <Command />
            </KbdIcon>
            <KbdIcon label="Plus">
              <Plus />
            </KbdIcon>
          </KbdGroup>{' '}
          /{' '}
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <KbdIcon label="Plus">
              <Plus />
            </KbdIcon>
          </KbdGroup>{' '}
          and the other modified combos are left to the browser, so page zoom (WCAG 1.4.4 text resize) keeps working
          while the dialog is open.
        </p>
        <p>
          Focus is trapped in the dialog; closing restores focus to the opening Trigger. Native page pinch-zoom is
          blocked while Content is mounted so it does not fight <code className="text-xs">Lightbox.Zoom</code>.
        </p>
      </DocsSection>

      <DocsSection id="matrix" title="Interaction matrix">
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>State</th>
                <th className={th}>Pull</th>
                <th className={th}>Zoom chrome / buttons</th>
                <th className={th}>Prev / Next</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={row.state} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className={tdLabel}>{row.state}</td>
                  <td className={td}>{row.pull}</td>
                  <td className={td}>{row.zoom}</td>
                  <td className={td}>{row.nav}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.viewTransitions} next={svelteDocsPages.zoom} />
    </DocsShell>
  );
}
