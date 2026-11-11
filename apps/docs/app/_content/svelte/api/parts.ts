import type { ApiPart, PropRow } from '../../lightbox/api/types';

const restDiv = (tag: string): PropRow => ({
  name: '...rest',
  type: `HTMLAttributes<HTMLDivElement>`,
  description: `Any other attribute or event handler is spread onto the ${tag} element, including \`class\`, \`style\` and \`aria-*\`.`,
});

const restButton = (tag: string): PropRow => ({
  name: '...rest',
  type: 'HTMLButtonAttributes',
  description: `Any other attribute or event handler is spread onto the ${tag} element, including \`class\`, \`style\` and \`aria-*\`. An \`onclick\` that calls \`preventDefault()\` skips the built-in action.`,
});

/** Lightbox parts in page order. */
export const svelteApiParts: ApiPart[] = [
  {
    id: 'api-root',
    name: 'Root',
    description:
      'Groups all parts of the lightbox and owns open state, active index, the view transition morph and the active zoom bridge. Renders no element of its own. Pass `handle` from `createHandle()` for imperative control and detached Triggers, or call `show(index)` and `close()` on the instance from `bind:this`. Prefer `onOpenChangeComplete` for work after the motion; use `scrollTriggerIntoView` so close morphs land on screen when the page scrolled while open.',
    props: [
      {
        name: 'children',
        type: 'Snippet',
        description: 'Lightbox parts and page content (triggers typically live as children of Root).',
      },
      {
        name: 'handle',
        type: 'LightboxHandle',
        description:
          'Imperative handle from `createHandle()`. Pass the same handle to detached `Lightbox.Trigger`s outside this Root.',
      },
      {
        name: 'open',
        type: 'boolean',
        default: 'false',
        description:
          'Open state, bindable: use `bind:open` to read and write it, or pass a plain value for a one way initial state. Replaces React’s `open` / `defaultOpen` pair.',
      },
      {
        name: 'onOpenChange',
        type: '(open: boolean) => void',
        description:
          'Called when open state changes (immediately, before enter and exit animations finish). Prefer this for syncing URL state or stores.',
      },
      {
        name: 'onOpenChangeComplete',
        type: '(open: boolean) => void',
        description:
          'Called when the open or close transition settles. Receives `true` after open completes, `false` after close completes. Prefer this for cleanup and focus management.',
      },
      {
        name: 'index',
        type: 'number',
        default: '0',
        description:
          'Active index, bindable: use `bind:index` to read and write it. Replaces React’s `value` / `defaultValue` pair.',
      },
      {
        name: 'onValueChange',
        type: '(value: number, meta: { source: NavigationSource }) => void',
        description: 'Callback when the active index changes, with the source of the navigation.',
      },
      {
        name: 'count',
        type: 'number',
        description:
          'Total number of items, used until the mounted `Lightbox.Item`s have registered themselves. Items register when they mount in the browser, never during server rendering, so a page that server renders an open lightbox paints `Lightbox.Counter` as "n / 0" (and disables `Lightbox.Next` / `Lightbox.Previous` at the boundary when `loop` is off) until hydration. Pass the item total to make that first paint correct. Once any item mounts the live registry takes over and this prop is ignored.',
      },
      {
        name: 'loop',
        type: 'boolean',
        default: 'false',
        description: 'Wrap navigation at boundaries.',
      },
      {
        name: 'dir',
        type: 'TextDirection',
        default: "'ltr' (behavior); no `dir` attribute is written when omitted",
        description:
          "Reading direction. `'rtl'` mirrors slide navigation, thumbnail strip travel and the horizontal arrow keys (so `ArrowLeft` advances). The direction is written to the `Lightbox.Portal` host as a `dir` attribute, so CSS follows it across the portal boundary; that also runs one RTL lightbox inside an LTR page. Pass it whenever the surrounding UI is RTL: behavior falls back to `'ltr'` without it. In development `Lightbox.Slides` warns when its computed direction disagrees.",
      },
      {
        name: 'viewTransition',
        type: 'boolean | MorphPreset',
        default: 'true',
        description:
          "Morph between trigger and lightbox item through the View Transitions API. On by default: clicking a trigger morphs into the fullscreen item, and close morphs back. Pass `false` to open and close without a morph. Without View Transitions support or under `prefers-reduced-motion` the lightbox opens and closes without a morph. A preset name picks the motion: `'default'` (360ms, same as `true`), `'snappy'` (340ms, quicker launch), `'relaxed'` (400ms, softer settle) or `'spring'` (450ms, critically damped). The preset drives the morph, the crossfade and the root fade together.",
      },
      {
        name: 'scrollTriggerIntoView',
        type: 'ScrollTriggerIntoView',
        default: 'null',
        description:
          "Scroll the trigger the close morph will land on into the viewport, so close animations stay on screen. Accepts one option or an array. Each option has a `type`: `'onChange'` scrolls whenever the active index changes while open, `'onOpenComplete'` scrolls once the open transition finishes (invisible under the viewer, `'instant'` recommended), `'onClose'` scrolls just before the close morph. `behavior` is `'smooth'` (default) or `'instant'`; `block` and `inline` are `scrollIntoView` alignments (`'nearest'` default). Respects `morphTo`.",
      },
      {
        name: 'morphTo',
        type: 'MorphTo',
        default: "'active'",
        description:
          "Which trigger receives the morph on close. `'active'` morphs to the trigger of the current active index (no morph when there is none). `'origin'` always morphs back to the trigger that opened the lightbox. `'closest'` uses the active index trigger if it exists, otherwise the nearest registered trigger.",
      },
      {
        name: 'awaitImageDecode',
        type: 'boolean | number',
        default: 'true',
        description:
          'How long the open morph waits for the destination image to decode before starting. `true` waits up to 200ms, `false` starts immediately, a number waits up to that many milliseconds. Skipped when the trigger thumbnail is painted as a placeholder into `Lightbox.Media`. Runs before `onBeforeOpen`. Only relevant when `viewTransition` is enabled.',
      },
      {
        name: 'onBeforeOpen',
        type: '(ctx: BeforeOpenContext) => void | Promise<void>',
        description:
          'Called after the open morph has mounted the lightbox and finished any `awaitImageDecode` wait, and before the View Transition starts. Use it to await custom media readiness (iframe `load`, video `loadeddata`). May return a Promise: the morph waits for it, so bound your own timeout. `ctx.destination` is the morph target, `ctx.signal` aborts when a newer open or close supersedes this one. Only relevant when `viewTransition` is enabled.',
      },
      {
        name: 'onBeforeClose',
        type: '(ctx: BeforeCloseContext) => void',
        description:
          'Called synchronously just before close commits and before the old snapshot is captured. Use it to freeze custom media (`video.pause()`, stop a rAF loop) so the close morph does not catch a frame mid change. Cannot delay close; return values are ignored.',
      },
    ],
  },
  {
    id: 'api-trigger',
    name: 'Trigger',
    description:
      'A `<button>` that opens the lightbox at a given index and is the morph source. Carries the dialog trigger semantics: `aria-haspopup="dialog"`, `aria-controls` pointing at the dialog while open, and `aria-expanded` set only on the trigger that opened it. Pass `handle` to use it outside Root. Prefer the snippet form of `children` to attach `imageRef` / `morphRef`.',
    props: [
      {
        name: 'index',
        type: 'number',
        required: true,
        description: 'Item index this trigger opens.',
      },
      {
        name: 'id',
        type: 'string',
        description:
          'Stable id for this trigger. Needed for `handle.open(index, { triggerId })` association. Also applied as the DOM `id`.',
      },
      {
        name: 'handle',
        type: 'LightboxHandle',
        description:
          'Handle from `createHandle()`. Pass the same handle as Root to use this Trigger outside the Root tree (detached trigger).',
      },
      {
        name: 'crossfade',
        type: 'Crossfade',
        description:
          "Crossfade between trigger and item snapshots during the morph. Omit for a hard cut, ideal when trigger and item show the same image at the same aspect. `'both'` crossfades on open and close, `'open'` only when opening, `'close'` only when closing (e.g. poster to live video). Sets `data-crossfade` on the trigger and `data-ramka-crossfade` on `<html>` during phases that dissolve.",
      },
      {
        name: 'children',
        type: 'Snippet<[{ open: boolean; active: boolean; imageRef: ImageRef; morphRef: MorphRef }]>',
        description:
          'Trigger content. The snippet receives `imageRef` / `morphRef` attachments (use `{@attach imageRef}` on the thumbnail `<img>` and `{@attach morphRef}` on the morph element) plus `open` / `active` state.',
      },
      restButton('`<button>`'),
    ],
    attributes: [
      { name: 'data-ramka-trigger', description: 'Always present on the trigger element.' },
      { name: 'data-popup-open', description: 'Present when the corresponding lightbox is open.' },
      { name: 'data-active', description: 'Present when this trigger’s index is the active item.' },
      {
        name: 'data-morph-target',
        description:
          'Present while the lightbox is open on the element the close morph will land on: the node from `morphRef` or `imageRef` when attached, otherwise the first `[data-ramka-morph]`, `[data-ramka-media]`, `img` or `video` inside the trigger, else the button itself. Style against this attribute directly; do not assume it lives on the button.',
      },
      {
        name: 'data-crossfade',
        description: 'Reflects the `crossfade` prop: `open`, `close` or `both`.',
      },
      {
        name: 'data-ramka-morph',
        description:
          'Not set by the library. Put it on a descendant of the trigger to make that element the morph source without `morphRef`.',
      },
    ],
  },
  {
    id: 'api-portal',
    name: 'Portal',
    description:
      'Moves Backdrop and Content into a host element (default `document.body`). Pass `container` and `keepMounted` here. With `keepMounted`, give the Portal host a stacking level yourself (e.g. `class="relative z-[1]"`).',
    props: [
      {
        name: 'container',
        type: 'HTMLElement | ShadowRoot | null',
        default: 'document.body',
        description: 'Where to mount the portal host. Pass `null` to render the host in place (no portal).',
      },
      {
        name: 'keepMounted',
        type: 'boolean',
        default: 'false',
        description:
          'Keep Portal, Backdrop and Content mounted while the lightbox is closed. Closed nodes stay in the DOM but are inert and hidden (`visibility: hidden`, `pointer-events: none`). Useful for a warm reopen of expensive destinations such as map iframes.',
      },
      {
        name: 'children',
        type: 'Snippet',
        description: 'Backdrop, Content and anything else that belongs in the portal.',
      },
      restDiv('portal host `<div>`'),
    ],
    attributes: [{ name: 'data-ramka-portal', description: 'Always present on the portal host element.' }],
    cssVariables: [
      {
        name: '--lightbox-vt-duration',
        type: '<time>',
        description:
          'Duration of the Root’s `viewTransition` preset, always written on the Portal host so skin fades inside the portal can follow the preset’s clock even when no morph runs, e.g. `transition: opacity var(--lightbox-vt-duration, 360ms) ease-out`. Do not set it yourself.',
      },
      {
        name: '--lightbox-vt-easing',
        type: '<easing-function>',
        description: 'Morph easing of the active preset, written on the Portal host like `--lightbox-vt-duration`.',
      },
      {
        name: '--lightbox-vt-root-easing',
        type: '<easing-function>',
        description:
          'Root snapshot fade easing of the active preset, written on the Portal host. A good default for skin backdrop and content fades.',
      },
    ],
  },
  {
    id: 'api-backdrop',
    name: 'Backdrop',
    description:
      'Optional scrim (place inside `Lightbox.Portal`, typically beside Content). Click closes the lightbox. Tracks pull to dismiss progress.',
    props: [restDiv('backdrop `<div>`')],
    attributes: [
      { name: 'data-ramka-backdrop', description: 'Always present on the backdrop element.' },
      { name: 'data-open', description: 'Present while the lightbox is open.' },
      {
        name: 'data-closed',
        description: 'Present while the lightbox is closed (still rendered).',
      },
      {
        name: 'data-pulling',
        description: 'Present while pull to dismiss is active (mirrors Content).',
      },
      {
        name: 'data-pull-snapping',
        description: 'Present while a cancelled pull springs back (mirrors Content).',
      },
    ],
    cssVariables: [
      {
        name: '--lightbox-pull-progress',
        type: '<number>',
        description: 'Same progress variable as Content, inherited from the Portal host.',
      },
      {
        name: '--lightbox-pull-snap-duration',
        type: '<time>',
        description: 'Same snap back duration variable as Content, inherited from the Portal host.',
      },
      {
        name: '--lightbox-pull-snap-easing',
        type: '<easing-function>',
        description: 'Same snap back easing variable as Content, inherited from the Portal host.',
      },
    ],
  },
  {
    id: 'api-content',
    name: 'Content',
    description:
      'Dialog surface (`role="dialog"`, `aria-modal`). Provide an accessible name through `aria-label` or `aria-labelledby` (the library warns in development when it is missing). Place inside `Lightbox.Portal`. Owns focus trap, Escape, scroll lock and pull to dismiss; a click on the surface itself (not its children) closes. When `Lightbox.Stage` is mounted, arrow, Home and End navigation, zoom shortcuts (unmodified `+`, `-`, `0`) and pull are scoped to Stage; otherwise Content is the stage. Arrow keys pan instead of navigate while the active Zoom is above 1×.',
    props: [
      {
        name: 'pullToClose',
        type: 'boolean',
        default: 'true',
        description:
          'Enable pull to close on touch and trackpad wheel. Starts from anywhere in Stage (or Content when Stage is omitted), except buttons, links, form fields and elements marked `data-ramka-no-pull`. Publishes `data-pulling`, `data-pull-snapping`, `data-pull-dismissing` and `--lightbox-pull-progress` while active.',
      },
      {
        name: 'children',
        type: 'Snippet',
        description: 'Dialog contents (close, slides and items, chrome).',
      },
      restDiv('dialog `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-content', description: 'Always present on the dialog surface.' },
      { name: 'data-open', description: 'Present while the lightbox is open.' },
      {
        name: 'data-closed',
        description: 'Present while the lightbox is closed (still rendered).',
      },
      { name: 'data-pulling', description: 'Present while a pull to dismiss drag is in progress.' },
      {
        name: 'data-pull-snapping',
        description:
          'Present while a cancelled pull springs back to rest. `data-pulling` is dropped on release so chrome can transition; this latch keeps pull only layout until the item is back.',
      },
      {
        name: 'data-pull-dismissing',
        description: 'Present while the dismiss animation runs after crossing the threshold.',
      },
      {
        name: 'data-zooming',
        description: 'Present during an active pinch or pan on the active Zoom (blocks pull to dismiss).',
      },
      {
        name: 'data-zoomed',
        description: 'Present when the active zoom is greater than its minimum.',
      },
      {
        name: 'data-ramka-no-pull',
        description: 'Not set by the library. Put it on a descendant to keep pull to dismiss from starting there.',
      },
    ],
    cssVariables: [
      {
        name: '--lightbox-pull-progress',
        type: '<number>',
        description:
          '0 at rest, 1 at the dismiss threshold. Written on the Portal host (or on Content when there is no Portal) and inherited. Drive backdrop and content opacity from this.',
      },
      {
        name: '--lightbox-pull-snap-duration',
        type: '<time>',
        description:
          'Duration of the pull to dismiss snap back, published only while the cancelled pull springs back to rest. Use it in your transition so progress driven visuals stay in step with the item, e.g. `transition: opacity var(--lightbox-pull-snap-duration, 300ms) var(--lightbox-pull-snap-easing, ease)`.',
      },
      {
        name: '--lightbox-pull-snap-easing',
        type: '<easing-function>',
        description:
          'Easing of the pull to dismiss snap back (a velocity aware spring, published only during the spring back). Pair with `--lightbox-pull-snap-duration`.',
      },
      {
        name: '--lightbox-zoom-progress',
        type: '<number>',
        description:
          '0 at minimum zoom, 1 once zoom has risen one step above it (e.g. 2× when the minimum is 1). Written on Content from the active `Lightbox.Zoom` and cleared at rest. Drive sibling dim or blur from this, e.g. `opacity: calc(1 - var(--lightbox-zoom-progress, 0))`.',
      },
    ],
  },
  {
    id: 'api-stage',
    name: 'Stage',
    description:
      'Optional media interaction surface inside Content. Scopes pull to dismiss, Zoom pan viewport geometry, arrow, Home and End navigation, and zoom shortcuts to the media pane. Place side panels as siblings of Stage under Content. When omitted, Content itself is the stage. Attach `morphRef` from the snippet when the morph should capture this surface (or a descendant) instead of the active item.',
    props: [
      {
        name: 'children',
        type: 'Snippet<[{ morphRef: MorphRef }]>',
        description:
          'Stage content. The snippet receives `morphRef`; `{@attach morphRef}` on an element to morph it instead of the active item.',
      },
      restDiv('stage `<div>`'),
    ],
    attributes: [{ name: 'data-ramka-stage', description: 'Always present on the media interaction stage.' }],
  },
  {
    id: 'api-slides',
    name: 'Slides',
    description:
      'Default layout: horizontal snap carousel wired to the active index. Emits `role="group"`; pass a translated `aria-roledescription="carousel"` plus an `aria-label` or `aria-labelledby` naming the gallery. Gates Item contents through `preload`; put Slide, Item, Zoom and Media inside. While zoomed or pulling, the scroller is locked so gestures do not fight the scroll.',
    props: [
      {
        name: 'preload',
        type: 'number',
        default: '1',
        description:
          'How many slides on each side of the active one render their `Lightbox.Item` content. Slide boxes are always present so the scroll extent is correct. Content stays mounted once rendered.',
      },
      {
        name: 'ssrSlideShift',
        type: 'boolean',
        default: 'false',
        description:
          'First paint slide positioning for pages that server render an open lightbox. A scroll offset cannot be serialized into HTML, so such pages otherwise paint slide 0 until hydration. While this is on, the server HTML translates every slide by the active index times `(100% + gap)` so the active slide fills the scrollport; hydration swaps the real scroll offset in. Only for scrollport wide slides. If the track has a `gap`, mirror it into `--lightbox-ssr-slide-gap`. Without it, the active item still carries `scroll-initial-target` for engines that support it.',
      },
      { name: 'children', type: 'Snippet', description: 'The `Lightbox.Slide`s.' },
      restDiv('scrollport `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-slides', description: 'Always present on the slides scrollport.' },
      { name: 'data-active-index', description: 'Current active index.' },
      { name: 'data-direction', description: '`forward` or `backward`.' },
      { name: 'data-orientation', description: 'Always `horizontal`.' },
      {
        name: 'data-locked',
        description: 'Present while the active item is zoomed or being pulled; the scroller stops scrolling.',
      },
      { name: 'data-scrolling', description: 'Present while the scroller is moving.' },
      {
        name: 'data-ssr-shift',
        description:
          'Present in server rendered HTML while the `ssrSlideShift` transform is applied. While set, every slide is translated so the active one fills the scrollport, and the scrollport is clipped so a swipe before hydration cannot reveal empty positions.',
      },
    ],
    cssVariables: [
      {
        name: '--lightbox-ssr-slide-gap',
        type: '<length>',
        description: 'Set it yourself to the track `gap` when using `ssrSlideShift`. Defaults to `0px`.',
      },
      {
        name: '--lightbox-select-vt-duration',
        type: '<time>',
        description:
          'Duration of the element scoped view transition on Slides when a thumbnail is picked with the pointer (`selectViewTransition` on ThumbnailStrip). Set it on Slides or a parent. Defaults to `0.4s`.',
      },
      {
        name: '--lightbox-select-vt-easing',
        type: '<easing-function>',
        description: 'Easing of that thumbnail select view transition. Defaults to `cubic-bezier(0.22, 1, 0.36, 1)`.',
      },
    ],
  },
  {
    id: 'api-slide',
    name: 'Slide',
    description:
      'One snap aligned slide box inside Slides. Snap alignment is built in and the default box is full width (`flex: 0 0 100%`); override `flex`, `width` or `min-width` through `class` or `style` for other layouts. Place a `Lightbox.Item` (and typically Zoom and Media) inside. Put resting chrome and safe area insets as padding on Slide so Item and Zoom fill the content box.',
    props: [
      { name: 'children', type: 'Snippet', description: 'Usually one `Lightbox.Item`.' },
      restDiv('slide `<div>`'),
    ],
    attributes: [{ name: 'data-ramka-slide', description: 'Always present on the slide element.' }],
  },
  {
    id: 'api-item',
    name: 'Item',
    description:
      'A single lightbox item. Registers its caption and morph and placeholder refs. ARIA adapts: it is a `tabpanel` wired to its `Lightbox.Thumbnail` tab when a ThumbnailGroup is present, otherwise `role="group"`, which needs a translated `aria-roledescription="slide"` and an `aria-label` carrying the position from you. Inactive items are `inert`. Prefer nesting `Lightbox.Media` around the destination `<img>` or `<video>`. Outside Slides every item renders its content; inside Slides, `preload` gates it.',
    props: [
      {
        name: 'index',
        type: 'number',
        required: true,
        description: 'The index of this item in the collection.',
      },
      {
        name: 'caption',
        type: 'string | Snippet',
        description: 'Optional caption for this item, displayed by `Lightbox.Caption`.',
      },
      {
        name: 'children',
        type: 'Snippet<[{ index: number; active: boolean; visible: boolean; morphRef: MorphRef; imageRef: ImageRef }]>',
        description:
          'Item content. The snippet receives per item state (`visible` is false outside the `preload` window) plus `imageRef` / `morphRef`. Attach `imageRef` to your `<img>` so the open transition bridges the blank frame with the trigger thumbnail.',
      },
      restDiv('item `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-item', description: 'Always present on the item element.' },
      { name: 'data-active', description: 'Present when this item is the active index.' },
      { name: 'data-index', description: 'The item index.' },
      {
        name: 'data-skip-fade',
        description: 'Set during the open morph; use it to suppress your own entrance fades on the destination item.',
      },
      {
        name: 'data-ssr-active',
        description:
          'Present only in server rendered HTML, on the active item. Carries `scroll-initial-target: nearest`, so engines that support it scroll Slides to the active slide before first paint.',
      },
    ],
  },
  {
    id: 'api-zoom',
    name: 'Zoom',
    description:
      'Pinch, wheel, double click and keyboard zoom and pan surface. Fills its host and is a CSS size container for nested Media. Does not clip; clipping belongs on Content or chrome so zoomed media can escape the resting box. Prefer Zoom, then Media, then `img` or `video`. Publishes to the Root’s active zoom bridge so ZoomIn and ZoomOut in toolbar chrome target the active slide. Methods are on the instance from `bind:this` (see Zoom instance).',
    props: [
      {
        name: 'children',
        type: 'Snippet<[{ zoom: number; maxZoom: number; offsetX: number; offsetY: number; canZoomIn: boolean; canZoomOut: boolean; dragging: boolean }]>',
        description: 'Zoomable content. The snippet receives the current zoom state.',
      },
      { name: 'minZoom', type: 'number', default: '1', description: 'Minimum zoom level.' },
      {
        name: 'maxZoom',
        type: 'number',
        default: 'undefined (auto)',
        description:
          'Maximum zoom level. When not set, computed from the first `<img>` child’s natural size against the container size. Falls back to 4 without image dimensions.',
      },
      {
        name: 'zoomStep',
        type: 'number',
        default: '2',
        description: 'Multiplier for button and keyboard zoom steps.',
      },
      {
        name: 'scrollToZoom',
        type: 'boolean',
        default: 'false',
        description: 'Enable zoom through bare scroll or trackpad without Ctrl.',
      },
      {
        name: 'wheelSensitivity',
        type: 'number',
        default: '100',
        description: 'Wheel and trackpad zoom sensitivity factor.',
      },
      {
        name: 'keyboardPanDistance',
        type: 'number',
        default: '50',
        description: 'Keyboard pan distance in content px per keypress.',
      },
      {
        name: 'doubleClickDelay',
        type: 'number',
        default: '300',
        description: 'Max delay between clicks for double click detection (ms).',
      },
      {
        name: 'onZoomChange',
        type: '(zoom: number) => void',
        description: 'Callback when the zoom level changes.',
      },
      restDiv('zoom `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-zoom', description: 'Always present on the zoom container.' },
      { name: 'data-zoom', description: 'Present when zoom is above the minimum.' },
      { name: 'data-dragging', description: 'Present while panning with a pointer.' },
      {
        name: 'data-ramka-zoom-content',
        description: 'Always present on the inner wrapper that receives the zoom transform.',
      },
    ],
  },
  {
    id: 'api-media',
    name: 'Media',
    description:
      'Sized destination media host: morph target and placeholder canvas container. `width` and `height` give it a fit box; direct `img` and `video` children fill it. Cosmetics (radius, colors, `object-fit`) stay yours. Prefer Zoom, then Media, then `img` or `video`. Reads the size of the first `<img>` or `<video>` when `width` and `height` are omitted.',
    props: [
      {
        name: 'width',
        type: 'number',
        description:
          'Intrinsic pixel width of the media. With `height`, applies a fit box. When omitted, taken from the child `<img>` `width` attribute or natural size, or the `<video>` size.',
      },
      { name: 'height', type: 'number', description: 'Intrinsic pixel height of the media.' },
      { name: 'children', type: 'Snippet', description: 'The destination `<img>` or `<video>`.' },
      restDiv('media `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-media', description: 'Always present on the media host.' },
      {
        name: 'data-placeholder',
        description: 'Present while the open morph placeholder canvas is bridging.',
      },
      {
        name: 'data-width',
        description: 'The resolved fit box width, present when both dimensions are known.',
      },
      {
        name: 'data-height',
        description: 'The resolved fit box height, present when both dimensions are known.',
      },
    ],
  },
  {
    id: 'api-close',
    name: 'Close',
    description:
      'Button that closes the lightbox. Ships no label: give it visible text or pass `aria-label` / `aria-labelledby` in your language (the library warns in development when it is nameless).',
    props: [{ name: 'children', type: 'Snippet', description: 'Button content.' }, restButton('`<button>`')],
    attributes: [{ name: 'data-ramka-close', description: 'Always present on the close button.' }],
  },
  {
    id: 'api-previous',
    name: 'Previous',
    description: 'Navigate to the previous item. Disabled at the start when `loop` is false.',
    props: [{ name: 'children', type: 'Snippet', description: 'Button content.' }, restButton('`<button>`')],
    attributes: [
      { name: 'data-ramka-previous', description: 'Always present on the previous button.' },
      { name: 'data-disabled', description: 'Present when navigation is unavailable.' },
    ],
  },
  {
    id: 'api-next',
    name: 'Next',
    description: 'Navigate to the next item. Disabled at the end when `loop` is false.',
    props: [{ name: 'children', type: 'Snippet', description: 'Button content.' }, restButton('`<button>`')],
    attributes: [
      { name: 'data-ramka-next', description: 'Always present on the next button.' },
      { name: 'data-disabled', description: 'Present when navigation is unavailable.' },
    ],
  },
  {
    id: 'api-zoom-in',
    name: 'ZoomIn',
    description: 'Increments zoom. Works inside Zoom, or as global chrome through the active slide zoom bridge.',
    props: [{ name: 'children', type: 'Snippet', description: 'Button content.' }, restButton('`<button>`')],
    attributes: [
      { name: 'data-ramka-zoom-in', description: 'Always present on the zoom in button.' },
      { name: 'data-disabled', description: 'Present when zooming in is unavailable.' },
    ],
  },
  {
    id: 'api-zoom-out',
    name: 'ZoomOut',
    description: 'Decrements zoom. Works inside Zoom, or as global chrome through the active slide zoom bridge.',
    props: [{ name: 'children', type: 'Snippet', description: 'Button content.' }, restButton('`<button>`')],
    attributes: [
      { name: 'data-ramka-zoom-out', description: 'Always present on the zoom out button.' },
      { name: 'data-disabled', description: 'Present when zooming out is unavailable.' },
    ],
  },
  {
    id: 'api-counter',
    name: 'Counter',
    description: 'Shows the active position (e.g. "1 / 12") in an `aria-live` region.',
    props: [
      {
        name: 'children',
        type: 'Snippet<[{ current: number; total: number }]>',
        default: 'renders "1 / 12"',
        description: 'Snippet for a custom counter format.',
      },
      restDiv('counter `<div>`'),
    ],
    attributes: [{ name: 'data-ramka-counter', description: 'Always present on the counter element.' }],
  },
  {
    id: 'api-caption',
    name: 'Caption',
    description: 'Renders the active item’s caption from the Item caption registry, in an `aria-live` region.',
    props: [
      {
        name: 'children',
        type: 'Snippet',
        description:
          'Fallback content, rendered only while no item has registered. Items register when they mount in the browser, so a server rendered open lightbox paints an empty caption until then. Pass the active item’s caption here to make the first paint correct; once any item registers, the registry wins.',
      },
      restDiv('caption `<div>`'),
    ],
    attributes: [
      { name: 'data-ramka-caption', description: 'Always present on the caption element.' },
      { name: 'data-has-caption', description: 'Present when the active item has a caption.' },
    ],
  },
  {
    id: 'api-thumbnail-group',
    name: 'ThumbnailGroup',
    description:
      'Accessible tablist of thumbnails with arrow, Home and End keyboard support. Without a ThumbnailStrip, the active thumbnail scrolls itself to the center of its parent.',
    props: [
      { name: 'children', type: 'Snippet', description: 'The `Lightbox.Thumbnail`s.' },
      restDiv('tablist `<div>`'),
    ],
    attributes: [
      {
        name: 'data-ramka-thumbnail-group',
        description: 'Always present on the thumbnail group (tablist).',
      },
      { name: 'data-focus-within', description: 'Present when focus is inside the group.' },
    ],
  },
  {
    id: 'api-thumbnail',
    name: 'Thumbnail',
    description: 'A single thumbnail tab that activates the given index.',
    props: [
      {
        name: 'index',
        type: 'number',
        required: true,
        description: 'The index of the item this thumbnail navigates to.',
      },
      { name: 'children', type: 'Snippet', description: 'Thumbnail content, usually an `<img>`.' },
      restButton('tab `<button>`'),
    ],
    attributes: [
      { name: 'data-ramka-thumbnail', description: 'Always present on the thumbnail button.' },
      { name: 'data-active', description: 'Present when this thumbnail’s index is active.' },
      { name: 'data-index', description: 'The thumbnail index.' },
    ],
  },
  {
    id: 'api-thumbnail-strip',
    name: 'ThumbnailStrip',
    description:
      'Scroll linked thumbnail strip root. Always centers the active thumbnail on the midline (Photos style) and follows the Slides scroll position. Compose with ThumbnailStripTrack and Thumbnails. Discrete navigation (thumbnail pointer, keyboard, Previous / Next) scrubs the track with an animation; a pointer pick also runs an element scoped view transition on Slides. Flex, gap and thumbnail size stay consumer CSS.',
    props: [
      {
        name: 'scrubOnSelect',
        type: 'boolean',
        default: 'true',
        description:
          'Discrete navigation animates the track to the target index. When false, the strip follows the Slides jump through the scroll link. Skipped under `prefers-reduced-motion`.',
      },
      {
        name: 'selectViewTransition',
        type: 'boolean',
        default: 'true',
        description:
          'A pointer thumbnail pick runs an element scoped View Transition on Slides around the index change (stage crossfade). Falls back to a plain change when unsupported or under `prefers-reduced-motion`. Tune with `--lightbox-select-vt-duration` / `--lightbox-select-vt-easing` on Slides. Keyboard and Previous / Next keep an instant stage change.',
      },
      {
        name: 'wrapSelectCommit',
        type: '(commit: () => void, slides: HTMLElement | null, index: number) => void',
        description:
          'Optional wrapper around the index change so you can start your own animation (e.g. an indicator scrub) before `commit` jumps Slides. `commit` already includes the Slides view transition when `selectViewTransition` is on. Without it, `commit` runs immediately.',
      },
      { name: 'children', type: 'Snippet', description: 'The `Lightbox.ThumbnailStripTrack`.' },
      {
        name: 'indicator',
        type: 'Snippet',
        description:
          'Optional midline selection chrome, rendered after `children` inside the strip root (which is `position: relative`).',
      },
      restDiv('strip `<div>`'),
    ],
    attributes: [
      {
        name: 'data-ramka-thumbnail-strip',
        description: 'Always present on the thumbnail strip root.',
      },
      {
        name: 'data-scrubbing',
        description: 'Present while a discrete navigation scrub animation runs.',
      },
      {
        name: 'data-positioned',
        description:
          'Present once the track has been positioned against the Slides scroller. Absent in server rendered HTML; hide the strip until it lands to avoid a visible snap on pages that server render an open lightbox.',
      },
    ],
    cssVariables: [
      {
        name: '--lightbox-thumbnail-strip-travel',
        type: '<length>',
        description:
          'Translate distance that centers the last thumbnail. Written by the library on the ThumbnailStripTrack.',
      },
    ],
  },
  {
    id: 'api-thumbnail-strip-track',
    name: 'ThumbnailStripTrack',
    description:
      'Linked tablist track for ThumbnailStrip: a ThumbnailGroup that the strip moves (same keyboard and ARIA). The parent ThumbnailStrip writes the travel variable and the transform; flex, gap and thumbnail sizing are consumer CSS.',
    props: [{ name: 'children', type: 'Snippet', description: 'The `Lightbox.Thumbnail`s.' }, restDiv('track `<div>`')],
    attributes: [
      { name: 'data-ramka-thumbnail-strip-track', description: 'Always present on the track.' },
      {
        name: 'data-ramka-thumbnail-group',
        description: 'Always present, since the track is a ThumbnailGroup.',
      },
      { name: 'data-focus-within', description: 'Present when focus is inside the track.' },
    ],
  },
  {
    id: 'api-csp-provider',
    name: 'CSPProvider',
    description:
      'Provides the Content Security Policy nonce for the `<style>` tag ramka inserts. Wrap it around everything that renders lightbox parts, including detached Triggers outside any Root, and pass the same per request nonce your server puts in the `style-src` directive. When the browser still refuses the tag, the library falls back to a constructed stylesheet.',
    props: [
      {
        name: 'nonce',
        type: 'string',
        description:
          'The per request CSP nonce. Stamped on the `<style>` tag the lightbox inserts, so strict CSP pages keep the first paint rules.',
      },
      {
        name: 'children',
        type: 'Snippet',
        description: 'The part of the app that renders lightbox parts.',
      },
    ],
  },
];

