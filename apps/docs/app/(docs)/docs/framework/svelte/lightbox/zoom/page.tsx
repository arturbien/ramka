import type { Metadata } from 'next';

import { Command } from 'lucide-react';

import { Kbd, KbdIcon } from '@/components/ui/kbd';

import { CodeBlock } from '../../../../../../_components/code-block';
import { DocsLink, docsLinkClassName } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { svelteApiHref, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'Zoom & a11y · Svelte',
  description:
    'How zoom and pan in the ramka Svelte lightbox line up with mainstream desktop and touch image viewers, and how they map to WCAG 2.2.',
};

const toc: DocsTocItem[] = [
  { id: 'desktop-conventions', title: 'Desktop conventions' },
  { id: 'desktop-ramka', title: 'ramka on desktop' },
  { id: 'mobile-conventions', title: 'Mobile conventions' },
  { id: 'mobile-ramka', title: 'ramka on mobile' },
  { id: 'heuristics', title: 'UX heuristics' },
  { id: 'wcag', title: 'WCAG conformance' },
];

const keyboard = 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html';

const tableWrap = 'overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800';
const headRow = 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400';
const th = 'px-3 py-2 font-medium whitespace-nowrap';
const td = 'px-3 py-2 align-top';
const tdLabel = 'px-3 py-2 align-top text-neutral-700 dark:text-neutral-300';
const rowClass = 'border-t border-neutral-200 dark:border-neutral-800';

const desktopApps = [
  {
    app: 'macOS Preview',
    bareScroll: 'Pan / scroll',
    modifier: 'Zoom (pinch)',
    doubleClick: 'Smart-zoom toggle',
    drag: 'Pan',
  },
  {
    app: 'Apple Photos (Mac)',
    bareScroll: 'n/a',
    modifier: 'Zoom (pinch)',
    doubleClick: 'Toggle 1×↔zoom',
    drag: 'Pan',
  },
  {
    app: 'Windows Photos',
    bareScroll: 'Navigate',
    modifier: 'Zoom (Ctrl+wheel)',
    doubleClick: 'Toggle',
    drag: 'Pan',
  },
  {
    app: 'Google Photos (web)',
    bareScroll: 'Zoom to cursor',
    modifier: 'Zoom',
    doubleClick: 'Toggle',
    drag: 'Pan',
  },
  {
    app: 'Google Maps',
    bareScroll: 'Zoom to cursor',
    modifier: 'Zoom',
    doubleClick: 'Zoom-in step',
    drag: 'Pan',
  },
  {
    app: 'PhotoSwipe v5',
    bareScroll: 'Opt-in (wheelToZoom)',
    modifier: 'Zoom (pinch)',
    doubleClick: 'Toggle',
    drag: 'Pan',
  },
  {
    app: 'OpenSeadragon',
    bareScroll: 'Zoom to cursor',
    modifier: 'Zoom',
    doubleClick: 'Zoom-in step',
    drag: 'Pan',
  },
  {
    app: 'Lightroom',
    bareScroll: 'Zoom',
    modifier: 'Zoom',
    doubleClick: 'Toggle 1:1',
    drag: 'Pan',
  },
  {
    app: 'Figma / Miro (canvas)',
    bareScroll: 'Pan',
    modifier: 'Zoom to cursor',
    doubleClick: 'n/a',
    drag: 'Pan (space)',
  },
];

