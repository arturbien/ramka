export type MorphPreset = 'default' | 'snappy' | 'relaxed' | 'spring';

export const ROOT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const CLOSE_EASING = 'cubic-bezier(0.22, 0, 0.35, 1)';

export const PRESETS: Record<MorphPreset, { duration: number; easing: string }> = {
  default: { duration: 360, easing: 'cubic-bezier(0.44, 0.58, 0, 1)' },
  snappy: { duration: 340, easing: 'cubic-bezier(0.38, 0.66, 0, 1)' },
  relaxed: { duration: 400, easing: 'cubic-bezier(0.48, 0.5, 0, 1)' },
  spring: { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
};

const NAME = 'lightbox-morph';
const LAYER = 'lightbox-layer';

/** True when the browser can run the morph and the user allows motion. */
export function canMorph() {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** True on mobile Blink, whose snapshot root includes the URL bar, so a moving bar aborts the morph. */
export function snapshotRootMoves() {
  if (typeof navigator === 'undefined' || 'GestureEvent' in window) return false;
  if (/Firefox\//.test(navigator.userAgent)) return false;
  const mobile =
    (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ??
    /Android/i.test(navigator.userAgent);
  return mobile && ('chrome' in window || /Chrome\//.test(navigator.userAgent));
}

const STABLE_FRAMES = 8;
const SETTLE_CAP = 1000;

/** Resolves once layout and visual viewport agree and have held still for a few frames. */
export function stableViewport() {
  const read = () => {
    const vv = window.visualViewport;
    return {
      key: `${innerWidth}x${innerHeight}|${vv?.height}|${Math.round(scrollX)},${Math.round(scrollY)}`,
      aligned: !vv || Math.abs(innerHeight - vv.height) <= 1,
    };
  };
  return new Promise<void>((resolve) => {
    const start = performance.now();
    let last = read().key;
    let still = 0;
    const tick = () => {
      const { key, aligned } = read();
      const elapsed = performance.now() - start;
      still = key === last && aligned ? still + 1 : 0;
      last = key;
      if (still >= STABLE_FRAMES || (elapsed >= SETTLE_CAP && aligned) || elapsed >= SETTLE_CAP * 1.5) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** The element whose pixels bridge the morph inside a trigger or item. */
export function morphSource(el: HTMLElement) {
  return el.querySelector<HTMLElement>('[data-ramka-morph], [data-ramka-media], img, video') ?? el;
}

let isolationCache: { key: string; result: boolean } | undefined;

function declaresName(rules: CSSRuleList): boolean {
  for (const rule of rules) {
    const name = (rule as CSSStyleRule).style?.getPropertyValue('view-transition-name').trim();
    if (name && name !== 'none') return true;
    const nested = (rule as CSSGroupingRule).cssRules ?? (rule as CSSImportRule).styleSheet?.cssRules;
    if (nested && declaresName(nested)) return true;
  }
  return false;
}

/** True when the page declares its own view-transition names that would ride over the morph. */
function pageNeedsIsolation(doc = document) {
  if (doc.querySelector('[style*="view-transition-name"]')) return true;
  const key = `${doc.styleSheets.length}/${doc.adoptedStyleSheets.length}`;
  if (isolationCache?.key === key) return isolationCache.result;
  const result = [...doc.styleSheets, ...doc.adoptedStyleSheets].some((sheet) => {
    try {
      return declaresName(sheet.cssRules);
    } catch {
      return false;
    }
  });
  isolationCache = { key, result };
  return result;
}

const PILL_RADIUS = 1e9;

function cornerPx(token: string, width: number) {
  const n = Number.parseFloat(token);
  if (!Number.isFinite(n)) return PILL_RADIUS;
  return Math.max(0, token.endsWith('%') ? (width * n) / 100 : n);
}

/** Border radius in used px after the corner-overlap rule, so pill and infinite radii interpolate. */
export function usedRadius(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect();
  const tokens =
    getComputedStyle(el)
      .borderRadius.split('/')[0]
      .match(/[^\s(]+(\([^)]*\))?/g) ?? [];
  if (!width || !height || !tokens.length) return '0px';
  const [a, b = a, c = a, d = b] = tokens as [string, ...string[]];
  const [tl, tr, br, bl] = [a, b, c, d].map((t) => cornerPx(t, width));
  const f = Math.min(1, width / (tl + tr), width / (bl + br), height / (tr + br), height / (tl + bl));
  return [tl, tr, br, bl].map((r) => `${Math.round(r * f * 100) / 100}px`).join(' ');
}

function sameBox(a: DOMRect, b: DOMRect) {
  return (
    Math.abs(a.left - b.left) <= 1 &&
    Math.abs(a.top - b.top) <= 1 &&
    Math.abs(a.right - b.right) <= 1 &&
    Math.abs(a.bottom - b.bottom) <= 1
  );
}

function visibleRadius(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  for (
    let node: HTMLElement | null = el;
    node && sameBox(node.getBoundingClientRect(), box);
    node = node.parentElement
  ) {
    const radius = usedRadius(node);
    if ((node === el || getComputedStyle(node).overflow !== 'visible') && /[1-9]/.test(radius)) return radius;
  }
  return usedRadius(el);
}

interface MorphOptions {
  phase: 'opening' | 'closing';
  preset: MorphPreset;
  crossfade: boolean;
  layers: HTMLElement[];
  from: HTMLElement;
  update: () => HTMLElement | null | undefined;
}

/** Runs one shared-element view transition from `from` to whatever `update` returns. */
export async function morph({ phase, preset, crossfade, layers, from, update }: MorphOptions) {
  const html = document.documentElement;
  const [triggerVar, itemVar] =
    phase === 'opening'
      ? ['--lightbox-morph-radius-trigger', '--lightbox-morph-radius-item']
      : ['--lightbox-morph-radius-item', '--lightbox-morph-radius-trigger'];
  let to: HTMLElement | null | undefined = null;

  html.setAttribute('data-ramka-view-transition', phase);
  html.setAttribute('data-ramka-vt-preset', preset);
  html.toggleAttribute('data-ramka-crossfade', crossfade);
  html.toggleAttribute('data-ramka-vt-isolate', pageNeedsIsolation());
  const liveRoot = layers.length > 0 && snapshotRootMoves();
  html.toggleAttribute('data-ramka-live-root', liveRoot);
  if (liveRoot)
    layers.forEach((el, i) => {
      el.style.setProperty('view-transition-name', `${LAYER}-${i}`, 'important');
      el.style.setProperty('view-transition-class', LAYER);
    });
  html.style.setProperty(triggerVar, visibleRadius(from));
  from.style.setProperty('view-transition-name', NAME, 'important');

  const transition = document.startViewTransition(() => {
    from.style.removeProperty('view-transition-name');
    if (liveRoot && phase === 'opening') from.style.visibility = 'hidden';
    to = update();
    if (!to) return;
    html.style.setProperty(itemVar, visibleRadius(to));
    to.style.setProperty('view-transition-name', NAME, 'important');
  });

  try {
    await transition.finished;
  } finally {
    (to as HTMLElement | null | undefined)?.style.removeProperty('view-transition-name');
    if (liveRoot)
      for (const el of layers) {
        el.style.removeProperty('view-transition-name');
        el.style.removeProperty('view-transition-class');
      }
    if (liveRoot && phase === 'opening') from.style.removeProperty('visibility');
    for (const name of ['view-transition', 'vt-preset', 'crossfade', 'vt-isolate', 'live-root'])
      html.removeAttribute(`data-ramka-${name}`);
    html.style.removeProperty(triggerVar);
    html.style.removeProperty(itemVar);
  }
}

/** Resolves once the image inside `el` is decoded, capped at `cap` ms. */
export function decoded(el: HTMLElement, cap: number) {
  const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
  if (!img || img.complete || cap <= 0) return Promise.resolve();
  return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, cap))]);
}

const presetRules = Object.entries(PRESETS)
  .map(
    ([name, p]) => `:root[data-ramka-vt-preset="${name}"]::view-transition {
  --lightbox-vt-duration: ${p.duration}ms;
  --lightbox-vt-easing: ${p.easing};
}`,
  )
  .join('\n');

const duration = `var(--lightbox-vt-duration, ${PRESETS.default.duration}ms)`;
const easing = `var(--lightbox-vt-easing, ${PRESETS.default.easing})`;

/** Structural and morph stylesheet; every consumer-facing rule sits in `:where()` or behind a transition-time attribute. */
export const CSS = `
:root[data-ramka-vt-isolate] * { view-transition-name: none !important; }
${presetRules}
:root[data-ramka-live-root] { view-transition-name: none; }
:root[data-ramka-view-transition]::view-transition { --lightbox-morph-old-opacity: 1; }
:root[data-ramka-view-transition="opening"]::view-transition {
  --lightbox-morph-new-opacity: 1;
  --lightbox-morph-border-radius-from: var(--lightbox-morph-radius-trigger, 0px);
  --lightbox-morph-border-radius-to: var(--lightbox-morph-radius-item, 0px);
}
:root[data-ramka-view-transition="closing"]::view-transition {
  --lightbox-morph-new-opacity: 0;
  --lightbox-morph-border-radius-from: var(--lightbox-morph-radius-item, 0px);
  --lightbox-morph-border-radius-to: var(--lightbox-morph-radius-trigger, 0px);
}
[data-morph-target] { opacity: 0; transition: opacity 200ms ${ROOT_EASING}; }
:root[data-ramka-view-transition] [data-morph-target] { transition: none; }

@media (prefers-reduced-motion: no-preference) {
  :root[data-ramka-view-transition]::view-transition-old(root),
  :root[data-ramka-view-transition]::view-transition-new(root),
  ::view-transition-old(*.${LAYER}),
  ::view-transition-new(*.${LAYER}) {
    animation-duration: ${duration};
    animation-timing-function: var(--lightbox-vt-root-easing, ${ROOT_EASING});
  }
  @keyframes ramka-morph-radius {
    to { border-radius: var(--lightbox-morph-border-radius-to, 0px); }
  }
  ::view-transition-group(${NAME}) {
    overflow: hidden;
    border-radius: var(--lightbox-morph-border-radius-from, 0px);
    animation-name: -ua-view-transition-group-anim-${NAME}, ramka-morph-radius;
    animation-duration: ${duration};
    animation-timing-function: ${easing};
    animation-fill-mode: both;
    z-index: 2;
  }
  ::view-transition-old(${NAME}),
  ::view-transition-new(${NAME}) {
    object-fit: cover;
    width: 100%;
    height: 100%;
    animation: none !important;
    mix-blend-mode: normal;
  }
  ::view-transition-old(${NAME}) { opacity: var(--lightbox-morph-old-opacity, 1); }
  ::view-transition-new(${NAME}) { opacity: var(--lightbox-morph-new-opacity, 0); }
  :root[data-ramka-crossfade]::view-transition-old(${NAME}),
  :root[data-ramka-crossfade]::view-transition-new(${NAME}) {
    object-fit: fill;
    mix-blend-mode: plus-lighter;
    animation: revert !important;
    animation-duration: calc(${duration} * 0.48) !important;
    animation-timing-function: ${easing} !important;
    animation-fill-mode: both !important;
    opacity: revert;
  }
  :root[data-ramka-view-transition="closing"][data-ramka-crossfade]::view-transition-old(${NAME}),
  :root[data-ramka-view-transition="closing"][data-ramka-crossfade]::view-transition-new(${NAME}) {
    animation-timing-function: var(--lightbox-vt-crossfade-close-easing, ${CLOSE_EASING}) !important;
  }
}

[data-ramka-slides]::view-transition-group(root) {
  animation-duration: var(--lightbox-select-vt-duration, 0.4s);
  animation-timing-function: var(--lightbox-select-vt-easing, cubic-bezier(0.22, 1, 0.36, 1));
}
[data-ramka-slides]::view-transition-old(root),
[data-ramka-slides]::view-transition-new(root) {
  mix-blend-mode: normal;
  height: 100%;
  overflow: clip;
}

:where([data-ramka-content]) {
  overflow: hidden;
  overscroll-behavior: contain;
  user-select: none;
  -webkit-user-select: none;
}
:where([data-ramka-slides]) {
  position: relative;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior: contain;
  touch-action: pan-x;
  container-type: size;
}
:where([data-ramka-slides])::-webkit-scrollbar { display: none; }
:where([data-ramka-slides][data-locked]) { overflow-x: hidden; }
:where([data-ramka-slides][data-ssr-shift]) { overflow: clip; scroll-snap-type: none; }
[data-ssr-active] { scroll-initial-target: nearest; }
[data-ssr-shift] [data-ssr-active] { scroll-initial-target: none; }
[data-ssr-shift] [data-ramka-slide] {
  transform: translateX(calc(var(--lightbox-ssr-index, 0) * var(--lightbox-ssr-shift-sign, -1) * (100% + var(--lightbox-ssr-slide-gap, 0px))));
}
:where([data-ramka-slide]) {
  flex: 0 0 100%;
  min-width: 100%;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}
:where([data-ramka-thumbnail-strip]) { position: relative; overflow: clip; }
:where([data-ramka-thumbnail-strip-track]) { position: relative; display: flex; width: max-content; will-change: transform; }
:where([data-ramka-item]) { position: relative; width: 100%; height: 100%; container-type: size; }
:where([data-ramka-zoom]) {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  container-type: size;
}
:where([data-ramka-zoom][data-zoom]) { touch-action: none; cursor: grab; }
:where([data-ramka-zoom][data-dragging]) { cursor: grabbing; }
:where([data-ramka-zoom-content]) { display: grid; transform-origin: center; }
:where([data-ramka-zoom][data-zoom] > [data-ramka-zoom-content]) { will-change: transform; }
:where([data-ramka-media]) { position: relative; display: grid; max-width: 100cqw; max-height: 100cqh; }
:where([data-ramka-media][data-width][data-height]) {
  width: min(100cqw, 100cqh * var(--ramka-ratio));
  aspect-ratio: var(--ramka-ratio);
}
:where([data-ramka-media]) > :where(img, video) {
  grid-area: 1 / 1;
  max-width: 100cqw;
  max-height: 100cqh;
  user-select: none;
  -webkit-user-drag: none;
}
:where([data-ramka-media][data-width][data-height]) > :where(img, video, canvas:not([data-ramka-placeholder])) {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: cover;
}
`;

/** `<style>` tag carrying the stylesheet, for server-rendered `<head>` output. */
export const styleTag = (nonce?: string) =>
  `<style data-ramka${nonce ? ` nonce="${nonce.replace(/"/g, '&quot;')}"` : ''}>${CSS}</style>`;

let adopted = false;

/** Inserts the stylesheet once, ahead of consumer CSS; falls back to a constructed sheet when CSP refuses the tag. */
export function ensureStyles(nonce?: string) {
  if (typeof document === 'undefined' || adopted || document.querySelector('style[data-ramka-runtime]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-ramka-runtime', '');
  if (nonce) style.nonce = nonce;
  style.textContent = CSS;
  document.head.prepend(style);
  if (style.sheet || typeof CSSStyleSheet === 'undefined' || !('replaceSync' in CSSStyleSheet.prototype)) return;
  style.remove();
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
  adopted = true;
}
