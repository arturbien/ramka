# State & lifecycle

Control open state and the active item from React, `createHandle()`, or both — and know when callbacks fire. Part of [Lightbox](docs/lightbox.md).

## Controlled state

Pass `open` / `onOpenChange` and `value` / `onValueChange` on [Root](docs/lightbox/api.md#api-root) to drive the lightbox from URL params, a store, or sibling UI. Omit them for uncontrolled defaults (`defaultOpen` / `defaultValue`). The value is the active [Item](docs/lightbox/api.md#api-item)'s `itemId`, so it reads well in a URL; `onValueChange` also passes the item's position as `details.index`.

```tsx Controlled open + value
import * as Lightbox from '@ramka/react/lightbox';

<Lightbox.Root open={open} onOpenChange={setOpen} value={value} onValueChange={setValue}>
  {/* triggers + content */}
</Lightbox.Root>
```

## Imperative API

[Lightbox.createHandle()](docs/lightbox/api.md#api-create-handle) lets Triggers and Root live apart — pass the same handle to both. Call `open(itemId)` from any button; the open still morphs from that item's [Trigger](docs/lightbox/api.md#api-trigger). `goTo(itemId)` navigates without opening.

```tsx createHandle
import * as Lightbox from '@ramka/react/lightbox';

const lightbox = Lightbox.createHandle();

<>
  <button type="button" onClick={() => lightbox.open('photo-1')}>
    View gallery
  </button>

  {images.map((img) => (
    <Lightbox.Trigger key={img.id} handle={lightbox} itemId={img.id}>
      <img src={img.src} alt={img.alt} />
    </Lightbox.Trigger>
  ))}

  <Lightbox.Root handle={lightbox}>
    <Lightbox.Portal>
      <Lightbox.Backdrop />
      <Lightbox.Content>
        <Lightbox.Slides>
          {images.map((img, i) => (
            <Lightbox.Slide key={img.id}>
              <Lightbox.Item index={i} itemId={img.id}>
                <Lightbox.Zoom>
                  <Lightbox.Media>
                    <img src={img.src} alt={img.alt} />
                  </Lightbox.Media>
                </Lightbox.Zoom>
              </Lightbox.Item>
            </Lightbox.Slide>
          ))}
        </Lightbox.Slides>
        <Lightbox.Close aria-label="Close" />
      </Lightbox.Content>
    </Lightbox.Portal>
  </Lightbox.Root>
</>
```

## Lifecycle callbacks

`onOpenChange` fires immediately when open flips — use it to sync URL or external state. `onOpenChangeComplete` fires after enter/exit motion settles — use it for cleanup and focus. `onValueChange` fires when the active item changes, with its `itemId`, its index, and a [NavigationSource](docs/lightbox/api.md#types) (including `imperative` for handle navigation).

```tsx Lifecycle callbacks
import * as Lightbox from '@ramka/react/lightbox';

<Lightbox.Root
  onOpenChange={(open) => {
    // Fires immediately — sync URL / store here.
    void open;
  }}
  onOpenChangeComplete={(open) => {
    // Fires after enter/exit motion settles — cleanup / focus here.
    void open;
  }}
  onValueChange={(itemId, { index, source }) => {
    // Fires when the active item changes — `itemId` is the new item.
    void itemId;
    void index;
    void source; // 'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative'
  }}
>
  {/* … */}
</Lightbox.Root>
```

## onBeforeOpen

When View Transitions are on, open is *prepare → optional image decode → optional onBeforeOpen → morph* . Use [Root](docs/lightbox/api.md#api-root) ’s `onBeforeOpen` to delay the morph until custom media is ready (iframe `load`, video, WebGL, …). It runs after the lightbox is mounted hidden — so destination nodes exist — and before `startViewTransition`.

Keep `awaitImageDecode` for photos (default `true`). For non-image destinations, pass `awaitImageDecode={false}` and wait in `onBeforeOpen`. Bound your own timeout; `ctx.signal` aborts if a newer open/close wins. See [3D models](examples/lightbox/3d-models.md).

## onBeforeClose

`onBeforeClose` fires synchronously when close begins — and, with View Transitions, *before* the old snapshot is captured. Use it to freeze custom media ( `video.pause()`, stop a rAF loop) so the close morph isn’t a mid-frame. Unlike `onBeforeOpen`, it cannot delay close. `onOpenChange(false)` is too late for this: it runs inside the transition callback, after the snapshot.