const desktopRamka = [
  {
    interaction: 'Trackpad pinch',
    ramka:
      'Zooms to cursor through ctrlKey+wheel; hard-clamped at min/max. Safari GestureEvent is only blocked from page zoom, not read',
    consensus: 'Zoom to cursor',
    verdict: 'Match, without rubber-band (port gap)',
  },
  {
    interaction: 'Ctrl / ⌘ + wheel',
    ramka: 'Zooms, focal at cursor; hard-clamped at min/max',
    consensus: 'Zoom to cursor',
    verdict: 'Match',
  },
  {
    interaction: 'Bare scroll wheel',
    ramka: 'Off by default (scrollToZoom=false): no-op inside Zoom',
    consensus: 'Split: media viewers zoom, canvas apps pan',
    verdict: 'Defensible default; opt-in covers the other',
  },
  {
    interaction: 'Double-click',
    ramka: 'Toggles zoom, focal at cursor',
    consensus: 'Toggle, focal',
    verdict: 'Match',
  },
  {
    interaction: 'Drag to pan',
    ramka: 'Yes: grab / grabbing cursor, elastic plus momentum',
    consensus: 'Universal',
    verdict: 'Match',
  },
  {
    interaction: 'Wheel to pan (zoomed)',
    ramka: 'Not yet: a bare wheel does not pan',
    consensus: 'Common',
    verdict: 'Port gap',
  },
  {
    interaction: 'Zoom buttons',
    ramka: 'ZoomIn / ZoomOut, zoomStep ×2',
    consensus: 'Common',
    verdict: 'Zooms about center, not cursor',
  },
  {
    interaction: 'Keyboard zoom',
    ramka: '+ = − _ and 0 to reset (⌘/Ctrl combos stay browser page zoom)',
    consensus: 'Expected',
    verdict: 'Match',
  },
  {
    interaction: 'Keyboard pan',
    ramka: 'Arrows pan (keyboardPanDistance, 50px) when zoomed',
    consensus: 'Expected',
    verdict: 'Match',
  },
  {
    interaction: 'Max zoom',
    ramka: "Auto-capped to the image's native resolution (fallback 4×)",
    consensus: 'Best practice (avoids blur)',
    verdict: 'Better than many',
  },
  {
    interaction: 'Cursor at 1×',
    ramka: 'No zoom-in affordance (consumer CSS)',
    consensus: 'Some apps show a zoom-in cursor',
    verdict: 'Minor discoverability gap',
  },
];

const mobileApps = [
  {
    app: 'iOS Photos',
    pinch: 'Focal, rubber-band',
    doubleTap: 'Toggle at tap',
    pan: '1-finger drag',
    momentum: 'Yes + overscroll',
    swipeDown: 'Dismiss',
  },
  {
    app: 'Android Google Photos',
    pinch: 'Focal, rubber-band',
    doubleTap: 'Toggle at tap',
    pan: '1-finger drag',
    momentum: 'Yes',
    swipeDown: 'Dismiss',
  },
  {
    app: 'Instagram',
    pinch: 'Focal (peek), snaps back',
    doubleTap: 'Like (not zoom)',
    pan: 'While pinched',
    momentum: 'No',
    swipeDown: 'Dismiss',
  },
  {
    app: 'Mobile Safari (page)',
    pinch: 'Focal',
    doubleTap: 'Toggle (smart)',
    pan: '1-finger drag',
    momentum: 'Yes',
    swipeDown: 'n/a',
  },
  {
    app: 'PhotoSwipe (mobile)',
    pinch: 'Focal, rubber-band',
    doubleTap: 'Toggle at tap',
    pan: '1-finger drag',
    momentum: 'Yes',
    swipeDown: 'Dismiss',
  },
  {
    app: 'Telegram / WhatsApp',
    pinch: 'Focal',
    doubleTap: 'Toggle at tap',
    pan: '1-finger drag',
    momentum: 'Yes',
    swipeDown: 'Dismiss',
  },
];

const mobileRamka = [
  {
    interaction: 'Pinch to zoom',
    ramka:
      'Focal at pinch midpoint; image follows the centroid (pinch and pan together); elastic past bounds, snaps back with a haptic tick',
    consensus: 'Focal + rubber-band',
    verdict: 'Match',
  },
  {
    interaction: 'Double-tap',
    ramka: 'Toggles zoom, focal at tap; commit waits for pointerup so a flick never misfires',
    consensus: 'Toggle at tap',
    verdict: 'Match',
  },
  {
    interaction: '1-finger pan (zoomed)',
    ramka: 'Elastic drag; velocity tracked',
    consensus: 'Universal',
    verdict: 'Match',
  },
  {
    interaction: '2-finger pan (zoomed)',
    ramka: 'Centroid pans and scale follows finger distance from the first move (no recognizer slop)',
    consensus: 'iOS Photos / pinch-pan',
    verdict: 'Close; small jitter can nudge zoom',
  },
  {
    interaction: 'Release with velocity',
    ramka: 'Momentum pan (decelerates, clamps to bounds)',
    consensus: 'iOS/Android inertia',
    verdict: 'Match',
  },
  {
    interaction: 'Swipe left / right',
    ramka: 'Navigates via Slides snap carousel (only at 1×)',
    consensus: 'Navigate photos',
    verdict: 'Match',
  },
  {
    interaction: 'Swipe down',
    ramka: 'Pull-to-dismiss; blocked while zoomed > 1×',
    consensus: 'Dismiss',
    verdict: 'Match',
  },
  {
    interaction: 'touch-action',
    ramka: 'none when zoomed; pan-x at 1× (lets Slides and the page own the swipe)',
    consensus: 'Guard native gestures',
    verdict: 'Correct',
  },
  {
    interaction: 'Native page pinch-zoom',
    ramka: 'Suppressed while Content is open so it never fights Lightbox.Zoom',
    consensus: 'Prevent conflict',
    verdict: 'Match',
  },
  {
    interaction: 'Haptics',
    ramka: 'Light tick on snap-back (navigator.vibrate, Android only)',
    consensus: 'iOS rubber-band feel',
    verdict: 'Better than many',
  },
];

