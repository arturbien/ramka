# SvelteKit images

Use blurred placeholders (LQIP) with ramka. Lightbox-side blur depends on whether that item has a trigger image. Part of [Lightbox](docs/framework/svelte/lightbox.md).

The demos on this page delay every full-size lightbox image by about 500ms and bypass the browser cache on each open, so you can watch the placeholder mechanisms work on every open, with no DevTools throttling.

## When to use a placeholder

SvelteKit has no built-in blur placeholder like `next/image`. The usual setup is a tiny image from your pipeline (`vite-imagetools`, `sharp` at build time, or your CDN) painted as the `background-image` of the `<img>` until the real pixels arrive. This page calls that the LQIP. `@sveltejs/enhanced-img` works too: its output is a plain `<img>`, so everything below applies.

Decide **per item index**, not per gallery. ramka paints an open bridge only when that index has a registered trigger image (`imageRef`).

| Image | LQIP | Why |
| --- | --- | --- |
| Image inside `Lightbox.Trigger` | Yes | A regular page image: the LQIP covers its own load. ramka never paints a placeholder here. |
| Image inside `Lightbox.Thumbnail` | Yes | Same as a trigger: a regular page image. ramka bridges only the destination media, never strip thumbnails, so the LQIP is the only thing covering the thumb’s own load. |
| Lightbox image, index *has* a trigger image (`imageRef`) | No | While the full-size image loads, ramka paints the trigger’s image (already decoded and on screen) onto a canvas *behind* the lightbox image. An LQIP background sits on the lightbox image itself, in front of that canvas, so it hides a sharp placeholder behind a blurry one. |
| Lightbox image, index has *no* trigger image | Yes | ramka has no trigger image to paint, so the LQIP is the only loading placeholder (see [No trigger image](#no-trigger-image)). |

**One exception:** pages that server-render the lightbox already open (deep links). The bridge is painted on gesture opens. A server-rendered open has no gesture, and before hydration nothing is decoded to paint from, while an LQIP is part of the server HTML itself. For those visits, destination blur is the only placeholder that can exist on first paint: enable it for the deep-link visit and keep destinations clean for regular visits (decide once per mount).

## Do

Use the same asset for trigger and destination. Put the LQIP on the trigger; leave the destination clean. A square trigger crop is CSS only: keep the source aspect matched to Media. See [View transitions: Source aspect](docs/framework/svelte/lightbox/view-transitions.md#source-aspect) for a live Do / Don’t.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo }: { photo: { src: string; lqip: string; width: number; height: number } } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <img
        {@attach imageRef}
        src={photo.src}
        alt="Mountain lake"
        class="aspect-square size-full bg-cover object-cover"
        style:background-image="url({photo.lqip})"
      />
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
                <img src={photo.src} alt="Mountain lake" sizes="100vw" fetchpriority="high" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Don’t

An LQIP on a lightbox image whose index has a trigger image covers ramka’s bridge with a blur while the full image loads.

```svelte Gallery.svelte
<Lightbox.Media width={photo.width} height={photo.height}>
  <img
    src={photo.src}
    alt="Mountain lake"
    sizes="100vw"
    class="bg-cover"
    style:background-image="url({photo.lqip})"
  />
</Lightbox.Media>
```

## No trigger image

If an index has no trigger `imageRef`, ramka has nothing to paint. Use a destination LQIP for those items only, not for siblings that still have a trigger image.

### +N extras

Open the +N tile, then swipe past the triggered photos. Overflow slides show the LQIP; indexes 0 and 1 stay on ramka’s trigger-image bridge. Close uses [morphTo="closest"](docs/framework/svelte/lightbox/view-transitions.md#morph-to).

```svelte Album.svelte
<Lightbox.Root morphTo="closest">
  {#each photos.slice(0, visible) as photo, i (photo.src)}
    <Lightbox.Trigger index={i} crossfade={i === visible - 1 ? 'both' : undefined}>
      {#snippet children({ imageRef })}
        <img {@attach imageRef} src={photo.src} alt="" class="bg-cover" style:background-image="url({photo.lqip})" />
      {/snippet}
    </Lightbox.Trigger>
  {/each}

  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each photos as photo, i (photo.src)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Zoom>
                <Lightbox.Media width={photo.width} height={photo.height}>
                  <img
                    src={photo.src}
                    alt=""
                    sizes="100vw"
                    class="bg-cover"
                    style:background-image={i >= visible ? `url(${photo.lqip})` : undefined}
                  />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

### Non-image trigger

Initials and swatches have a Trigger but no trigger image. Blur on the lightbox image is the loading placeholder.

```svelte Team.svelte
<Lightbox.Root>
  {#each team as person, i (person.name)}
    <Lightbox.Trigger index={i} crossfade="both">
      <span style:background={person.color}>{person.initials}</span>
    </Lightbox.Trigger>
  {/each}

  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each team as person, i (person.name)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Zoom>
                <Lightbox.Media width={person.photo.width} height={person.photo.height}>
                  <img
                    src={person.photo.src}
                    alt="Portrait of {person.name}"
                    class="bg-cover"
                    style:background-image="url({person.photo.lqip})"
                  />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Checklist

- Per index: trigger image means no destination LQIP; no trigger image means a destination LQIP is fine
- Match Media `width` /`height` to the image source aspect
- Trigger and destination must share that intrinsic aspect (CSS-crop the tile; don’t serve a differently cropped file). See [Source aspect](docs/framework/svelte/lightbox/view-transitions.md#source-aspect)
- Trigger: `imageRef` (or [getTrigger()](docs/framework/svelte/lightbox/api.md#context)); an LQIP on the trigger image is fine
- `ThumbnailStrip` thumbs are regular images: an LQIP is fine, same as triggers
- Prefer `fetchpriority="high"` on the open destination. See [View transitions](docs/framework/svelte/lightbox/view-transitions.md)
- `sizes="100vw"` for fullscreen
- Skip `size-full` on the image: Media already fills a direct img child
