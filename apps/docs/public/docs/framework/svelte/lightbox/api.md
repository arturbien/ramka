# API reference

Props, data attributes, and CSS variables for every [Lightbox](docs/framework/svelte/lightbox.md) part.

Each part spreads native attributes onto its element (listed as `...rest`). Custom props are listed below. Guides: [Composition](docs/framework/svelte/lightbox/composition.md), [View transitions](docs/framework/svelte/lightbox/view-transitions.md), [Gestures](docs/framework/svelte/lightbox/gestures.md).

## By concern

- **State**: [Root](docs/framework/svelte/lightbox/api.md#api-root), [createHandle](docs/framework/svelte/lightbox/api.md#api-create-handle)
- **Trigger / Item**: [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger), [Item](docs/framework/svelte/lightbox/api.md#api-item), [Media](docs/framework/svelte/lightbox/api.md#api-media)
- **Layout**: [Slides](docs/framework/svelte/lightbox/api.md#api-slides), [Slide](docs/framework/svelte/lightbox/api.md#api-slide)
- **View transitions**: [Root (VT props)](docs/framework/svelte/lightbox/api.md#api-root), [Document (VT)](docs/framework/svelte/lightbox/api.md#api-view-transition-document)
- **Shell**: [Portal](docs/framework/svelte/lightbox/api.md#api-portal), [Backdrop](docs/framework/svelte/lightbox/api.md#api-backdrop), [Content](docs/framework/svelte/lightbox/api.md#api-content)
- **Gestures**: [Content](docs/framework/svelte/lightbox/api.md#api-content), [Zoom](docs/framework/svelte/lightbox/api.md#api-zoom), [ZoomIn](docs/framework/svelte/lightbox/api.md#api-zoom-in), [ZoomOut](docs/framework/svelte/lightbox/api.md#api-zoom-out)
- **Chrome**: [Close](docs/framework/svelte/lightbox/api.md#api-close), [Previous](docs/framework/svelte/lightbox/api.md#api-previous), [Next](docs/framework/svelte/lightbox/api.md#api-next), [Counter](docs/framework/svelte/lightbox/api.md#api-counter), [Caption](docs/framework/svelte/lightbox/api.md#api-caption), [ThumbnailGroup](docs/framework/svelte/lightbox/api.md#api-thumbnail-group), [Thumbnail](docs/framework/svelte/lightbox/api.md#api-thumbnail), [ThumbnailStrip](docs/framework/svelte/lightbox/api.md#api-thumbnail-strip), [ThumbnailStripTrack](docs/framework/svelte/lightbox/api.md#api-thumbnail-strip-track)

### Root

Groups all parts of the lightbox and owns open state, active index, the view transition morph and the active zoom bridge. Renders no element of its own. Pass `handle` from `createHandle()` for imperative control and detached Triggers, or call `show(index)` and `close()` on the instance from `bind:this`. Prefer `onOpenChangeComplete` for work after the motion; use `scrollTriggerIntoView` so close morphs land on screen when the page scrolled while open.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Lightbox parts and page content (triggers typically live as children of Root). |
| handle | `LightboxHandle` |  | Imperative handle from `createHandle()`. Pass the same handle to detached `Lightbox.Trigger`s outside this Root. |
| open | `boolean` | `false` | Open state, bindable: use `bind:open` to read and write it, or pass a plain value for a one way initial state. Replaces React’s `open` / `defaultOpen` pair. |
| onOpenChange | `(open: boolean) => void` |  | Called when open state changes (immediately, before enter and exit animations finish). Prefer this for syncing URL state or stores. |
| onOpenChangeComplete | `(open: boolean) => void` |  | Called when the open or close transition settles. Receives `true` after open completes, `false` after close completes. Prefer this for cleanup and focus management. |
| index | `number` | `0` | Active index, bindable: use `bind:index` to read and write it. Replaces React’s `value` / `defaultValue` pair. |
| onValueChange | `(value: number, meta: { source: NavigationSource }) => void` |  | Callback when the active index changes, with the source of the navigation. |
| count | `number` |  | Total number of items, used until the mounted `Lightbox.Item`s have registered themselves. Items register when they mount in the browser, never during server rendering, so a page that server renders an open lightbox paints `Lightbox.Counter` as "n / 0" (and disables `Lightbox.Next` / `Lightbox.Previous` at the boundary when `loop` is off) until hydration. Pass the item total to make that first paint correct. Once any item mounts the live registry takes over and this prop is ignored. |
| loop | `boolean` | `false` | Wrap navigation at boundaries. |
| dir | `TextDirection` | `'ltr' (behavior); no `dir` attribute is written when omitted` | Reading direction. `'rtl'` mirrors slide navigation, thumbnail strip travel and the horizontal arrow keys (so `ArrowLeft` advances). The direction is written to the `Lightbox.Portal` host as a `dir` attribute, so CSS follows it across the portal boundary; that also runs one RTL lightbox inside an LTR page. Pass it whenever the surrounding UI is RTL: behavior falls back to `'ltr'` without it. In development `Lightbox.Slides` warns when its computed direction disagrees. |
| viewTransition | `boolean \| MorphPreset` | `true` | Morph between trigger and lightbox item through the View Transitions API. On by default: clicking a trigger morphs into the fullscreen item, and close morphs back. Pass `false` to open and close without a morph. Without View Transitions support or under `prefers-reduced-motion` the lightbox opens and closes without a morph. A preset name picks the motion: `'default'` (360ms, same as `true`), `'snappy'` (340ms, quicker launch), `'relaxed'` (400ms, softer settle) or `'spring'` (450ms, critically damped). The preset drives the morph, the crossfade and the root fade together. |
| scrollTriggerIntoView | `ScrollTriggerIntoView` | `null` | Scroll the trigger the close morph will land on into the viewport, so close animations stay on screen. Accepts one option or an array. Each option has a `type`: `'onChange'` scrolls whenever the active index changes while open, `'onOpenComplete'` scrolls once the open transition finishes (invisible under the viewer, `'instant'` recommended), `'onClose'` scrolls just before the close morph. `behavior` is `'smooth'` (default) or `'instant'`; `block` and `inline` are `scrollIntoView` alignments (`'nearest'` default). Respects `morphTo`. |
| morphTo | `MorphTo` | `'active'` | Which trigger receives the morph on close. `'active'` morphs to the trigger of the current active index (no morph when there is none). `'origin'` always morphs back to the trigger that opened the lightbox. `'closest'` uses the active index trigger if it exists, otherwise the nearest registered trigger. |
| awaitImageDecode | `boolean \| number` | `true` | How long the open morph waits for the destination image to decode before starting. `true` waits up to 200ms, `false` starts immediately, a number waits up to that many milliseconds. Skipped when the trigger thumbnail is painted as a placeholder into `Lightbox.Media`. Runs before `onBeforeOpen`. Only relevant when `viewTransition` is enabled. |
| onBeforeOpen | `(ctx: BeforeOpenContext) => void \| Promise<void>` |  | Called after the open morph has mounted the lightbox and finished any `awaitImageDecode` wait, and before the View Transition starts. Use it to await custom media readiness (iframe `load`, video `loadeddata`). May return a Promise: the morph waits for it, so bound your own timeout. `ctx.destination` is the morph target, `ctx.signal` aborts when a newer open or close supersedes this one. Only relevant when `viewTransition` is enabled. |
| onBeforeClose | `(ctx: BeforeCloseContext) => void` |  | Called synchronously just before close commits and before the old snapshot is captured. Use it to freeze custom media (`video.pause()`, stop a rAF loop) so the close morph does not catch a frame mid change. Cannot delay close; return values are ignored. |

### Trigger

A `<button>` that opens the lightbox at a given index and is the morph source. Carries the dialog trigger semantics: `aria-haspopup="dialog"`, `aria-controls` pointing at the dialog while open, and `aria-expanded` set only on the trigger that opened it. Pass `handle` to use it outside Root. Prefer the snippet form of `children` to attach `imageRef` / `morphRef`.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` |  | Item index this trigger opens. |
| id | `string` |  | Stable id for this trigger. Needed for `handle.open(index, { triggerId })` association. Also applied as the DOM `id`. |
| handle | `LightboxHandle` |  | Handle from `createHandle()`. Pass the same handle as Root to use this Trigger outside the Root tree (detached trigger). |
| crossfade | `Crossfade` |  | Crossfade between trigger and item snapshots during the morph. Omit for a hard cut, ideal when trigger and item show the same image at the same aspect. `'both'` crossfades on open and close, `'open'` only when opening, `'close'` only when closing (e.g. poster to live video). Sets `data-crossfade` on the trigger and `data-ramka-crossfade` on `<html>` during phases that dissolve. |
| children | `Snippet<[{ open: boolean; active: boolean; imageRef: ImageRef; morphRef: MorphRef }]>` |  | Trigger content. The snippet receives `imageRef` / `morphRef` attachments (use `{@attach imageRef}` on the thumbnail `<img>` and `{@attach morphRef}` on the morph element) plus `open` / `active` state. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-trigger` | Always present on the trigger element. |
| `data-popup-open` | Present when the corresponding lightbox is open. |
| `data-active` | Present when this trigger’s index is the active item. |
| `data-morph-target` | Present while the lightbox is open on the element the close morph will land on: the node from `morphRef` or `imageRef` when attached, otherwise the first `[data-ramka-morph]`, `[data-ramka-media]`, `img` or `video` inside the trigger, else the button itself. Style against this attribute directly; do not assume it lives on the button. |
| `data-crossfade` | Reflects the `crossfade` prop: `open`, `close` or `both`. |
| `data-ramka-morph` | Not set by the library. Put it on a descendant of the trigger to make that element the morph source without `morphRef`. |

### Portal

Moves Backdrop and Content into a host element (default `document.body`). Pass `container` and `keepMounted` here. With `keepMounted`, give the Portal host a stacking level yourself (e.g. `class="relative z-[1]"`).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| container | `HTMLElement \| ShadowRoot \| null` | `document.body` | Where to mount the portal host. Pass `null` to render the host in place (no portal). |
| keepMounted | `boolean` | `false` | Keep Portal, Backdrop and Content mounted while the lightbox is closed. Closed nodes stay in the DOM but are inert and hidden (`visibility: hidden`, `pointer-events: none`). Useful for a warm reopen of expensive destinations such as map iframes. |
| children | `Snippet` |  | Backdrop, Content and anything else that belongs in the portal. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the portal host `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-portal` | Always present on the portal host element. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-vt-duration` | `<time>` | Duration of the Root’s `viewTransition` preset, always written on the Portal host so skin fades inside the portal can follow the preset’s clock even when no morph runs, e.g. `transition: opacity var(--lightbox-vt-duration, 360ms) ease-out`. Do not set it yourself. |
| `--lightbox-vt-easing` | `<easing-function>` | Morph easing of the active preset, written on the Portal host like `--lightbox-vt-duration`. |
| `--lightbox-vt-root-easing` | `<easing-function>` | Root snapshot fade easing of the active preset, written on the Portal host. A good default for skin backdrop and content fades. |

### Backdrop

Optional scrim (place inside `Lightbox.Portal`, typically beside Content). Click closes the lightbox. Tracks pull to dismiss progress.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the backdrop `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-backdrop` | Always present on the backdrop element. |
| `data-open` | Present while the lightbox is open. |
| `data-closed` | Present while the lightbox is closed (still rendered). |
| `data-pulling` | Present while pull to dismiss is active (mirrors Content). |
| `data-pull-snapping` | Present while a cancelled pull springs back (mirrors Content). |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-pull-progress` | `<number>` | Same progress variable as Content, inherited from the Portal host. |
| `--lightbox-pull-snap-duration` | `<time>` | Same snap back duration variable as Content, inherited from the Portal host. |
| `--lightbox-pull-snap-easing` | `<easing-function>` | Same snap back easing variable as Content, inherited from the Portal host. |

### Content

Dialog surface (`role="dialog"`, `aria-modal`). Provide an accessible name through `aria-label` or `aria-labelledby` (the library warns in development when it is missing). Place inside `Lightbox.Portal`. Owns focus trap, Escape, scroll lock and pull to dismiss; a click on the surface itself (not its children) closes. When `Lightbox.Stage` is mounted, arrow, Home and End navigation, zoom shortcuts (unmodified `+`, `-`, `0`) and pull are scoped to Stage; otherwise Content is the stage. Arrow keys pan instead of navigate while the active Zoom is above 1×.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| pullToClose | `boolean` | `true` | Enable pull to close on touch and trackpad wheel. Starts from anywhere in Stage (or Content when Stage is omitted), except buttons, links, form fields and elements marked `data-ramka-no-pull`. Publishes `data-pulling`, `data-pull-snapping`, `data-pull-dismissing` and `--lightbox-pull-progress` while active. |
| children | `Snippet` |  | Dialog contents (close, slides and items, chrome). |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the dialog `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-content` | Always present on the dialog surface. |
| `data-open` | Present while the lightbox is open. |
| `data-closed` | Present while the lightbox is closed (still rendered). |
| `data-pulling` | Present while a pull to dismiss drag is in progress. |
| `data-pull-snapping` | Present while a cancelled pull springs back to rest. `data-pulling` is dropped on release so chrome can transition; this latch keeps pull only layout until the item is back. |
| `data-pull-dismissing` | Present while the dismiss animation runs after crossing the threshold. |
| `data-zooming` | Present during an active pinch or pan on the active Zoom (blocks pull to dismiss). |
| `data-zoomed` | Present when the active zoom is greater than its minimum. |
| `data-ramka-no-pull` | Not set by the library. Put it on a descendant to keep pull to dismiss from starting there. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-pull-progress` | `<number>` | 0 at rest, 1 at the dismiss threshold. Written on the Portal host (or on Content when there is no Portal) and inherited. Drive backdrop and content opacity from this. |
| `--lightbox-pull-snap-duration` | `<time>` | Duration of the pull to dismiss snap back, published only while the cancelled pull springs back to rest. Use it in your transition so progress driven visuals stay in step with the item, e.g. `transition: opacity var(--lightbox-pull-snap-duration, 300ms) var(--lightbox-pull-snap-easing, ease)`. |
| `--lightbox-pull-snap-easing` | `<easing-function>` | Easing of the pull to dismiss snap back (a velocity aware spring, published only during the spring back). Pair with `--lightbox-pull-snap-duration`. |
| `--lightbox-zoom-progress` | `<number>` | 0 at minimum zoom, 1 once zoom has risen one step above it (e.g. 2× when the minimum is 1). Written on Content from the active `Lightbox.Zoom` and cleared at rest. Drive sibling dim or blur from this, e.g. `opacity: calc(1 - var(--lightbox-zoom-progress, 0))`. |

### Stage

Optional media interaction surface inside Content. Scopes pull to dismiss, Zoom pan viewport geometry, arrow, Home and End navigation, and zoom shortcuts to the media pane. Place side panels as siblings of Stage under Content. When omitted, Content itself is the stage. Attach `morphRef` from the snippet when the morph should capture this surface (or a descendant) instead of the active item.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet<[{ morphRef: MorphRef }]>` |  | Stage content. The snippet receives `morphRef`; `{@attach morphRef}` on an element to morph it instead of the active item. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the stage `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-stage` | Always present on the media interaction stage. |

### Slides

Default layout: horizontal snap carousel wired to the active index. Emits `role="group"`; pass a translated `aria-roledescription="carousel"` plus an `aria-label` or `aria-labelledby` naming the gallery. Gates Item contents through `preload`; put Slide, Item, Zoom and Media inside. While zoomed or pulling, the scroller is locked so gestures do not fight the scroll.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| preload | `number` | `1` | How many slides on each side of the active one render their `Lightbox.Item` content. Slide boxes are always present so the scroll extent is correct. Content stays mounted once rendered. |
| ssrSlideShift | `boolean` | `false` | First paint slide positioning for pages that server render an open lightbox. A scroll offset cannot be serialized into HTML, so such pages otherwise paint slide 0 until hydration. While this is on, the server HTML translates every slide by the active index times `(100% + gap)` so the active slide fills the scrollport; hydration swaps the real scroll offset in. Only for scrollport wide slides. If the track has a `gap`, mirror it into `--lightbox-ssr-slide-gap`. Without it, the active item still carries `scroll-initial-target` for engines that support it. |
| children | `Snippet` |  | The `Lightbox.Slide`s. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the scrollport `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-slides` | Always present on the slides scrollport. |
| `data-active-index` | Current active index. |
| `data-direction` | `forward` or `backward`. |
| `data-orientation` | Always `horizontal`. |
| `data-locked` | Present while the active item is zoomed or being pulled; the scroller stops scrolling. |
| `data-scrolling` | Present while the scroller is moving. |
| `data-ssr-shift` | Present in server rendered HTML while the `ssrSlideShift` transform is applied. While set, every slide is translated so the active one fills the scrollport, and the scrollport is clipped so a swipe before hydration cannot reveal empty positions. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-ssr-slide-gap` | `<length>` | Set it yourself to the track `gap` when using `ssrSlideShift`. Defaults to `0px`. |
| `--lightbox-select-vt-duration` | `<time>` | Duration of the element scoped view transition on Slides when a thumbnail is picked with the pointer (`selectViewTransition` on ThumbnailStrip). Set it on Slides or a parent. Defaults to `0.4s`. |
| `--lightbox-select-vt-easing` | `<easing-function>` | Easing of that thumbnail select view transition. Defaults to `cubic-bezier(0.22, 1, 0.36, 1)`. |

### Slide

One snap aligned slide box inside Slides. Snap alignment is built in and the default box is full width (`flex: 0 0 100%`); override `flex`, `width` or `min-width` through `class` or `style` for other layouts. Place a `Lightbox.Item` (and typically Zoom and Media) inside. Put resting chrome and safe area insets as padding on Slide so Item and Zoom fill the content box.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Usually one `Lightbox.Item`. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the slide `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-slide` | Always present on the slide element. |

### Item

A single lightbox item. Registers its caption and morph and placeholder refs. ARIA adapts: it is a `tabpanel` wired to its `Lightbox.Thumbnail` tab when a ThumbnailGroup is present, otherwise `role="group"`, which needs a translated `aria-roledescription="slide"` and an `aria-label` carrying the position from you. Inactive items are `inert`. Prefer nesting `Lightbox.Media` around the destination `<img>` or `<video>`. Outside Slides every item renders its content; inside Slides, `preload` gates it.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` |  | The index of this item in the collection. |
| caption | `string \| Snippet` |  | Optional caption for this item, displayed by `Lightbox.Caption`. |
| children | `Snippet<[{ index: number; active: boolean; visible: boolean; morphRef: MorphRef; imageRef: ImageRef }]>` |  | Item content. The snippet receives per item state (`visible` is false outside the `preload` window) plus `imageRef` / `morphRef`. Attach `imageRef` to your `<img>` so the open transition bridges the blank frame with the trigger thumbnail. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the item `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-item` | Always present on the item element. |
| `data-active` | Present when this item is the active index. |
| `data-index` | The item index. |
| `data-skip-fade` | Set during the open morph; use it to suppress your own entrance fades on the destination item. |
| `data-ssr-active` | Present only in server rendered HTML, on the active item. Carries `scroll-initial-target: nearest`, so engines that support it scroll Slides to the active slide before first paint. |

### Zoom

Pinch, wheel, double click and keyboard zoom and pan surface. Fills its host and is a CSS size container for nested Media. Does not clip; clipping belongs on Content or chrome so zoomed media can escape the resting box. Prefer Zoom, then Media, then `img` or `video`. Publishes to the Root’s active zoom bridge so ZoomIn and ZoomOut in toolbar chrome target the active slide. Methods are on the instance from `bind:this` (see Zoom instance).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet<[{ zoom: number; maxZoom: number; offsetX: number; offsetY: number; canZoomIn: boolean; canZoomOut: boolean; dragging: boolean }]>` |  | Zoomable content. The snippet receives the current zoom state. |
| minZoom | `number` | `1` | Minimum zoom level. |
| maxZoom | `number` | `undefined (auto)` | Maximum zoom level. When not set, computed from the first `<img>` child’s natural size against the container size. Falls back to 4 without image dimensions. |
| zoomStep | `number` | `2` | Multiplier for button and keyboard zoom steps. |
| scrollToZoom | `boolean` | `false` | Enable zoom through bare scroll or trackpad without Ctrl. |
| wheelSensitivity | `number` | `100` | Wheel and trackpad zoom sensitivity factor. |
| keyboardPanDistance | `number` | `50` | Keyboard pan distance in content px per keypress. |
| doubleClickDelay | `number` | `300` | Max delay between clicks for double click detection (ms). |
| onZoomChange | `(zoom: number) => void` |  | Callback when the zoom level changes. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the zoom `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom` | Always present on the zoom container. |
| `data-zoom` | Present when zoom is above the minimum. |
| `data-dragging` | Present while panning with a pointer. |
| `data-ramka-zoom-content` | Always present on the inner wrapper that receives the zoom transform. |

### Media

Sized destination media host: morph target and placeholder canvas container. `width` and `height` give it a fit box; direct `img` and `video` children fill it. Cosmetics (radius, colors, `object-fit`) stay yours. Prefer Zoom, then Media, then `img` or `video`. Reads the size of the first `<img>` or `<video>` when `width` and `height` are omitted.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| width | `number` |  | Intrinsic pixel width of the media. With `height`, applies a fit box. When omitted, taken from the child `<img>` `width` attribute or natural size, or the `<video>` size. |
| height | `number` |  | Intrinsic pixel height of the media. |
| children | `Snippet` |  | The destination `<img>` or `<video>`. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the media `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-media` | Always present on the media host. |
| `data-placeholder` | Present while the open morph placeholder canvas is bridging. |
| `data-width` | The resolved fit box width, present when both dimensions are known. |
| `data-height` | The resolved fit box height, present when both dimensions are known. |

### Close

Button that closes the lightbox. Ships no label: give it visible text or pass `aria-label` / `aria-labelledby` in your language (the library warns in development when it is nameless).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Button content. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-close` | Always present on the close button. |

### Previous

Navigate to the previous item. Disabled at the start when `loop` is false.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Button content. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-previous` | Always present on the previous button. |
| `data-disabled` | Present when navigation is unavailable. |

### Next

Navigate to the next item. Disabled at the end when `loop` is false.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Button content. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-next` | Always present on the next button. |
| `data-disabled` | Present when navigation is unavailable. |

### ZoomIn

Increments zoom. Works inside Zoom, or as global chrome through the active slide zoom bridge.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Button content. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom-in` | Always present on the zoom in button. |
| `data-disabled` | Present when zooming in is unavailable. |

### ZoomOut

Decrements zoom. Works inside Zoom, or as global chrome through the active slide zoom bridge.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Button content. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom-out` | Always present on the zoom out button. |
| `data-disabled` | Present when zooming out is unavailable. |

### Counter

Shows the active position (e.g. "1 / 12") in an `aria-live` region.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet<[{ current: number; total: number }]>` | `renders "1 / 12"` | Snippet for a custom counter format. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the counter `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-counter` | Always present on the counter element. |

### Caption

Renders the active item’s caption from the Item caption registry, in an `aria-live` region.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | Fallback content, rendered only while no item has registered. Items register when they mount in the browser, so a server rendered open lightbox paints an empty caption until then. Pass the active item’s caption here to make the first paint correct; once any item registers, the registry wins. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the caption `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-caption` | Always present on the caption element. |
| `data-has-caption` | Present when the active item has a caption. |

### ThumbnailGroup

Accessible tablist of thumbnails with arrow, Home and End keyboard support. Without a ThumbnailStrip, the active thumbnail scrolls itself to the center of its parent.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | The `Lightbox.Thumbnail`s. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the tablist `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail-group` | Always present on the thumbnail group (tablist). |
| `data-focus-within` | Present when focus is inside the group. |

### Thumbnail

A single thumbnail tab that activates the given index.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` |  | The index of the item this thumbnail navigates to. |
| children | `Snippet` |  | Thumbnail content, usually an `<img>`. |
| ...rest | `HTMLButtonAttributes` |  | Any other attribute or event handler is spread onto the tab `<button>` element, including `class`, `style` and `aria-*`. An `onclick` that calls `preventDefault()` skips the built-in action. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail` | Always present on the thumbnail button. |
| `data-active` | Present when this thumbnail’s index is active. |
| `data-index` | The thumbnail index. |

### ThumbnailStrip

Scroll linked thumbnail strip root. Always centers the active thumbnail on the midline (Photos style) and follows the Slides scroll position. Compose with ThumbnailStripTrack and Thumbnails. Discrete navigation (thumbnail pointer, keyboard, Previous / Next) scrubs the track with an animation; a pointer pick also runs an element scoped view transition on Slides. Flex, gap and thumbnail size stay consumer CSS.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| scrubOnSelect | `boolean` | `true` | Discrete navigation animates the track to the target index. When false, the strip follows the Slides jump through the scroll link. Skipped under `prefers-reduced-motion`. |
| selectViewTransition | `boolean` | `true` | A pointer thumbnail pick runs an element scoped View Transition on Slides around the index change (stage crossfade). Falls back to a plain change when unsupported or under `prefers-reduced-motion`. Tune with `--lightbox-select-vt-duration` / `--lightbox-select-vt-easing` on Slides. Keyboard and Previous / Next keep an instant stage change. |
| wrapSelectCommit | `(commit: () => void, slides: HTMLElement \| null, index: number) => void` |  | Optional wrapper around the index change so you can start your own animation (e.g. an indicator scrub) before `commit` jumps Slides. `commit` already includes the Slides view transition when `selectViewTransition` is on. Without it, `commit` runs immediately. |
| children | `Snippet` |  | The `Lightbox.ThumbnailStripTrack`. |
| indicator | `Snippet` |  | Optional midline selection chrome, rendered after `children` inside the strip root (which is `position: relative`). |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the strip `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail-strip` | Always present on the thumbnail strip root. |
| `data-scrubbing` | Present while a discrete navigation scrub animation runs. |
| `data-positioned` | Present once the track has been positioned against the Slides scroller. Absent in server rendered HTML; hide the strip until it lands to avoid a visible snap on pages that server render an open lightbox. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-thumbnail-strip-travel` | `<length>` | Translate distance that centers the last thumbnail. Written by the library on the ThumbnailStripTrack. |

### ThumbnailStripTrack

Linked tablist track for ThumbnailStrip: a ThumbnailGroup that the strip moves (same keyboard and ARIA). The parent ThumbnailStrip writes the travel variable and the transform; flex, gap and thumbnail sizing are consumer CSS.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `Snippet` |  | The `Lightbox.Thumbnail`s. |
| ...rest | `HTMLAttributes<HTMLDivElement>` |  | Any other attribute or event handler is spread onto the track `<div>` element, including `class`, `style` and `aria-*`. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail-strip-track` | Always present on the track. |
| `data-ramka-thumbnail-group` | Always present, since the track is a ThumbnailGroup. |
| `data-focus-within` | Present when focus is inside the track. |

### CSPProvider

Provides the Content Security Policy nonce for the `<style>` tag ramka inserts. Wrap it around everything that renders lightbox parts, including detached Triggers outside any Root, and pass the same per request nonce your server puts in the `style-src` directive. When the browser still refuses the tag, the library falls back to a constructed stylesheet.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| nonce | `string` |  | The per request CSP nonce. Stamped on the `<style>` tag the lightbox inserts, so strict CSP pages keep the first paint rules. |
| children | `Snippet` |  | The part of the app that renders lightbox parts. |

### Document (view transitions)

While a morph runs, ramka sets attributes on `<html>` and CSS variables on `::view-transition` so you can style the `::view-transition-*` pseudo elements. Cleared when the transition finishes.

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-view-transition` | Present during a morph. Value is `opening` or `closing`. |
| `data-ramka-crossfade` | Present while the morph dissolves trigger and item snapshots (Trigger `crossfade` is active for this phase). Absent for the default hard cut. |
| `data-ramka-vt-preset` | Present during a morph. Value is the active `viewTransition` preset name (`default`, `snappy`, `relaxed`, `spring`). |
| `data-ramka-vt-isolate` | Present during a morph only when the page declares its own `view-transition-name`s, which are then neutralized so they do not ride over the morph. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-morph-radius-trigger` | `<length>` | Trigger side border radius for the morph group clip. Written on `documentElement` during a morph; do not set it yourself. |
| `--lightbox-morph-radius-item` | `<length>` | Item side border radius for the morph group clip. Written on `documentElement` during a morph; do not set it yourself. |
| `--lightbox-morph-border-radius-from` | `<length>` | Start border radius for the morph group clip, derived from the trigger and item radius pair by direction. |
| `--lightbox-morph-border-radius-to` | `<length>` | End border radius for the morph group clip, derived like `--lightbox-morph-border-radius-from`. |
| `--lightbox-morph-old-opacity` | `<number>` | Opacity of the old morph snapshot on the hard cut path (no crossfade). |
| `--lightbox-morph-new-opacity` | `<number>` | Opacity of the new morph snapshot on the hard cut path (1 on open, 0 on close). |
| `--lightbox-vt-duration` | `<time>` | Morph and root snapshot duration from the `viewTransition` preset, set on `::view-transition` during a morph. Read it in document level `::view-transition-*` rules, e.g. `calc(var(--lightbox-vt-duration) * 0.5)`. Also written on the Portal host. |
| `--lightbox-vt-easing` | `<easing-function>` | Easing for `::view-transition-group(lightbox-morph)` and the open crossfade, from the preset. Close crossfade uses `--lightbox-vt-crossfade-close-easing`. |
| `--lightbox-vt-crossfade-close-easing` | `<easing-function>` | Easing of the close crossfade between trigger and item snapshots, used while `data-ramka-view-transition="closing"` and `data-ramka-crossfade` are set. |
| `--lightbox-vt-root-easing` | `<easing-function>` | Easing for the root snapshot fade (`::view-transition-old(root)` / `::view-transition-new(root)`). |

## Types

Helper types you will see in callbacks and snippets, exported on the `Lightbox` namespace (`Lightbox.NavigationSource` and so on):

- `NavigationSource`: `'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative'` . Second argument to Root `onValueChange`. Handle `open` /`goTo` use `'imperative'`; scroll-driven Slides use `'scroll'`.
- `Crossfade`: `'open' | 'close' | 'both'` for Trigger `crossfade`. See [View transitions: crossfade](docs/framework/svelte/lightbox/view-transitions.md#crossfade).
- `MorphTo`: `'active' | 'origin' | 'closest'` for Root `morphTo`, and `MorphPreset`: `'default' | 'snappy' | 'relaxed' | 'spring'` for Root `viewTransition`.
- Snippet state types such as `TriggerContext` and `ItemContext` (`active`, `visible`, refs) are documented on [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger) / [Item](docs/framework/svelte/lightbox/api.md#api-item).

## Context

Context getters for nested wrapper components, the Svelte form of the React hooks. Call them during component initialization inside the matching part.

### getLightbox

Reads the enclosing Root’s state during component initialisation. Use it to build custom chrome that reads or drives the lightbox. Throws outside a Root.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `LightboxState` |  | Read-only reactive state of the Root: `open`, `index`, `count`, `loop`, `dir`, `caption`, `canPrev`, `canNext`, `zoomed`, `pulling`, `pullDismissing`, plus `show(index)`, `close()` and `go(index, source?)`. |

### getTrigger

Context from the enclosing Trigger. Use it in nested wrappers (e.g. a shared `TriggerImage` component) to attach `imageRef` / `morphRef` without threading the snippet argument. Returns `null` outside a Trigger.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `TriggerContext` |  | Returns `{ open, active, imageRef, morphRef }`. |

### getItem

Context from the enclosing Item. Use it in nested wrappers to attach `imageRef` / `morphRef` or read `active` and `index`. Prefer `Lightbox.Media` for the common morph and placeholder host. Returns `null` outside an Item.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `ItemContext` |  | Returns `{ index, active, imageRef, morphRef }`. |

### getStage

Context from the enclosing Stage. Use it in nested wrappers to attach `morphRef` without threading the snippet argument. Returns `null` outside a Stage.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `StageContext` |  | Returns `{ morphRef }`. |

### getMedia

Context from the enclosing Media. Use it in nested wrappers that need the morph and placeholder host element. Returns `null` outside a Media.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `MediaContext` |  | Returns `{ element }`, the Media host element or `null` before mount. |

## Imperative handles

Use `Lightbox.createHandle()` on Root (and optional detached Triggers). Zoom exposes its controls through `bind:this`.

### LightboxHandle

Imperative handle from `createHandle()`. Pass it to Root (and to detached Triggers). Calls before the Root mounts do nothing.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| open | `(index?: number, options?: { triggerId?: string }) => void` |  | Open the lightbox. Optional `index` sets the active item (default: the current one). Pass `options.triggerId` to start the morph from the registered Trigger with that `id`. |
| close | `() => void` |  | Close the lightbox. |
| goTo | `(index: number) => void` |  | Navigate to an index (source: `imperative`). Does not open. |
| isOpen | `boolean` |  | Whether the bound Root is currently open. |

### Zoom instance

State and methods on the Zoom component instance from `bind:this`. The getters are reactive.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| zoom | `number` |  | Current zoom level, `1` at rest. |
| maxZoom | `number` |  | Upper zoom limit for the current media. |
| offsetX | `number` |  | Horizontal pan offset in content pixels. |
| offsetY | `number` |  | Vertical pan offset in content pixels. |
| canZoomIn | `boolean` |  | Whether `zoomIn` would change anything. |
| canZoomOut | `boolean` |  | Whether the item is zoomed. |
| zoomIn | `() => void` |  | Step zoom in by `zoomStep`. |
| zoomOut | `() => void` |  | Step zoom out by `zoomStep`. |
| zoomTo | `(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }) => void` |  | Zoom to an absolute level, optionally recentering on an offset from the center. |
| reset | `(rapid?: boolean) => void` |  | Reset zoom and pan to the resting state. |
| changeOffsets | `(dx: number, dy: number) => void` |  | Pan by content pixels; positive values move the content left and up. |