const wcag = [
  {
    sc: '2.5.1 Pointer Gestures',
    href: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html',
    level: 'A',
    applies: 'Pinch (touch and trackpad) is a multipoint gesture and needs a single-pointer alternative.',
    verdict: 'Pass.',
    status: 'Double-tap / double-click and the ZoomIn / ZoomOut buttons are all single-pointer.',
  },
  {
    sc: '2.5.7 Dragging Movements',
    href: 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html',
    level: 'AA',
    applies: 'Pan is drag-based and ramka implements its own pan, so the author-content clause applies.',
    verdict: 'Partial.',
    status:
      'Keyboard arrows pan, but a strict single-pointer, non-drag pan alternative (such as pan controls) is not built in. See the note below.',
  },
  {
    sc: '2.1.1 Keyboard',
    href: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
    level: 'A',
    applies: 'All zoom and pan must be reachable by keyboard.',
    verdict: 'Pass.',
    status: '+/−/0 and arrows route through the active-zoom bridge in Content.',
  },
  {
    sc: '2.5.8 Target Size (Minimum)',
    href: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
    level: 'AA',
    applies: 'Zoom and close controls should be at least 24×24 CSS px (44 px is the touch norm).',
    verdict: 'Consumer.',
    status: 'Sizing is your CSS in a headless library: a guidance item, not a library defect.',
  },
];

