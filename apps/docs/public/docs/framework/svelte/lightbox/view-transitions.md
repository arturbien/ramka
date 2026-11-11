# View transitions

Morph open and close between a trigger and the active item with the browser View Transitions API. Part of [Lightbox](docs/framework/svelte/lightbox.md). Unsupported browsers, reduced motion, and low-end devices fall back to a plain fade.

## Morph refs

Morph is on by default (`viewTransition` on [Root](docs/framework/svelte/lightbox/api.md#api-root)). Pass `viewTransition=&#123;false&#125;` to opt out. Recommended destination shape: [Lightbox.Media](docs/framework/svelte/lightbox/api.md#api-media) around the `<img>` or `<video>` (a sized fit-box that is both morph target and placeholder host). On [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger), the first `img` inside is the morph source on its own. To be explicit, take the refs from the children snippet; both are attachments:

- `imageRef`: attach to the Trigger thumb `<img>` whose pixels bridge the morph. Media finds the destination image (or video poster) by itself. Open reuses the already-decoded bitmap so the transition doesn’t flash empty space.
- `morphRef`: optional escape hatch when morph bounds should differ from Media or the image (tile with overlay, swatch + label).

Nested components can read the same refs from context with [getTrigger() and getItem()](docs/framework/svelte/lightbox/api.md#context) instead of threading the snippet argument. Use `awaitImageDecode` on [Root](docs/framework/svelte/lightbox/api.md#api-root) when you want a short wait for the destination image before the morph starts (default cap about 200ms).

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { thumb, src }: { thumb: string; src: string } = $props();
</script>

<Lightbox.Root morphTo="active">
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <img {@attach imageRef} src={thumb} alt="" />
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media>
                <img {src} alt="" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Source aspect

The morph snapshots whatever pixels are on the trigger `<img>` and interpolates them into the destination Media box. That only looks like one photo when both sides share the *same intrinsic aspect ratio*: the same file, or srcset candidates of that file. A square tile is fine; crop it with CSS (`object-fit: cover`), not by baking `w=h&fit=crop` into a different image.

A CDN-cropped 1∶1 thumb against a 3∶2 lightbox image will reframe mid-animation: ramka paints the square thumb into the landscape box, then the full file lands with a different crop. Element boxes may differ. Intrinsic aspect must not.

These demos delay the lightbox image by about 500ms so the handoff is visible on every open.

```svelte Do.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo }: { photo: { src: string; width: number; height: number } } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <img {@attach imageRef} src={photo.src} alt="Mountain lake" class="aspect-square size-full object-cover" />
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media width={photo.width} height={photo.height}>
                <img src={photo.src} width={photo.width} height={photo.height} alt="Mountain lake" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

```svelte Dont.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo, squareThumb }: { photo: { src: string; width: number; height: number }; squareThumb: string } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <!-- ✗ a 1∶1 file; Media below is the full 3∶2 photo -->
      <img {@attach imageRef} src={squareThumb} alt="Mountain lake" class="size-full object-cover" />
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media width={photo.width} height={photo.height}>
                <img src={photo.src} width={photo.width} height={photo.height} alt="Mountain lake" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Trigger crossfade

Controls whether the morph *dissolves* between trigger and item snapshots or hard-cuts geometry only.

- **Omit (default)**: hard-cut. Best when trigger and item show the *same* picture at the *same intrinsic aspect* (a CSS `object-cover` window or a smaller srcset is fine; a CDN-baked crop that changes the aspect is not, see [Source aspect](#source-aspect)). Leaves `data-ramka-crossfade` unset on `<html>` during the transition.
- `both`: dissolve on open and close (stack → single photo, +N overlay tile).
- `open` / `close`: dissolve in one direction only (poster → live video often wants `close`).

Keep trigger and item images on `object-fit: cover` (or the same fit) so crops stay coherent. Put border-radius on the morph target itself: the library interpolates `--lightbox-morph-border-radius-from/to` on `<html>`.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo, extras }: { photo: string; extras: number } = $props();
</script>

<Lightbox.Root morphTo="closest">
  <Lightbox.Trigger index={0} crossfade="both">
    {#snippet children({ imageRef })}
      <div class="relative">
        <img {@attach imageRef} src={photo} alt="" />
        <span>+{extras}</span>
      </div>
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            {#snippet children({ imageRef })}
              <img {@attach imageRef} src={photo} alt="" />
            {/snippet}
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Root morphTo

Picks which trigger receives the *close* morph:

- `active` (default): the trigger for the current active index. No morph if that index has no trigger.
- `origin`: always the trigger that opened the lightbox (one tile opens many items).
- `closest`: the active index if registered, otherwise the nearest registered trigger.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
</script>

<Lightbox.Root morphTo="closest">
  <Lightbox.Trigger index={0}><!-- first thumb --></Lightbox.Trigger>
  <Lightbox.Trigger index={1}><!-- +N tile --></Lightbox.Trigger>
  <!-- items 2…n close to the nearest trigger -->
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide><Lightbox.Item index={0} /></Lightbox.Slide>
        <Lightbox.Slide><Lightbox.Item index={1} /></Lightbox.Slide>
        <Lightbox.Slide><Lightbox.Item index={2} /></Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Root scrollTriggerIntoView

When the page scrolls while the lightbox is open, the close morph can land off-screen. Use `scrollTriggerIntoView` to keep the target trigger in view:

- `onChange`: scroll to the active trigger as the index changes (preemptive).
- `onOpenComplete`: reposition once open settles (invisible under the overlay; `instant` recommended).
- `onClose`: scroll just before the close morph (visible jump at close start).

Pass one option or an array. Each option also accepts `block` / `inline` alignment (default `nearest`): use `inline: 'center'` for horizontal snap strips with variable-width tiles. Pair with `morphTo` so the scrolled element is the same one that receives the morph.

```svelte Gallery.svelte
<Lightbox.Root
  scrollTriggerIntoView={[
    { type: 'onChange', behavior: 'instant' },
    { type: 'onOpenComplete', behavior: 'instant' }
  ]}
>
  <!-- triggers + content -->
</Lightbox.Root>
```

## Programmatic open

Prefer [createHandle()](docs/framework/svelte/lightbox/api.md#api-root): `open(index, &#123; triggerId &#125;)` associates a Trigger that declared that `id` so the open morph can use that element. Without a registered trigger (or `triggerId`), the open falls back to the fade path. Trigger clicks still morph. Demo: [State & lifecycle: Imperative API](docs/framework/svelte/lightbox/state-lifecycle.md#imperative).

## Styling

You write **zero** view-transition CSS: the library injects the structural `::view-transition-*` rules itself (see [Injected CSS](#injected-css)) and writes document hooks during a morph so your own skin CSS can react, for example to keep Backdrop and Content fades on the morph’s clock. Attribute and CSS variable tables live under [Document (view transitions)](docs/framework/svelte/lightbox/api.md#api-view-transition-document). Hooks:

- `data-ramka-view-transition`: `opening` | `closing`
- `data-ramka-crossfade`: dissolve path (present when Trigger `crossfade` is active for this phase; absent for hard-cut)
- `--lightbox-morph-border-radius-from/to`, `--lightbox-morph-old/new-opacity`
- `data-ramka-vt-preset`, `--lightbox-vt-duration`, `--lightbox-vt-easing`, `--lightbox-vt-crossfade-close-easing`, `--lightbox-vt-root-easing`: the active timing preset, written by the library (see [Timing presets](#timing-presets))
- [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger) `data-morph-target` / [Item](docs/framework/svelte/lightbox/api.md#api-item) `data-skip-fade`: hide the live morph source and suppress entrance fades on the destination while the transition layer is up

Motion splits into **timing** (a preset picked on Root, see below) and **structure** (injected by the library). Your CSS only handles cosmetics, and reads the library-written variables where it wants to stay in sync.

## Timing presets

Morph duration and easing are chosen with the `viewTransition` prop on [Root](docs/framework/svelte/lightbox/api.md#api-root): pass a preset name instead of `true`:

- `"default"`: 360ms, sheet curve with a tamed launch (what `true` runs)
- `"snappy"`: 340ms, hotter launch; reads quicker
- `"relaxed"`: 400ms, softer launch and longer settle
- `"spring"`: 450ms, critically damped spring; Photos-style settle

```svelte Picking a preset
<Lightbox.Root viewTransition="spring"><!-- … --></Lightbox.Root>
```

Timing is preset-based rather than free-form CSS on purpose: each preset is vetted on-device to stay smooth and skip-safe on iOS Safari (including Low Power Mode) and Android, where arbitrary curves stutter or teleport. The library publishes the preset timing as `--lightbox-vt-duration` / `--lightbox-vt-easing` / `--lightbox-vt-root-easing` in two places: always on the [Portal](docs/framework/svelte/lightbox/api.md#api-portal) host, and, together with `data-ramka-vt-preset`, on `documentElement` for the duration of a morph. Read those variables in your own CSS as the skin’s single motion clock (for example `transition: opacity var(--lightbox-vt-duration, 360ms) ease-out` on Backdrop and Content): during a morph the fades stay in lockstep with it, and on the non-morph paths (unsupported browsers, reduced motion, low-end fallback) they still run on the preset’s timing. Do not set the variables yourself.

## Injected CSS

On first [Root](docs/framework/svelte/lightbox/api.md#api-root) mount the library injects one stylesheet with everything a morph structurally needs: no copy-paste block to maintain, and several skins on one page can never fight over it.

- **Name isolation**: `startViewTransition` snapshots the whole document, so any page element with its own `view-transition-name` would paint *over* the lightbox. Every name is cleared while `data-ramka-view-transition` is set; the morph target re-applies its name inline with `!important` and stays the only captured group.
- **Morph group**: clipping and border-radius interpolation (put radius on the morph target element; the library writes `--lightbox-morph-border-radius-from/to`), timed by the active preset.
- **Snapshots**: hard-cut by default (`object-fit: cover`, no browser dissolve). When Trigger `crossfade` sets `data-ramka-crossfade`, the dissolve path (browser fade, `plus-lighter`, `object-fit: fill`) runs on the same preset clock, on a shorter window so the outgoing snapshot is gone before the size settles.
- **Root snapshot**: the page-behind crossfade, kept as a *single* root group (promoting Backdrop or Content into named groups tanks Safari). Fade scrim and chrome with live `opacity` transitions instead.
- **Morph-target hide**: `[data-morph-target]` gets `opacity: 0` with a 200ms fade-back (disabled during the transition so it can’t be captured mid-flight), so the live trigger never shows doubled under the morphing snapshot.
- **Thumb-jump crossfade**: the element-scoped Slides transition started when a ThumbnailStrip thumbnail jumps several slides, tunable with `--lightbox-select-vt-duration/easing` on Slides.

Everything except name isolation is gated under `prefers-reduced-motion: no-preference`. The stylesheet is inserted at the *start* of `<head>`, so your own stylesheets cascade after it: overriding an injected rule takes an ordinary declaration of equal specificity, no `!important` needed.

Lifecycle timing for your own CSS: Content and Backdrop stay mounted through exit animations; while a morph open is preparing they may be `visibility: hidden` so the morph layer owns the pixels. Prefer `onOpenChangeComplete` for post-motion work, see [State & lifecycle: Lifecycle callbacks](docs/framework/svelte/lightbox/state-lifecycle.md#lifecycle).