/** The document-level view transition styling surface (id 'api-view-transition-document'). */
export const svelteDocumentViewTransitionApi: ApiPart = {
  id: 'api-view-transition-document',
  name: 'Document (view transitions)',
  description:
    'While a morph runs, ramka sets attributes on `<html>` and CSS variables on `::view-transition` so you can style the `::view-transition-*` pseudo elements. Cleared when the transition finishes.',
  attributes: [
    {
      name: 'data-ramka-view-transition',
      description: 'Present during a morph. Value is `opening` or `closing`.',
    },
    {
      name: 'data-ramka-crossfade',
      description:
        'Present while the morph dissolves trigger and item snapshots (Trigger `crossfade` is active for this phase). Absent for the default hard cut.',
    },
    {
      name: 'data-ramka-vt-preset',
      description:
        'Present during a morph. Value is the active `viewTransition` preset name (`default`, `snappy`, `relaxed`, `spring`).',
    },
    {
      name: 'data-ramka-vt-isolate',
      description:
        'Present during a morph only when the page declares its own `view-transition-name`s, which are then neutralized so they do not ride over the morph.',
    },
  ],
  cssVariables: [
    {
      name: '--lightbox-morph-radius-trigger',
      type: '<length>',
      description:
        'Trigger side border radius for the morph group clip. Written on `documentElement` during a morph; do not set it yourself.',
    },
    {
      name: '--lightbox-morph-radius-item',
      type: '<length>',
      description:
        'Item side border radius for the morph group clip. Written on `documentElement` during a morph; do not set it yourself.',
    },
    {
      name: '--lightbox-morph-border-radius-from',
      type: '<length>',
      description:
        'Start border radius for the morph group clip, derived from the trigger and item radius pair by direction.',
    },
    {
      name: '--lightbox-morph-border-radius-to',
      type: '<length>',
      description: 'End border radius for the morph group clip, derived like `--lightbox-morph-border-radius-from`.',
    },
    {
      name: '--lightbox-morph-old-opacity',
      type: '<number>',
      description: 'Opacity of the old morph snapshot on the hard cut path (no crossfade).',
    },
    {
      name: '--lightbox-morph-new-opacity',
      type: '<number>',
      description: 'Opacity of the new morph snapshot on the hard cut path (1 on open, 0 on close).',
    },
    {
      name: '--lightbox-vt-duration',
      type: '<time>',
      description:
        'Morph and root snapshot duration from the `viewTransition` preset, set on `::view-transition` during a morph. Read it in document level `::view-transition-*` rules, e.g. `calc(var(--lightbox-vt-duration) * 0.5)`. Also written on the Portal host.',
    },
    {
      name: '--lightbox-vt-easing',
      type: '<easing-function>',
      description:
        'Easing for `::view-transition-group(lightbox-morph)` and the open crossfade, from the preset. Close crossfade uses `--lightbox-vt-crossfade-close-easing`.',
    },
    {
      name: '--lightbox-vt-crossfade-close-easing',
      type: '<easing-function>',
      description:
        'Easing of the close crossfade between trigger and item snapshots, used while `data-ramka-view-transition="closing"` and `data-ramka-crossfade` are set.',
    },
    {
      name: '--lightbox-vt-root-easing',
      type: '<easing-function>',
      description: 'Easing for the root snapshot fade (`::view-transition-old(root)` / `::view-transition-new(root)`).',
    },
  ],
};

