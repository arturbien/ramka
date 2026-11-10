# State & lifecycle

Control open state and the active index with bindings, `createHandle()`, or both, and know when callbacks fire. Part of [Lightbox](docs/framework/svelte/lightbox.md).

## Controlled state

Bind `open` and `index` on [Root](docs/framework/svelte/lightbox/api.md#api-root) to drive the lightbox from URL params, a store, or sibling UI. Leave them unbound and Root keeps its own state, starting closed at index 0.

The React version splits this into `open` / `onOpenChange`, `value` / `onValueChange`, and `defaultOpen` / `defaultValue`. In Svelte, `bind:` covers all three: pass a plain value for the initial state, bind it to control it.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let open = $state(false);
  let index = $state(0);
</script>

<Lightbox.Root bind:open bind:index>
  <!-- triggers + content -->
</Lightbox.Root>
```

## Imperative API

[Lightbox.createHandle()](docs/framework/svelte/lightbox/api.md#api-root) lets Triggers and Root live apart: pass the same handle to both. Call `open(index, &#123; triggerId &#125;)` from any button so the open still morphs from the matching [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger). The handle also has `close()`, `goTo(index)`, and a reactive `isOpen`.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { images }: { images: { id: string; src: string; alt: string }[] } = $props();
  const lightbox = Lightbox.createHandle();
</script>

<button type="button" onclick={() => lightbox.open(0, { triggerId: 'photo-0' })}>View gallery</button>

{#each images as img, i (img.id)}
  <Lightbox.Trigger handle={lightbox} id="photo-{i}" index={i}>
    <img src={img.src} alt={img.alt} />
  </Lightbox.Trigger>
{/each}

<Lightbox.Root handle={lightbox}>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each images as img, i (img.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Zoom>
                <Lightbox.Media>
                  <img src={img.src} alt={img.alt} />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
      <Lightbox.Close aria-label="Close" />
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

Inside one component you can skip the handle: `bind:this` on Root exposes `show(index)` and `close()`.

## Lifecycle callbacks

`onOpenChange` fires immediately when open flips: use it to sync the URL or external state. `onOpenChangeComplete` fires after enter and exit motion settles: use it for cleanup and focus. `onValueChange` reports the new index plus a [NavigationSource](docs/framework/svelte/lightbox/api.md#types) (including `imperative` for handle navigation).

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { children } = $props();
</script>

<Lightbox.Root
  onOpenChange={(open) => console.log('sync URL or store', open)}
  onOpenChangeComplete={(open) => console.log('motion settled, clean up or move focus', open)}
  onValueChange={(index, { source }) => console.log(index, source)}
>
  {@render children()}
</Lightbox.Root>
```

## onBeforeOpen

When View Transitions are on, open is *prepare → optional image decode → optional onBeforeOpen → morph* . Use [Root](docs/framework/svelte/lightbox/api.md#api-root)’s `onBeforeOpen` to delay the morph until custom media is ready (iframe `load`, video, WebGL). It runs after the lightbox is mounted hidden, so destination nodes exist, and before `startViewTransition`.

Keep `awaitImageDecode` for photos (default `true`). For non-image destinations, pass `awaitImageDecode=&#123;false&#125;` and wait in `onBeforeOpen`. Bound your own timeout; `ctx.signal` aborts if a newer open or close wins. See [3D models](docs/framework/svelte/examples/lightbox/3d-models.md).

## onBeforeClose

`onBeforeClose` fires synchronously when close begins and, with View Transitions, *before* the old snapshot is captured. Use it to freeze custom media ( `video.pause()`, stop a rAF loop) so the close morph isn’t a mid-frame. Unlike `onBeforeOpen`, it cannot delay close. `onOpenChange(false)` is too late for this: it runs inside the transition callback, after the snapshot.