export default function SvelteZoomPage() {
  return (
    <DocsShell
      title="Zoom & a11y"
      description={
        <>
          How ramka’s zoom and pan, on desktop and on touch, line up with mainstream image viewers, and how they map to
          WCAG 2.2. For the wiring and gesture ownership, see{' '}
          <DocsLink href={svelteDocsPages.gestures.href}>Gestures</DocsLink>.
        </>
      }
      toc={toc}
    >
      <DocsSection id="desktop-conventions" title="Desktop conventions">
        <p>
          Desktop image viewers split into two families, depending on whether the surface is treated as a{' '}
          <em>media viewer</em> or a <em>canvas / document</em>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Media-viewer model</strong> (Google Photos, Lightroom, PhotoSwipe, OpenSeadragon): a bare scroll
            wheel zooms toward the cursor; drag pans.
          </li>
          <li>
            <strong>Canvas / document model</strong> (Figma, macOS Preview, Google Maps on trackpad): a bare scroll
            pans, and zoom is gated behind a modifier (<Kbd>Ctrl</Kbd>/
            <KbdIcon label="Command">
              <Command />
            </KbdIcon>
            ) or a trackpad pinch, so it never hijacks the user’s scroll.
          </li>
        </ul>
        <p>
          Regardless of family, four things are near-universal: <strong>drag pans</strong> when zoomed,{' '}
          <strong>wheel/pinch zoom is focal</strong> (zooms toward the pointer), <strong>double-click toggles</strong>{' '}
          zoom, and{' '}
          <strong>
            <Kbd>Ctrl</Kbd>/
            <KbdIcon label="Command">
              <Command />
            </KbdIcon>
            +wheel and trackpad pinch always zoom
          </strong>
          . The only real disagreement is whether a <em>bare</em> wheel zooms or pans.
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>App</th>
                <th className={th}>Bare scroll</th>
                <th className={th}>
                  <Kbd>Ctrl</Kbd>/
                  <KbdIcon label="Command">
                    <Command />
                  </KbdIcon>
                  +wheel · pinch
                </th>
                <th className={th}>Double-click</th>
                <th className={th}>Drag</th>
              </tr>
            </thead>
            <tbody>
              {desktopApps.map((row) => (
                <tr key={row.app} className={rowClass}>
                  <td className={tdLabel}>{row.app}</td>
                  <td className={td}>{row.bareScroll}</td>
                  <td className={td}>{row.modifier}</td>
                  <td className={td}>{row.doubleClick}</td>
                  <td className={td}>{row.drag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="desktop-ramka" title="ramka on desktop">
        <p>
          ramka defaults to the canvas model: <Kbd>Ctrl</Kbd>/
          <KbdIcon label="Command">
            <Command />
          </KbdIcon>
          +wheel and trackpad pinch zoom to the cursor, a bare wheel is a no-op, and{' '}
          <code className="text-xs">scrollToZoom</code> on <DocsLink href={svelteApiHref.zoom}>Zoom</DocsLink> opts into
          the media-viewer behavior. That is the more embed-friendly default: a lightbox often lives inside a scrollable
          page, so bare-wheel zoom risks trapping the user’s scroll.
        </p>
        <p>
          The Svelte port differs from <code className="text-xs">@ramka/react</code> in two rows below: the bare wheel
          does not pan a zoomed image yet, and trackpad pinch is clamped at the zoom limits instead of rubber-banding
          past them.
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>Interaction</th>
                <th className={th}>ramka</th>
                <th className={th}>Consensus</th>
                <th className={th}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {desktopRamka.map((row) => (
                <tr key={row.interaction} className={rowClass}>
                  <td className={tdLabel}>{row.interaction}</td>
                  <td className={td}>{row.ramka}</td>
                  <td className={td}>{row.consensus}</td>
                  <td className={td}>{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The one intentional inconsistency: <DocsLink href={svelteApiHref.zoomIn}>ZoomIn</DocsLink> /{' '}
          <DocsLink href={svelteApiHref.zoomOut}>ZoomOut</DocsLink> zoom about the center rather than the cursor. That
          is standard (buttons have no pointer position) and matches Google Maps / OpenSeadragon button behavior.
        </p>
      </DocsSection>

      <DocsSection id="mobile-conventions" title="Mobile conventions">
        <p>
          Touch is far more uniform than desktop. Every mainstream photo viewer converges on the same model, set by iOS
          Photos and Android’s Google Photos:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Pinch to zoom</strong>, focal at the pinch midpoint. The image stays glued to the centroid, so
            spreading and sliding two fingers zoom and pan as one gesture, with a <em>rubber-band</em> overshoot past
            the min/max that snaps back on release.
          </li>
          <li>
            <strong>Double-tap</strong> toggles between fit and a zoomed level, centered on the tap point.
          </li>
          <li>
            <strong>One- or two-finger drag pans</strong> while zoomed, with <strong>inertia / momentum</strong> on
            release.
          </li>
          <li>
            At fit, a <strong>horizontal swipe navigates</strong> and a <strong>downward swipe dismisses</strong> the
            viewer.
          </li>
        </ul>
        <p>
          The subtle but critical part is arbitration: pinch, pan, swipe-to-navigate, and swipe-to-dismiss all start
          from the same finger, so a viewer has to decide which gesture owns a given touch without misfiring.
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>App</th>
                <th className={th}>Pinch</th>
                <th className={th}>Double-tap</th>
                <th className={th}>Pan</th>
                <th className={th}>Momentum</th>
                <th className={th}>Swipe down</th>
              </tr>
            </thead>
            <tbody>
              {mobileApps.map((row) => (
                <tr key={row.app} className={rowClass}>
                  <td className={tdLabel}>{row.app}</td>
                  <td className={td}>{row.pinch}</td>
                  <td className={td}>{row.doubleTap}</td>
                  <td className={td}>{row.pan}</td>
                  <td className={td}>{row.momentum}</td>
                  <td className={td}>{row.swipeDown}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="mobile-ramka" title="ramka on mobile">
        <p>
          ramka implements the iOS/Android touch model, including the arbitration details that make it feel native: a
          double-tap that commits on pointerup (so a flick that starts near the last tap never zooms by mistake),
          elastic overscroll on both pinch and pan, momentum with bound-clamping, and a haptic tick on snap-back.
          Pull-to-dismiss and zoom/pan share a{' '}
          <DocsLink href={`${svelteDocsPages.gestures.href}#matrix`}>navigation lock</DocsLink> so an in-flight Slides
          fling can’t be hijacked mid-scroll.
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>Interaction</th>
                <th className={th}>ramka</th>
                <th className={th}>Consensus</th>
                <th className={th}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {mobileRamka.map((row) => (
                <tr key={row.interaction} className={rowClass}>
                  <td className={tdLabel}>{row.interaction}</td>
                  <td className={td}>{row.ramka}</td>
                  <td className={td}>{row.consensus}</td>
                  <td className={td}>{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The touch model is where ramka is strongest. It matches the platform viewers almost point for point and adds
          haptics that most web lightboxes skip (where the browser exposes them:{' '}
          <code className="text-xs">navigator.vibrate</code> does nothing on iOS). Instagram-style{' '}
          <em>pinch-to-peek</em> (zoom only holds while fingers are down, then springs back to fit) is a deliberate
          product choice, not the default; ramka keeps the zoom level after release like Photos, which is the right
          behavior for a general-purpose viewer.
        </p>
      </DocsSection>

      <DocsSection id="heuristics" title="UX heuristics">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Zoom to the cursor.</strong> The single most important pointer-zoom heuristic. ramka honors it for
            wheel, pinch, and double-click.
          </li>
          <li>
            <strong>Don’t hijack bare scroll by default.</strong> Keeping <code className="text-xs">scrollToZoom</code>{' '}
            off is the safer default for embedded lightboxes; enable it for full-bleed, single-image viewers.
          </li>
          <li>
            <strong>Signal zoomability at rest.</strong> Consider a <code className="text-xs">zoom-in</code> cursor over
            the image at 1× so mouse-only users discover double-click and Ctrl-wheel zoom. ramka leaves this to your
            CSS: the <DocsLink href={svelteApiHref.zoom}>Zoom</DocsLink> surface exposes{' '}
            <code className="text-xs">data-zoom</code> only while scaled past 1×. Set{' '}
            <code className="text-xs">cursor: zoom-in</code> on the class you pass to{' '}
            <code className="text-xs">Lightbox.Zoom</code>; ramka’s grab / grabbing cursor wins once scaled:
          </li>
        </ul>
        <CodeBlock code={svelteExcerpts['zoom-cursor'].code} title="zoom.css" lang="css" />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Never steal swipe-to-dismiss.</strong> On touch, pan must only take over <em>after</em> the image is
            zoomed; at fit, the vertical swipe belongs to pull-to-dismiss and the horizontal swipe to navigation. ramka
            gates this with <code className="text-xs">touch-action</code> and the navigation lock.
          </li>
          <li>
            <strong>Rubber-band, don’t hard-stop.</strong> Elastic overscroll on pinch and pan (plus a haptic tick on
            snap-back) is what makes zoom feel native rather than mechanical.
          </li>
          <li>
            <strong>Size touch controls for fingers.</strong> Give{' '}
            <DocsLink href={svelteApiHref.zoomIn}>ZoomIn</DocsLink> /{' '}
            <DocsLink href={svelteApiHref.zoomOut}>ZoomOut</DocsLink> and{' '}
            <DocsLink href={svelteApiHref.close}>Close</DocsLink> a hit area of at least 44×44 px on touch (WCAG 2.5.8
            asks for 24 px or more; 44 px is the platform norm).
          </li>
        </ul>
      </DocsSection>

      <DocsSection id="wcag" title="WCAG conformance">
        <p>
          These are the WCAG 2.2 success criteria that govern zoom and pan. ramka ships the pointer and keyboard
          alternatives the criteria expect:
        </p>
        <div className={tableWrap}>
          <table className="w-full border-collapse text-left text-sm">
            <thead className={headRow}>
              <tr>
                <th className={th}>Success criterion</th>
                <th className={th}>Level</th>
                <th className={th}>Applies to</th>
                <th className={th}>ramka</th>
              </tr>
            </thead>
            <tbody>
              {wcag.map((row) => (
                <tr key={row.sc} className={rowClass}>
                  <td className={tdLabel}>
                    <a href={row.href} className={docsLinkClassName} target="_blank" rel="noreferrer">
                      {row.sc}
                    </a>
                  </td>
                  <td className={td}>{row.level}</td>
                  <td className={td}>{row.applies}</td>
                  <td className={td}>
                    <strong>{row.verdict}</strong> {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Note on 2.5.7.</strong> Pan-by-drag has a keyboard alternative (arrows), which satisfies{' '}
          <a href={keyboard} className={docsLinkClassName} target="_blank" rel="noreferrer">
            2.1.1 Keyboard
          </a>
          , but 2.5.7 specifically wants a <em>single-pointer, non-drag</em> alternative, and keyboard does not count
          for it. If you must meet AA strictly, add pointer pan controls (such as edge or arrow buttons) alongside{' '}
          <DocsLink href={svelteApiHref.zoomIn}>ZoomIn</DocsLink> /{' '}
          <DocsLink href={svelteApiHref.zoomOut}>ZoomOut</DocsLink>. Many shipping viewers do not either, but for
          enterprise targets it is worth flagging.
        </p>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.gestures} next={svelteDocsPages.rtl} />
    </DocsShell>
  );
}