/** Context getters, ids 'api-get-lightbox', 'api-get-trigger', 'api-get-item', 'api-get-stage' (only those that are actually exported). */
export const svelteContextApi: ApiPart[] = [
  {
    id: 'api-get-lightbox',
    name: 'getLightbox',
    description:
      'Reads the enclosing Root’s state during component initialisation. Use it to build custom chrome that reads or drives the lightbox. Throws outside a Root.',
    props: [
      {
        name: '(return)',
        type: 'LightboxState',
        description:
          'Read-only reactive state of the Root: `open`, `index`, `count`, `loop`, `dir`, `caption`, `canPrev`, `canNext`, `zoomed`, `pulling`, `pullDismissing`, plus `show(index)`, `close()` and `go(index, source?)`.',
      },
    ],
  },
  {
    id: 'api-get-trigger',
    name: 'getTrigger',
    description:
      'Context from the enclosing Trigger. Use it in nested wrappers (e.g. a shared `TriggerImage` component) to attach `imageRef` / `morphRef` without threading the snippet argument. Returns `null` outside a Trigger.',
    props: [
      {
        name: '(return)',
        type: 'TriggerContext',
        description: 'Returns `{ open, active, imageRef, morphRef }`.',
      },
    ],
  },
  {
    id: 'api-get-item',
    name: 'getItem',
    description:
      'Context from the enclosing Item. Use it in nested wrappers to attach `imageRef` / `morphRef` or read `active` and `index`. Prefer `Lightbox.Media` for the common morph and placeholder host. Returns `null` outside an Item.',
    props: [
      {
        name: '(return)',
        type: 'ItemContext',
        description: 'Returns `{ index, active, imageRef, morphRef }`.',
      },
    ],
  },
  {
    id: 'api-get-stage',
    name: 'getStage',
    description:
      'Context from the enclosing Stage. Use it in nested wrappers to attach `morphRef` without threading the snippet argument. Returns `null` outside a Stage.',
    props: [
      {
        name: '(return)',
        type: 'StageContext',
        description: 'Returns `{ morphRef }`.',
      },
    ],
  },
  {
    id: 'api-get-media',
    name: 'getMedia',
    description:
      'Context from the enclosing Media. Use it in nested wrappers that need the morph and placeholder host element. Returns `null` outside a Media.',
    props: [
      {
        name: '(return)',
        type: 'MediaContext',
        description: 'Returns `{ element }`, the Media host element or `null` before mount.',
      },
    ],
  },
];

