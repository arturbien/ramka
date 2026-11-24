# API reference

Props, data attributes, and CSS variables for every [Lightbox](docs/lightbox.md) part. Tables are generated from package TypeScript + JSDoc.

Each part accepts native element props for its default host (via Base UI `render` where noted). Custom props are listed below. Guides: [Composition](docs/lightbox/composition.md), [View transitions](docs/lightbox/view-transitions.md), [Gestures](docs/lightbox/gestures.md).

## By concern

- **State**: [Root](docs/lightbox/api.md#api-root), [createHandle](docs/lightbox/api.md#api-create-handle)
- **Trigger / Item**: [Trigger](docs/lightbox/api.md#api-trigger), [Item](docs/lightbox/api.md#api-item), [Media](docs/lightbox/api.md#api-media)
- **Layout**: [Slides](docs/lightbox/api.md#api-slides), [Slide](docs/lightbox/api.md#api-slide)
- **View transitions**: [Root (VT props)](docs/lightbox/api.md#api-root), [Document (VT)](docs/lightbox/api.md#api-view-transition-document)
- **Shell**: [Portal](docs/lightbox/api.md#api-portal), [Backdrop](docs/lightbox/api.md#api-backdrop), [Content](docs/lightbox/api.md#api-content)
- **Gestures**: [Content](docs/lightbox/api.md#api-content), [Zoom](docs/lightbox/api.md#api-zoom), [ZoomIn](docs/lightbox/api.md#api-zoom-in), [ZoomOut](docs/lightbox/api.md#api-zoom-out)
- **Chrome**: [Close](docs/lightbox/api.md#api-close), [Previous](docs/lightbox/api.md#api-previous), [Next](docs/lightbox/api.md#api-next), [Counter](docs/lightbox/api.md#api-counter), [Caption](docs/lightbox/api.md#api-caption), [ThumbnailGroup](docs/lightbox/api.md#api-thumbnail-group), [Thumbnail](docs/lightbox/api.md#api-thumbnail), [ThumbnailStrip](docs/lightbox/api.md#api-thumbnail-strip), [ThumbnailStripTrack](docs/lightbox/api.md#api-thumbnail-strip-track)

### Root

Groups all parts of the lightbox and owns open state, the active item (value, by itemId), view-transition morph, scroll locking, and the active-zoom bridge. Pass handle from Lightbox.createHandle() for imperative control and detached Triggers. Prefer onOpenChangeComplete for post-motion work; use scrollTriggerIntoView so close morphs land on-screen when the page scrolled while open.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `ReactNode` |  | Lightbox parts and page content (triggers typically live as children of Root). A viewer serving many galleries reads the open's payload with `useLightboxPayload()`. |
| handle | `LightboxHandle<Payload>` |  | Imperative handle from `Lightbox.createHandle()`. Pass the same handle to detached `Lightbox.Trigger`s outside this Root. |
| revealTrigger | `LightboxRevealTrigger<Payload>` |  | Bring an unmounted trigger back so the close morph has somewhere to land — for triggers inside a virtualized list, whose rows unmount when they scroll away. Called with the active item's `itemId` when the close target has no mounted trigger. Scroll the row that holds the item into view here, e.g. `virtualizer.scrollToIndex(row)`. - On close (`reason: 'close'`) the morph waits for the trigger to mount and its position to settle, up to a few frames, then morphs (or fades if it never mounts). Return a Promise to wait for your own signal instead (bound it yourself; `signal` aborts if a newer open/close wins), or `false` when the item can't be revealed, to skip the wait. - While open (`reason: 'change'`) it is called after navigation settles, only when `scrollTriggerIntoView` includes `onChange` — the same moments Root scrolls a mounted trigger into view. Without view transitions nothing waits: the trigger is revealed and focus returns to it once it mounts. Use `behavior: 'instant'` scrolling; a smooth scroll outlasts the wait. |
| defaultPayload | `Payload` |  | Payload for a Root that starts open (`defaultOpen` / controlled `open`) — a deep link rendered from the URL. Later opens set the payload from the opening Trigger or `handle.open(itemId, { payload })`. Pair with `defaultValue` (or `value`) for the item, e.g. `params.photo`. |
| defaultOpen | `boolean` | `false` | Uncontrolled initial open state. |
| open | `boolean` |  | Controlled open state. |
| onOpenChange | `(open: boolean) => void` |  | Called when open state changes (immediately, before enter/exit animations finish). Prefer this for syncing URL state or stores. |
| onOpenChangeComplete | `(open: boolean) => void` |  | Called when the open/close transition settles. Receives `true` after open completes, `false` after close completes. Prefer this for cleanup and focus management. |
| defaultValue | `string` | `the first item` | Uncontrolled initial active item: its `itemId`. |
| value | `string` |  | Controlled active item: its `itemId`. |
| onValueChange | `(value: string, details: { index: number; source: NavigationSource }) => void` |  | Called when the active item changes, with its `itemId` — the stable key to write to a URL. `details.index` is its position in the viewer. |
| itemIds | `readonly string[]` |  | The gallery's `itemId`s in viewer order, for a page that server-renders an open lightbox (a deep link). Items register in effects, which never run during server rendering, so without this the first paint can't know where `value` sits: `Lightbox.Counter`, `Lightbox.Caption`, the Previous/Next boundaries and the slide position stay wrong until hydration. Once items mount the live registry takes over and this prop is ignored, so it can't drift. |
| loop | `boolean` | `false` | Wrap navigation at boundaries. |
| dir | `TextDirection` | `'ltr' (behavior); no `dir` attribute is written when omitted` | Reading direction. `'rtl'` mirrors slide navigation, thumbnail-strip travel, and the horizontal arrow keys (so `ArrowLeft` advances). Setting this is enough on its own: the direction is written to the `Lightbox.Portal` host as a `dir` attribute, so CSS follows it across the portal boundary even though the host mounts on `document.body`. That also makes it the way to run one RTL lightbox inside an otherwise-LTR page. Pass it whenever the surrounding UI is RTL, including in an app that is already RTL end to end (`dir="rtl"` on `<html>`) — behavior falls back to `'ltr'` without it, and navigation would run against the layout. Omitting it writes no attribute at all, so such an app still *lays out* RTL by inheritance; in development that disagreement logs a warning. |
| viewTransition | `boolean \| LightboxViewTransitionPreset` | `true` | Morph between trigger and lightbox item via the View Transitions API. On by default: clicking a trigger morphs into the fullscreen item, and close morphs back. The morph engine is loaded on first use — pass `false` to skip that download. Falls back to a plain fade when unsupported, when prefers-reduced-motion is set, or on low-end devices. Pass a preset name to pick the morph's motion (duration + easing): - `"default"` — 360ms, sheet curve with a tamed launch (same as `true`) - `"snappy"` — 340ms, hotter launch; reads quicker - `"relaxed"` — 400ms, softer launch and longer settle - `"spring"` — 450ms, critically damped spring; Photos-style settle Timing is preset-based (not free-form CSS) on purpose: each preset is vetted on-device to stay smooth and skip-safe on iOS Safari (including Low Power Mode) and Android, where arbitrary curves stutter or teleport. The chosen timing drives the morph, the crossfade and the root fade together so they always stay in sync. |
| scrollTriggerIntoView | `ScrollTriggerIntoView` | `null` | Scroll the active trigger element into the viewport so close animations land on-screen instead of animating off-viewport. Accepts a single option or an array of options, so you can combine the moments below. Per option: - `behavior` — `"smooth"` (default) or `"instant"` - `block` / `inline` — `scrollIntoView` alignment (`"nearest"` default). Use `inline: "center"` for horizontal snap strips with variable-width tiles. - `null` (default) — no automatic scrolling - `{ type: "onChange" }` — scroll to the trigger the close morph will land on whenever the active item changes while the lightbox is open (preemptive; respects `morphTo`, so `closest` scrolls the nearest trigger when the active item has none) - `{ type: "onOpenComplete" }` — scroll to that same trigger once the open transition finishes. The viewer covers the page and scroll is locked, so this reposition is invisible — it only pays off by ensuring the close morph lands on-screen without a jump when the trigger was partially off-screen at open time. `"instant"` recommended. - `{ type: "onClose" }` — scroll to that trigger just before the close morph runs (visible reposition at close start) |
| morphTo | `'active' \| 'origin' \| 'closest'` | `'active'` | Controls which trigger receives the View Transition morph on close. - `'active'` (default) — morph to the active item's trigger. No morph if it has none. - `'origin'` — always morph back to the trigger that originally opened the lightbox, regardless of which item is active. - `'closest'` — morph to the active item's trigger if it has one, otherwise to the trigger of the nearest item that does (a "+N" tile for the photos behind it). |
| awaitImageDecode | `boolean \| number` | `true` | How long the open morph waits for the destination image to decode before starting, so the lightbox doesn't flash empty space while the full-size image is still loading. - `true` (default) — wait up to ~200ms, then start regardless. - `false` — don't wait; start the transition immediately. Useful when the trigger image doubles as a placeholder for the lightbox item so there is nothing to wait for. - `number` — wait up to this many milliseconds. The morph starts as soon as the image decodes (or is served from cache), or when the timeout elapses — whichever comes first. Runs after the lightbox is prepared (mounted hidden) and before `onBeforeOpen`. Only relevant when `viewTransition` is enabled. |
| onBeforeOpen | `LightboxBeforeOpen` |  | Called after the open morph has prepared the lightbox (mounted, still hidden) and finished any `awaitImageDecode` wait, and **before** the View Transition starts. Use this to await custom media readiness (iframe `load`, video `loadeddata`, WebGL, …). May return a Promise — the morph waits for it. Bound your own timeout inside the callback; there is no library-imposed cap. When a newer open/close supersedes this one, `ctx.signal` aborts. Only relevant when `viewTransition` is enabled. Skipped when unset. |
| onBeforeClose | `LightboxBeforeClose` |  | Called synchronously just before close commits — and, when View Transitions are on, **before** the old snapshot is captured. Use this to freeze custom media (`video.pause()`, stop a rAF loop, …) so the close morph isn’t a mid-frame. Unlike `onBeforeOpen`, this cannot delay close (return values are ignored). Skipped when unset. |

### Trigger

Opens the lightbox at the Item with the same itemId and is the morph source (view transitions on by default). Carries the Base UI dialog-trigger disclosure semantics: aria-haspopup="dialog", and aria-controls / aria-expanded on the trigger that opened the dialog. Pass handle to use it outside Root. Prefer render-prop children to attach imageRef / morphRef.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| itemId | `string` |  | The item this trigger opens: the `itemId` of a `Lightbox.Item`. Only triggers whose `itemId` is in the open gallery take part in the morph, placeholders and `morphTo`, so one Root can serve many galleries. |
| overflowItemIds | `readonly string[]` |  | Items this trigger stands in for without opening them, for grids whose visible tiles aren't simply the first photos (a curated "Show all photos" tile). While one of them is active the close morph lands on this trigger, crossfading since the tile shows a different photo; an item's own trigger always wins. A "+N" tile after the first photos doesn't need this: `morphTo="closest"` already lands on it. |
| payload | `Payload` |  | Data for the gallery this trigger opens, read in the viewer with `useLightboxPayload()`. Pass whatever the viewer needs — the full image list, or just an id to look it up by. Required when the handle declares a payload type (`createHandle<Payload>()`), so a trigger can't silently reopen the previous gallery. |
| handle | `LightboxHandle<Payload>` |  | Handle from `Lightbox.createHandle()`. Pass the same handle as Root to use this Trigger outside the Root tree (Base UI Dialog-style detached triggers). |
| crossfade | `'open' \| 'close' \| 'both'` |  | Crossfade between trigger and item snapshots during the view-transition morph. Omit (default) for a hard-cut morph — ideal when trigger and item show the same image at the same intrinsic aspect (a CSS `object-cover` window or smaller srcset is fine; a CDN-baked crop that changes the aspect is not). Use a direction when they differ visually: - `'both'` — crossfade on open and close (e.g. a stack → single photo) - `'open'` — crossfade only when opening - `'close'` — crossfade only when closing (e.g. poster → live video) Sets `data-crossfade` on the trigger and `data-ramka-crossfade` on `<html>` during phases that dissolve (omitted for hard-cut). |
| children | `ReactNode \| ((state: LightboxTriggerRenderState) => ReactNode)` |  | Static children, or a render function that receives `imageRef` / `morphRef` (attach them to designate the placeholder source and the morph element) plus `open` / `active` state. The render function is the recommended form: it wires the flash-free placeholder without any DOM guessing. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-trigger` | Always present on the trigger element. |
| `data-popup-open` | Present when the corresponding lightbox is open. |
| `data-active` | Present when this trigger’s index is the active item. |
| `data-morph-target` | Present on the resolved morph element while it is the open/close morph source: the trigger root by default, or the node designated via `morphRef` when attached. Style hide/opacity against this attribute directly — do not assume it lives on the Trigger button. |
| `data-crossfade` | Reflects the crossfade prop: `open` \| `close` \| `both`. |

### Portal

Portals Backdrop and Content into a host element (default: document.body). Pass container / keepMounted here. keepMounted parks Backdrop+Content while closed (inert, hidden). When using keepMounted, style z-index on the Portal host yourself (Base UI). Prefer isolation: isolate on the app layout root.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| container | `PortalContainer` | `document.body` | Where to mount the portal host. Defaults to `document.body`. Pass `null` to render the host in place (no portal). A ref is resolved on each layout pass until it has a node. |
| keepMounted | `boolean` | `false` | Keep Portal, Backdrop, and Content mounted while the lightbox is closed. Closed ("parked") nodes stay in the DOM but are inert and non-interactive (`visibility: hidden`, `pointer-events: none`) so they don't block the page. Useful for warm reopen of expensive destinations (e.g. map iframes) without remounting them on every open. When using `keepMounted`, style a stacking level on the Portal host yourself (e.g. `className="relative z-[1]"`) — same as Base UI’s keep-mounted guidance. |
| children | `ReactNode` |  | — |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-portal` | Always present on the portal host element. |

### Content

Dialog surface (role="dialog", aria-modal). Provide an accessible name via aria-label or aria-labelledby (required by the WAI-ARIA dialog pattern; the library warns in development if it is missing). Place inside Lightbox.Portal. Owns focus trap, Escape, and pull-to-dismiss. When Lightbox.Stage is mounted, gallery nav (arrows/Home/End), zoom shortcuts (unmodified +/-/0), pinch/ctrl+wheel zoom, and touch/wheel pull are scoped to Stage (and Zoom pan uses Stage as viewport); otherwise Content itself is the stage. Modified combos (⌘/Ctrl +, -, 0) are left to the browser for page zoom. Keyboard pan vs navigate depends on whether the active Zoom is above 1×.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `ReactNode` |  | Dialog contents (close, slides/items, chrome). |
| pullToClose | `boolean` | `true` | Enable pull-to-close on touch and trackpad wheel. Starts from anywhere in Stage (or Content when Stage is omitted), except interactive controls. Publishes `data-pulling`, `data-pull-snapping`, `data-pull-dismissing`, and `--lightbox-pull-progress` while active. The engine loads when Content first mounts with this on — pass `false` to skip that download. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-content` | Always present on the dialog surface. |
| `data-open` | Present while the lightbox is open. |
| `data-closed` | Present while the lightbox is closed (still rendered). |
| `data-pulling` | Present while a pull-to-dismiss drag is in progress. |
| `data-pull-snapping` | Present while a cancelled pull springs back to rest. `data-pulling` is dropped on release so chrome can transition; this latch keeps pull-only layout (overflow, shell hide) until the item is parked. |
| `data-pull-dismissing` | Present while the dismiss animation runs after crossing the threshold. |
| `data-zooming` | Present during an active pinch/zoom gesture (blocks pull-to-dismiss). |
| `data-zoomed` | Present when content zoom is greater than 1× (held through zoom-out animation). |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-pull-progress` |  | 0 at rest → 1 at the dismiss threshold. Drive backdrop/content opacity from this. |
| `--lightbox-pull-snap-duration` |  | Duration of the pull-to-dismiss snap-back, published only while the cancelled pull springs back to rest. Reference it in your transition so progress-derived visuals stay in lockstep with the item's spring, e.g. `transition: opacity var(--lightbox-pull-snap-duration, 300ms) var(--lightbox-pull-snap-easing, ease)`. |
| `--lightbox-pull-snap-easing` |  | Easing of the pull-to-dismiss snap-back (a velocity-aware spring, published only during the spring-back). Pair with `--lightbox-pull-snap-duration` so backdrop/chrome fades match the item's snap-back exactly. |
| `--lightbox-zoom-progress` |  | 0 at 1× → 1 once zoom has risen by 1× above min (e.g. 2× when min is 1). Written by the active `Lightbox.Zoom` from the *visual* scale (live WAAPI transform while a discrete zoom animates; React zoom otherwise). Cleared when zoom returns to rest. Drive sibling dim/blur from this, e.g. `filter: opacity(calc(1 - var(--lightbox-zoom-progress, 0))) blur(calc(var(--lightbox-zoom-progress, 0) * 6px))`. |

### Stage

Optional media interaction surface inside Content. Scopes touch and trackpad wheel pull-to-dismiss, Zoom pan viewport geometry, arrow/Home/End gallery navigation, zoom shortcuts (unmodified +/-/0), and pinch/ctrl+wheel zoom to the media pane. Interactive controls inside Stage keep their press (Close, Prev/Next, etc.). Place side panels / threads as siblings of Stage under Content. When omitted, Content itself is the stage. Prefer render-prop children to attach morphRef when the open/close morph should capture this surface (or a descendant) instead of the active item.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `ReactNode \| ((state: LightboxStageRenderState) => ReactNode)` |  | Static children, or a render function that receives `morphRef`. Attach `morphRef` to morph the Stage surface (or a descendant) instead of the active item. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-stage` | Always present on the media interaction stage. |

### Backdrop

Optional scrim (place inside Lightbox.Portal, typically beside Content). Click closes the lightbox. Tracks pull-to-dismiss progress.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-backdrop` | Always present on the backdrop element. |
| `data-open` | Present while the lightbox is open. |
| `data-closed` | Present while the lightbox is closed (still rendered). |
| `data-pulling` | Present while pull-to-dismiss is active (mirrors Content). |
| `data-pull-snapping` | Present while a cancelled pull springs back (mirrors Content). |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-pull-progress` |  | Same progress variable as Content during pull-to-dismiss. |
| `--lightbox-pull-snap-duration` |  | Same snap-back duration variable as Content during pull-to-dismiss. |
| `--lightbox-pull-snap-easing` |  | Same snap-back easing variable as Content during pull-to-dismiss. |

### Close

Button that closes the lightbox. Ships no default label — give it visible text or pass aria-label / aria-labelledby in your language (the library warns in development when it is nameless).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-close` | Always present on the close button. |

### Item

A single lightbox item. Registers captions and morph/placeholder refs. ARIA adapts automatically: it is a tabpanel wired (aria-labelledby / aria-controls) to its Lightbox.Thumbnail tab when a Lightbox.ThumbnailGroup is present, otherwise role="group" — the APG standalone carousel slide, which needs a translated aria-roledescription="slide" and an aria-label carrying the position ("N of total") from you. Prefer nesting Lightbox.Media (sized morph + placeholder host) around the destination <img>/<video>; imageRef / morphRef remain escape hatches. Typically nested inside Slide. Outside Slides, every item stays mounted; inside Slides, `preload` gates contents.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` |  | This item's position in the viewer. |
| itemId | `string` |  | Stable key for this item: what Triggers open, `value` names and `onValueChange` reports. Must be unique within the gallery — the image's id or URL works. |
| caption | `ReactNode` |  | Optional caption for this item, displayed by Lightbox.Caption. |
| children | `ReactNode \| ((state: LightboxItemRenderState) => ReactNode)` |  | Static children, or a render function that receives per-item state plus `imageRef` / `morphRef`. Prefer the render function and attach `imageRef` to your `<img>` so the open transition bridges the blank frame with the trigger's thumbnail (see `Lightbox.Trigger`'s `imageRef`). |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-item` | Always present on the item element. |
| `data-active` | Present when this item is the active index. |
| `data-index` | The item index as a string. |
| `data-skip-fade` | Transient during view-transition open — suppress consumer entrance fades on the destination item. |
| `data-ssr-active` | Present ONLY in server-rendered HTML, on the active item of a page that server-renders an open lightbox. Carries `scroll-initial-target: nearest` (delivered by `Lightbox.Slides`), so engines that support it scroll the Slides scrollport to the active slide during initial layout — before first paint, for any slide widths. Cleared during hydration; never set on the client. |

### Media

Sized destination media host — morph target and placeholder canvas container. Structural props: width/height (fit-box, same idea as Next.js Image); display:grid plus a scoped <style> so direct img/video fill the box (HTML dimension attrs cannot pin intrinsic size). Cosmetics (radius, colors, object-fit) stay consumer-owned. Prefer Zoom > Media > img|video (Zoom is a size container for Media’s cqw/cqh fit-box; put resting chrome insets on Slide padding). Auto-discovers the primary <img> (or video poster) for decode / thumbnail bridging.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| width | `number` |  | Intrinsic pixel width of the media (same idea as Next.js `<Image width>`). With `height`, applies a structural inscribed fit-box. When omitted, dims are taken from the child `<img>`’s HTML `width`/`height` if present. |
| height | `number` |  | Intrinsic pixel height of the media (same idea as Next.js `<Image height>`). |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-media` | Always present on the media host. |
| `data-placeholder` | Present while the open-morph placeholder canvas is bridging. |
| `data-width` | Present when a structural fit-box width is resolved (prop or img dims). |
| `data-height` | Present when a structural fit-box height is resolved (prop or img dims). |

### Slides

Default layout: horizontal snap carousel wired to the active item. Emits role="group" — the WAI-ARIA carousel container — and you pass the translated aria-roledescription="carousel" plus an aria-label / aria-labelledby naming the gallery (leave the word "carousel" out of the name; the roledescription already says it). Gates Item contents via `preload`; put Slide → Item → Zoom → Media inside. Consumer CSS sizes each Slide snap box (e.g. flex 0 0 100% for full-bleed); index geometry measures offsetLeft/offsetWidth. While the user is flinging, navigation is locked so pull-to-dismiss and zoom chrome do not fight the scroll.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| preload | `number` | `1` | How many slides on each side of the active one keep their `Lightbox.Item` content mounted. Slide *boxes* are always present (so scroll extent is correct); only their content is preload-gated. `1` keeps the neighbours you can swipe to ready. |
| ssrSlideShift | `boolean` | `false` | First-paint slide positioning for pages that SERVER-RENDER an open lightbox (deep links rendering `Portal container={null}`). A scroll offset cannot be serialized into HTML, so such pages otherwise paint slide 0 (or a blank past the `preload` window) until hydration. While this is on, the server HTML carries a transform that translates every slide by `activeIndex × (100% + gap)` so the active slide occupies the scrollport at scroll offset 0; the post-hydration commit swaps the real scroll offset in and drops the transform together — no flash, every browser. ONLY for scrollport-wide slides (`flex: 0 0 100%` tracks): the percentage resolves against each slide's own width, so content-sized (snug) slides would shift by unequal distances. If the track has a `gap`, mirror it into `--lightbox-ssr-slide-gap` (see `LightboxSlidesCssVars`). Without the opt-in, the library still marks the active item so engines with `scroll-initial-target` position any layout natively; other engines keep the hydration jump. Client-side opens are unaffected either way — the stand-in only ever renders for server paint + hydration. Degradation: the transform rule ships as a React 19 hoistable `<style>` tag. On React 18, or under a strict CSP without the nonce wired (see `Lightbox.CSPProvider`), the tag is unavailable and the server paint shows slide 0 with the scroller frozen until the hydration jump — the pre-existing baseline, never anything worse. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-slides` | Always present on the slides scrollport. |
| `data-active-index` | Current active index. |
| `data-direction` | `forward` or `backward`. |
| `data-orientation` | Always `horizontal`. |
| `data-ssr-shift` | Present while the `ssrSlideShift` transform stand-in is applied: from the server render of an open lightbox until the mount layout effect swaps the real scroll offset in (same commit — the swap never paints). While set, every slide is translated so the active one occupies the scrollport at scroll offset 0, and the scrollport's `overflow-x` is frozen so a pre-hydration swipe can't reveal the empty positions the translated slides vacated. |

### Slide

One snap-aligned slide box inside Slides. Snap alignment (`scroll-snap-align`, `scroll-snap-stop`) is built in; slide width (full-bleed, aspect-sized cards, …) is consumer CSS — set `flex` / `width` / `min-width` via className or style. Place a Lightbox.Item (and typically Zoom → Media) inside. Prefer putting resting chrome / safe-area insets as padding on Slide (not Zoom) so Item/Zoom fill the content box and zoomed media can paint into the pad under chrome.

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-slide` | Always present on the slide element. |

### Previous

Navigate to the previous item. Disabled at the start when loop is false.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-previous` | Always present on the previous button. |
| `data-disabled` | Present when navigation is unavailable. |

### Next

Navigate to the next item. Disabled at the end when loop is false.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-next` | Always present on the next button. |
| `data-disabled` | Present when navigation is unavailable. |

### Counter

Shows the active position (e.g. "1 / 12") with an aria-live region.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `(state: { current: number; total: number }) => ReactNode` | `renders "1 / 12"` | Render function for custom counter format. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-counter` | Always present on the counter element. |

### Caption

Renders the active item’s caption from the Item caption registry.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `ReactNode` |  | Fallback content, rendered only while the caption registry is empty. Items register their `caption` in effects, which never run during server rendering (and land only after the first client paint) — so a page that renders an open lightbox paints an empty caption until then. Pass the active item's caption here (you know it on such pages — it's how you rendered the metadata) to make the first paint correct. The moment any item registers, the registry wins and the fallback never renders again, so it can't show stale text after navigation. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-caption` | Always present on the caption element. |
| `data-has-caption` | Present when the active item has a caption. |

### ThumbnailGroup

Accessible tablist of thumbnails with arrow / Home / End keyboard support.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

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
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail` | Always present on the thumbnail button. |
| `data-active` | Present when this thumbnail’s index is active. |
| `data-index` | The thumbnail index as a string. |

### ThumbnailStrip

Scroll-linked thumbnail strip root. Always centers the active thumbnail on the midline (Photos-style): owns overflow clip, measured midline track padding (from registered Thumbnail nodes — not role=tab queries), and Slides→track sync via native ScrollTimeline + WAAPI (JS scroll→transform fallback when ScrollTimeline is unavailable). Compose with ThumbnailStripTrack + Thumbnails; optional midline selection chrome is plain consumer markup (strip root is position:relative). Discrete nav (pointer thumb, keyboard, Previous/Next) goes through ThumbnailStrip (DocumentTimeline WAAPI track scrub via scrubOnSelect; optional wrapSelectCommit(commit, slides, index) to arm consumer WAAPI such as an indicator scrub before the scroll jump). Flex/gap/thumb size remain consumer CSS.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| scrubOnSelect | `boolean` |  | When true (default), discrete navigation (thumbnail pointer, keyboard, Previous/Next) WAAPI-scrubs the track to the target index. When false, the strip follows the Slides jump via the scroll link. |
| wrapSelectCommit | `(commit: () => void, slides: HTMLElement \| null, index: number) => void` |  | Optional wrapper around the active-index commit so consumers can arm custom WAAPI (e.g. an indicator scrub) *before* `commit` jumps Slides. Track scrub still runs outside this callback. Defaults to invoking `commit` immediately. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-thumbnail-strip` | Always present on the thumbnail strip root. |
| `data-ramka-thumbnail-strip-track` | Always present on the scroll-linked tablist track. |
| `data-scrubbing` | Present while a discrete-nav scrub animation is in flight. |
| `data-positioned` | Present once the track has actually been positioned against the Slides scroller (first successful measure-and-sync — set in a layout effect, so for client-side opens it lands before the strip's first paint). Not set by bailed attempts, e.g. while the Slides viewport hasn't registered yet. Absent in server-rendered HTML: scroll/transform positions cannot be serialized, so a server-rendered strip sits at offset 0 until hydration. Hide the strip until this attribute lands to avoid the visible snap on pages that server-render an open lightbox. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-thumbnail-strip-travel` |  | End `translateX` travel for the scroll link (negative px length to center the last thumb — `(count - 1) * step` when thumbs are uniform). Set on the ThumbnailStripTrack. |

### ThumbnailStripTrack

Linked tablist track for ThumbnailStrip. A ThumbnailGroup that registers as the ScrollTimeline transform target (same keyboard / ARIA). Parent ThumbnailStrip writes midline padding + travel CSS var and owns the link animation; flex, gap, and thumb sizing are consumer CSS.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

### Zoom

Pinch, wheel, double-tap, and keyboard zoom/pan surface. Fills its host and is a CSS size container (`container-type: size`) for nested Media fit-box units. Does not set overflow (clipping belongs on Content / chrome so zoomed media can escape the resting box). Prefer Zoom > Media > img|video so pan/maxZoom use Media’s content box. Publishes to Root’s active-zoom bridge so ZoomIn/ZoomOut in toolbar chrome can target the active slide.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| children | `ReactNode \| ((state: LightboxZoomState) => ReactNode)` |  | Zoomable content, or a render function exposing zoom state. |
| minZoom | `number` | `1` | Minimum zoom level. |
| maxZoom | `number` | `undefined (auto)` | Maximum zoom level. When not specified, auto-calculated from the first `<img>` child's natural dimensions vs container size. Falls back to 4 if no image dimensions are available. |
| zoomStep | `number` | `2` | Multiplier for button/keyboard zoom steps. |
| scrollToZoom | `boolean` | `false` | Enable zoom via bare scroll/trackpad without Ctrl. |
| wheelSensitivity | `number` | `100` | Wheel/trackpad zoom sensitivity factor. |
| keyboardPanDistance | `number` | `50` | Keyboard pan distance in content px per keypress. |
| doubleClickDelay | `number` | `300` | Max delay between clicks for double-click detection (ms). |
| onZoomChange | `(zoom: number) => void` |  | Callback when zoom level changes. |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom` | Always present on the zoom container. |
| `data-zoom` | Present when zoom > 1. |
| `data-dragging` | Present while panning with a pointer. |

### ZoomIn

Increments zoom. Works inside Zoom, or as global chrome via the active-slide zoom bridge.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom-in` | Always present on the zoom-in button. |
| `data-disabled` | Present when zoom-in is unavailable. |

### ZoomOut

Decrements zoom. Works inside Zoom, or as global chrome via the active-slide zoom bridge.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| render | `ReactElement \| ComponentRenderFn` |  | Replaces the part's default element with another tag or component. Accepts an element to clone, or a function that returns one. |

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-zoom-out` | Always present on the zoom-out button. |
| `data-disabled` | Present when zoom-out is unavailable. |

### CSPProvider

Provides the Content-Security-Policy nonce for the few inline <style> tags ramka renders (media fill, active-trigger hide, SSR initial slide). Wrap it around everything that renders lightbox parts — including detached Triggers outside any Root — and pass the same per-request nonce that your server puts in the style-src / style-src-elem directive and in the React render call (React 19.2+). Without it, strict-CSP pages refuse those tags and the library falls back to CSSOM delivery after hydration (everything works; only server-paint niceties on SSR-open pages are lost).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| nonce | `string` |  | The per-request CSP nonce (the value behind `'nonce-…'` in the `style-src` / `style-src-elem` directive). Stamped on every inline `<style>` tag the lightbox renders so strict-CSP pages keep the first-paint rules (media fill, active-trigger hide, SSR initial slide). |
| children | `ReactNode` |  | — |

### Document (view transitions)

While a view-transition morph runs, ramka sets attributes and CSS variables on <html> so you can style ::view-transition-* pseudo-elements. Cleared when the transition finishes.

#### Data attributes

| Name | Description |
| --- | --- |
| `data-ramka-view-transition` | Present during a morph. Value is `opening` or `closing`. |
| `data-ramka-crossfade` | Present while the morph dissolves trigger↔item snapshots (Trigger `crossfade` is active for this phase). Absent for the default hard-cut. |
| `data-ramka-vt-preset` | Present during a morph. Value is the active `viewTransition` timing preset name (`default`, `snappy`, `relaxed`, `spring`) — read by the composited morph and available to skin CSS for per-preset styling. |
| `data-ramka-vt-isolate` | Present during a morph ONLY when the page declares foreign `view-transition-name`s that must be neutralized so they don't ride over the morph. Kept off otherwise: the rule's universal selector makes the attribute flip a full-document style invalidation, which on large DOMs is the dominant cost of starting (and finishing) a morph. |

#### CSS variables

| Name | Type | Description |
| --- | --- | --- |
| `--lightbox-morph-radius-trigger` |  | Trigger-side border-radius for the morph group clip (interpolatable px). Written by the library onto `documentElement` during a morph — do not set it yourself. |
| `--lightbox-morph-radius-item` |  | Item-side border-radius for the morph group clip. Written by the library onto `documentElement` during a morph — do not set it yourself. |
| `--lightbox-morph-border-radius-from` |  | Start border-radius for the morph group clip (interpolatable px). Derived from the trigger/item radius pair by the library's own view-transition rules, keyed on the morph direction. |
| `--lightbox-morph-border-radius-to` |  | End border-radius for the morph group clip. Derived from the trigger/item radius pair like `--lightbox-morph-border-radius-from`. |
| `--lightbox-morph-old-opacity` |  | Opacity of the old morph snapshot on the hard-cut path (no document crossfade). |
| `--lightbox-morph-new-opacity` |  | Opacity of the new morph snapshot on the hard-cut path (1 on open, 0 on close). |
| `--lightbox-vt-duration` |  | Morph + root-snapshot duration from the Root's `viewTransition` timing preset. WRITTEN BY THE LIBRARY in two places — do not set it yourself: onto `documentElement` during a morph (read it in document-level `::view-transition-*` rules, e.g. `calc(var(--lightbox-vt-duration) * 0.5)` for a derived track), and always onto the Portal host, so skin open/close fades inside the portal can use the preset's clock even when no morph runs (non-VT browsers, reduced motion, low-end fallback), e.g. `transition: opacity var(--lightbox-vt-duration, 360ms) ease-out`. |
| `--lightbox-vt-easing` |  | Easing for `::view-transition-group(lightbox-morph)` and the *open* crossfade dissolve. Written by the library from the `viewTransition` preset, like `--lightbox-vt-duration` (during a morph on `documentElement`, always on the Portal host). Close dissolve uses `--lightbox-vt-crossfade-close-easing` (a shorter complementary fade, not the morph curve) so the item yields before the size settle. |
| `--lightbox-vt-crossfade-close-easing` |  | Close trigger↔item snapshot dissolve, used while `data-ramka-view-transition="closing"` and `data-ramka-crossfade` are set. Modest ease-out on a shorter window that still runs old 1→0 and new 0→1 on the same clock (`plus-lighter` stays opaque). Written by the library onto `documentElement` during a morph — do not set it yourself. |
| `--lightbox-vt-root-easing` |  | Easing for the root snapshot cross-fade (`::view-transition-old/new(root)`). Written by the library from the `viewTransition` preset, like `--lightbox-vt-duration` (during a morph on `documentElement`, always on the Portal host). A good default for skin backdrop/content fades. |

## Types

Helper types you will see in callbacks and render props (exported from `@ramka/react` / the Lightbox module):

- `NavigationSource` — `'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative'`. `details.source` in Root `onValueChange(itemId, details)`. Handle `open` /`goTo` use `'imperative'`; scroll-driven Slides use `'scroll'`.
- `LightboxCrossfade` — `'open' | 'close' | 'both'` for Trigger `crossfade`. See [View transitions → crossfade](docs/lightbox/view-transitions.md#crossfade).
- Render-state types such as `LightboxTriggerRenderState` and Item render args (`active`, `visible`, refs) — documented on [Trigger](docs/lightbox/api.md#api-trigger) / [Item](docs/lightbox/api.md#api-item).

## Hooks

Optional contexts for nested wrapper components.

### useLightboxPayload

Payload of the current open (the opening Trigger’s payload, or handle.open(itemId, { payload })), for a viewer rendered as a plain Root child — so one Root can wrap a whole feed. Re-renders its caller only when an open brings a new payload, never on navigation, zoom or close. Performance: call it (and useLightboxContext) in the viewer, not in feed rows — a row that reads lightbox state re-renders on every change.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `Payload` |  | Payload of the current open (the opening Trigger's `payload`, or `handle.open({ payload })`), for viewer parts rendered as plain Root children. Re-renders its caller only when the payload changes — call it in the viewer, not in every feed row. |

### useLightboxTriggerContext

Optional context from the enclosing Trigger. Use in nested wrappers (e.g. a shared <TriggerImage>) to attach imageRef / morphRef without threading the render prop.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `LightboxTriggerRenderState \| null` |  | Optional context from the enclosing Trigger. Returns `{ imageRef, morphRef, open, active }`, or `null` outside a Trigger. |

### useLightboxItemContext

Optional context from the enclosing Item. Use in nested wrappers to attach imageRef / morphRef or read active/index. Prefer Lightbox.Media for the common morph/placeholder host.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `LightboxItemContextValue \| null` |  | Optional context from the enclosing Item. Returns `{ index, active, imageRef, morphRef, registerMedia, registerPlaceholder }`, or `null` outside an Item. |

### useLightboxMediaContext

Optional context from the enclosing Media. Exposes the Media host element for advanced wrappers.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `LightboxMediaContextValue \| null` |  | — |

### useLightboxStageContext

Optional context from the enclosing Stage. Use in nested wrappers to attach morphRef without threading the render prop — the shared View Transition capture destination.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (return) | `LightboxStageRenderState \| null` |  | Optional context from the enclosing Stage. Returns `{ morphRef }`, or `null` outside a Stage. |

## Imperative handles

Use `Lightbox.createHandle()` on Root (and optional detached Triggers). Zoom exposes zoom controls via `ref`.

### LightboxHandle

Imperative handle from Lightbox.createHandle(). Pass to Root (and optional detached Triggers).

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| open | `(itemId?: string, options?: LightboxHandleOpenOptions<Payload>) => void` |  | Open the lightbox at the `Lightbox.Item` with this `itemId` (or at the current item when omitted). The item's position is resolved once the payload's items mount, and the open morphs from that item's mounted Trigger, if any. Call only from an event handler or effect — not during render. |
| close | `() => void` |  | Close the lightbox. |
| goTo | `(itemId: string) => void` |  | Navigate to the mounted `Lightbox.Item` with this `itemId` (source: `imperative`). Does not open. |
| isOpen | `boolean` |  | Whether the bound Root is currently open. |

### LightboxZoomRef

Imperative handle from ref on Zoom.

#### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| zoom | `number` |  | Current zoom level. |
| maxZoom | `number` |  | Resolved maximum zoom. |
| offsetX | `number` |  | Current pan X. |
| offsetY | `number` |  | Current pan Y. |
| zoomIn | `() => void` |  | Step zoom in by zoomStep. |
| zoomOut | `() => void` |  | Step zoom out by zoomStep. |
| zoomTo | `(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }) => void` |  | Zoom to an absolute level, optionally recentering. |
| reset | `(rapid?: boolean) => void` |  | Reset zoom and pan to the resting state. |