/** createHandle (id 'api-create-handle') and the Zoom instance API (id 'api-zoom-ref'). */
export const svelteImperativeApi: ApiPart[] = [
  {
    id: 'api-create-handle',
    name: 'LightboxHandle',
    description:
      'Imperative handle from `createHandle()`. Pass it to Root (and to detached Triggers). Calls before the Root mounts do nothing.',
    props: [
      {
        name: 'open',
        type: '(index?: number, options?: { triggerId?: string }) => void',
        description:
          'Open the lightbox. Optional `index` sets the active item (default: the current one). Pass `options.triggerId` to start the morph from the registered Trigger with that `id`.',
      },
      { name: 'close', type: '() => void', description: 'Close the lightbox.' },
      {
        name: 'goTo',
        type: '(index: number) => void',
        description: 'Navigate to an index (source: `imperative`). Does not open.',
      },
      { name: 'isOpen', type: 'boolean', description: 'Whether the bound Root is currently open.' },
    ],
  },
  {
    id: 'api-zoom-ref',
    name: 'Zoom instance',
    description: 'State and methods on the Zoom component instance from `bind:this`. The getters are reactive.',
    props: [
      { name: 'zoom', type: 'number', description: 'Current zoom level, `1` at rest.' },
      { name: 'maxZoom', type: 'number', description: 'Upper zoom limit for the current media.' },
      { name: 'offsetX', type: 'number', description: 'Horizontal pan offset in content pixels.' },
      { name: 'offsetY', type: 'number', description: 'Vertical pan offset in content pixels.' },
      {
        name: 'canZoomIn',
        type: 'boolean',
        description: 'Whether `zoomIn` would change anything.',
      },
      { name: 'canZoomOut', type: 'boolean', description: 'Whether the item is zoomed.' },
      { name: 'zoomIn', type: '() => void', description: 'Step zoom in by `zoomStep`.' },
      { name: 'zoomOut', type: '() => void', description: 'Step zoom out by `zoomStep`.' },
      {
        name: 'zoomTo',
        type: '(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }) => void',
        description: 'Zoom to an absolute level, optionally recentering on an offset from the center.',
      },
      {
        name: 'reset',
        type: '(rapid?: boolean) => void',
        description: 'Reset zoom and pan to the resting state.',
      },
      {
        name: 'changeOffsets',
        type: '(dx: number, dy: number) => void',
        description: 'Pan by content pixels; positive values move the content left and up.',
      },
    ],
  },
];
