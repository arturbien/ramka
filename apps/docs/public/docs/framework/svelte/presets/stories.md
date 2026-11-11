# Stories

Instagram-style stories: a horizontal row of avatars, each dissolving into a vertical video via `crossfade="both"` (the circle is not the 9:16 frame, so a geometry morph would look wrong). Inside the viewer, slides are a native snap scroller with a CSS view-timeline rotateY: cards hinge on their leading edge as they enter and on their trailing edge as they leave. Copy the **Package** files ( `index.ts`, the `.svelte` files and `lightbox.css`) into your design system, then wire triggers in your app.

## Source

```ts svelte/src/lib/presets/stories/index.ts
import { Lightbox as Primitives } from '@ramka/svelte';
import Root from './Root.svelte';
import Trigger from './Trigger.svelte';
import Gallery from './Gallery.svelte';

export type { LightboxItem } from './Gallery.svelte';

/** Stories skin: the library primitives with a video-pausing Root, a circular Trigger and the composed Gallery. */
export const Lightbox = { ...Primitives, Root, Trigger, Gallery };
```

```svelte svelte/src/lib/presets/stories/Root.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import type { ComponentProps } from 'svelte';

  let {
    open = $bindable(false),
    index = $bindable(0),
    onBeforeClose,
    ...rest
  }: ComponentProps<typeof Lightbox.Root> = $props();

  let root: ReturnType<typeof Lightbox.Root>;

  /** Opens at `i`, morphing from its Trigger when one is registered. */
  export function show(i = index) {
    return root.show(i);
  }

  /** Closes, morphing back to the Trigger picked by `morphTo`. */
  export function close() {
    return root.close();
  }

  function pauseDialogVideos(scope: Element | null) {
    for (const video of scope?.querySelectorAll('video') ?? []) video.pause();
  }
</script>

<Lightbox.Root
  bind:this={root}
  bind:open
  bind:index
  {...rest}
  onBeforeClose={(ctx) => {
    pauseDialogVideos(ctx.destination?.closest('[data-ramka-content]') ?? ctx.destination);
    onBeforeClose?.(ctx);
  }}
/>
```

```svelte svelte/src/lib/presets/stories/Trigger.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import type { ComponentProps } from 'svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['stl-trigger', className]} {...rest} />
```

```svelte svelte/src/lib/presets/stories/Gallery.svelte
<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    name: string;
    avatar: string;
    video: string;
    poster: string;
    alt: string;
    /** Relative time shown in the story HUD, e.g. "2h". */
    time?: string;
    width: number;
    height: number;
  }
</script>

<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import StoryVideo from './StoryVideo.svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    ariaLabel: string;
  }

  let { items, ariaLabel }: Props = $props();
  const multiple = $derived(items.length > 1);
</script>

<Lightbox.Portal class="stl-portal">
  <Lightbox.Backdrop class="stl-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} class="stl-content">
    {#if multiple}
      <Lightbox.Previous class="stl-nav stl-nav-prev stl-chrome-gesture-hide" aria-label="Previous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </Lightbox.Previous>
    {/if}
    <Lightbox.Stage class="stl-stage">
      {#snippet children({ morphRef })}
        <div class="stl-frame" {@attach morphRef}>
          <Lightbox.Slides aria-label="Stories" aria-roledescription="carousel" preload={1} class="stl-slides">
            {#each items as item, i (item.id ?? i)}
              <Lightbox.Slide class="stl-slide">
                <Lightbox.Item index={i} aria-roledescription="slide" aria-label="{i + 1} of {items.length}">
                  {#snippet children({ active })}
                    <Lightbox.Media
                      width={item.width}
                      height={item.height}
                      class="stl-media stl-card"
                      style="background-image: url({item.poster}); background-size: cover; background-position: center"
                    >
                      <StoryVideo
                        src={item.video}
                        poster={item.poster}
                        alt={item.alt}
                        width={item.width}
                        height={item.height}
                        {active}
                      />
                      <div class="stl-hud">
                        <div class="stl-progress" aria-hidden="true">
                          {#each items as _, j (j)}
                            <span class="stl-progress-seg" data-state={j === i ? 'current' : j < i ? 'past' : 'future'}
                            ></span>
                          {/each}
                        </div>
                        <div class="stl-meta">
                          <img src={item.avatar} alt="" class="stl-meta-avatar" draggable="false" />
                          <div class="stl-meta-text">
                            <span class="stl-meta-name">{item.name}</span>
                            {#if item.time}<span class="stl-meta-time">{item.time}</span>{/if}
                          </div>
                          <Lightbox.Close class="stl-close" aria-label="Close">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.75"
                              aria-hidden="true"
                            >
                              <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </Lightbox.Close>
                        </div>
                      </div>
                    </Lightbox.Media>
                  {/snippet}
                </Lightbox.Item>
              </Lightbox.Slide>
            {/each}
          </Lightbox.Slides>
        </div>
      {/snippet}
    </Lightbox.Stage>
    {#if multiple}
      <Lightbox.Next class="stl-nav stl-nav-next stl-chrome-gesture-hide" aria-label="Next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </Lightbox.Next>
      <Lightbox.Counter class="stl-counter stl-chrome-gesture-hide" />
    {/if}
  </Lightbox.Content>
</Lightbox.Portal>
```

```svelte svelte/src/lib/presets/stories/StoryVideo.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  interface Props {
    src: string;
    poster: string;
    alt: string;
    width: number;
    height: number;
    active: boolean;
  }

  let { src, poster, alt, width, height, active }: Props = $props();
  const lb = Lightbox.getLightbox();

  const playing = $derived(active && lb.open && !lb.pulling && !lb.pullDismissing);

  function playback(video: HTMLVideoElement) {
    if (playing) video.play().catch(() => {});
    else video.pause();
  }
</script>

<video
  {src}
  {poster}
  {width}
  {height}
  playsinline
  muted
  loop
  preload={active ? 'auto' : 'metadata'}
  aria-label={alt}
  class="stl-video"
  {@attach playback}
></video>
```

```css svelte/src/lib/presets/stories/lightbox.css
.stl-portal {
  --stl-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --stl-blue: #007aff;
  --stl-perspective: 720px;
  --stl-scrim: rgb(255 255 255 / 0.72);
  --stl-chrome-bg: rgb(0 0 0 / 0.08);
  --stl-chrome-bg-hover: rgb(0 0 0 / 0.14);
  --stl-chrome-fg: rgb(0 0 0 / 0.88);
  --stl-chrome-fg-muted: rgb(0 0 0 / 0.55);
  --stl-frame-ring: rgb(0 0 0 / 0.12);
  --stl-frame-radius: 1.75rem;
  --stl-card-radius: 8px;
  --stl-stage-bg: #fff;
}

:is(.dark, [data-theme='dark']) .stl-portal {
  --stl-blue: #0a84ff;
  --stl-scrim: rgb(0 0 0 / 0.64);
  --stl-chrome-bg: rgb(255 255 255 / 0.08);
  --stl-chrome-bg-hover: rgb(255 255 255 / 0.14);
  --stl-chrome-fg: rgb(255 255 255 / 0.9);
  --stl-chrome-fg-muted: rgb(255 255 255 / 0.72);
  --stl-frame-ring: rgb(255 255 255 / 0.12);
  --stl-stage-bg: #000;
}

.stl-portal *,
.stl-portal *::before,
.stl-portal *::after {
  box-sizing: border-box;
}

.stl-close,
.stl-nav {
  margin: 0;
  padding: 0;
  font: inherit;
  appearance: none;
}

.stl-meta-avatar {
  display: block;
  max-width: none;
}

.stl-trigger {
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.stl-trigger:focus {
  outline: none;
}

.stl-trigger:focus-visible {
  outline: 2px solid var(--stl-blue);
  outline-offset: 3px;
}

.stl-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: var(--stl-scrim);
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, var(--stl-ease-out));
}

@starting-style {
  .stl-backdrop[data-open] {
    opacity: 0;
  }
}

.stl-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.stl-backdrop[data-pulling] {
  transition: none;
}

.stl-content {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  color: #fafafa;
  transition: opacity var(--lightbox-vt-duration, 360ms) var(--stl-ease-out);
}

@media (min-width: 768px) {
  .stl-content {
    gap: 0.75rem;
    padding: 0 1rem;
  }
}

.stl-content[data-open] {
  opacity: 1;
}

@starting-style {
  .stl-content[data-open] {
    opacity: 0;
  }
}

.stl-stage {
  align-self: stretch;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

@media (min-width: 768px) {
  .stl-stage {
    align-self: center;
    width: auto;
    height: min(100% - 4rem, 52rem);
    aspect-ratio: 9 / 16;
    max-width: calc(100% - 8rem);
  }
}

.stl-frame {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  overflow: clip;
  background: transparent;
}

@media (min-width: 768px) {
  .stl-frame {
    border-radius: var(--stl-frame-radius);
  }
}

.stl-content[data-open] .stl-frame {
  background: #000;
}

@media (max-width: 767px) {
  .stl-content[data-open] .stl-frame {
    background: var(--stl-stage-bg);
  }
}

@media (min-width: 768px) {
  .stl-content[data-open] .stl-frame {
    box-shadow: 0 0 0 0.5px var(--stl-frame-ring);
  }
}

.stl-slides {
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 0;
  scrollbar-width: none;
}

.stl-slides::-webkit-scrollbar {
  display: none;
}

.stl-slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
}

.stl-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overflow: clip;
  background: #0a0a0a;
  border-radius: var(--stl-card-radius);
  transform-origin: center center;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.stl-media {
  width: 100%;
  height: 100%;
}

.stl-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
}

@supports (view-timeline: --stl-stories inline) {
  .stl-slide {
    view-timeline: --stl-stories inline;
  }

  .stl-card {
    animation: stl-flip linear both;
    animation-timeline: --stl-stories;
    animation-range: cover;
  }
}

:root[data-ramka-view-transition] .stl-card {
  animation: none !important;
  transform: none !important;
}

:root[data-ramka-view-transition] .stl-slide:not(:has([data-active])) {
  visibility: hidden;
}

@keyframes stl-flip {
  0% {
    transform: perspective(var(--stl-perspective)) rotateY(89deg);
    transform-origin: left center;
  }
  49% {
    transform: perspective(var(--stl-perspective)) rotateY(0deg);
    transform-origin: left center;
  }
  50% {
    transform: perspective(var(--stl-perspective)) rotateY(0deg);
    transform-origin: center center;
  }
  51% {
    transform: perspective(var(--stl-perspective)) rotateY(0deg);
    transform-origin: right center;
  }
  100% {
    transform: perspective(var(--stl-perspective)) rotateY(-89deg);
    transform-origin: right center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stl-card {
    animation: none;
  }
}

.stl-hud {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: calc(0.625rem + env(safe-area-inset-top, 0px)) 0.75rem 0;
  background: linear-gradient(to bottom, rgb(0 0 0 / 0.45) 0%, rgb(0 0 0 / 0) 7.5rem);
  transition: opacity var(--lightbox-pull-snap-duration, 200ms) var(--lightbox-pull-snap-easing, var(--stl-ease-out));
}

.stl-progress {
  display: flex;
  gap: 3px;
}

.stl-progress-seg {
  flex: 1;
  height: 2px;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.35);
}

.stl-progress-seg[data-state='past'],
.stl-progress-seg[data-state='current'] {
  background: #fff;
}

.stl-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
  min-width: 0;
}

.stl-meta-avatar {
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
  box-shadow: 0 0 0 0.5px rgb(255 255 255 / 0.2);
}

.stl-meta-text {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: baseline;
  gap: 0.375rem;
}

.stl-meta-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #fff;
}

.stl-meta-time {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.65);
}

.stl-close {
  pointer-events: auto;
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-inline-start: auto;
  border: 0;
  border-radius: 9999px;
  background: rgb(0 0 0 / 0.35);
  color: #fff;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  cursor: pointer;
}

.stl-close:hover {
  background: rgb(0 0 0 / 0.5);
}

.stl-close:active {
  transform: scale(0.96);
}

.stl-close:focus {
  outline: none;
}

.stl-close:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.7);
  outline-offset: 2px;
}

.stl-close svg {
  display: block;
  width: 0.875rem;
  height: 0.875rem;
}

.stl-chrome-gesture-hide {
  opacity: 1;
  visibility: visible;
  transition: opacity var(--lightbox-pull-snap-duration, 200ms) var(--lightbox-pull-snap-easing, var(--stl-ease-out));
}

@starting-style {
  .stl-chrome-gesture-hide {
    opacity: 0;
  }
}

.stl-content:is([data-pulling], [data-pull-dismissing]) .stl-chrome-gesture-hide,
.stl-content:is([data-pulling], [data-pull-dismissing]) .stl-hud {
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms;
}

.stl-nav {
  z-index: 1;
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: var(--stl-chrome-bg);
  color: var(--stl-chrome-fg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  cursor: pointer;
  transition:
    background-color 150ms ease-out,
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

@media (min-width: 768px) {
  .stl-nav {
    display: inline-flex;
  }
}

.stl-nav:hover {
  background: var(--stl-chrome-bg-hover);
}

.stl-nav:active {
  transform: scale(0.96);
}

.stl-nav:focus {
  outline: none;
}

.stl-nav:focus-visible {
  outline: 2px solid var(--stl-chrome-fg-muted);
  outline-offset: 2px;
}

.stl-nav:disabled {
  cursor: not-allowed;
  opacity: 0.25;
}

.stl-nav:disabled:active {
  transform: none;
}

.stl-nav svg {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}

.stl-nav:dir(rtl) svg {
  transform: scaleX(-1);
}

.stl-counter {
  direction: ltr;
  unicode-bidi: isolate;
}

.stl-counter {
  display: none;
}

@media (min-width: 768px) {
  .stl-counter {
    position: absolute;
    left: 50%;
    bottom: 1.25rem;
    z-index: 1;
    display: block;
    min-width: 3.5rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    background: var(--stl-chrome-bg);
    color: var(--stl-chrome-fg-muted);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    letter-spacing: 0.02em;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transform: translateX(-50%);
  }
}
```

```svelte svelte/src/lib/presets/stories/Demo.svelte
<script lang="ts">
  import { Lightbox, type LightboxItem } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const mixkit = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
  const mixkitPoster = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`;
  const portrait = (gender: 'women' | 'men', n: number) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

  const story = (id: string, name: string, time: string, avatar: string, clip: number): LightboxItem => ({
    id,
    name,
    time,
    avatar,
    poster: mixkitPoster(clip),
    video: mixkit(clip),
    alt: `${name}’s story`,
    width: 720,
    height: 1280,
  });

  const stories: LightboxItem[] = [
    story('maya', 'Maya', '2h', portrait('women', 44), 40065),
    story('julian', 'Julian', '5h', portrait('men', 32), 43000),
    story('noor', 'Noor', '8h', portrait('women', 68), 43785),
    story('eli', 'Eli', '12h', portrait('men', 75), 40064),
    story('sam', 'Sam', '1d', portrait('men', 22), 44852),
    story('priya', 'Priya', '1d', portrait('women', 21), 50000),
    story('tomas', 'Tomás', '2d', portrait('men', 11), 44600),
    story('aisha', 'Aisha', '2d', portrait('women', 17), 40066),
  ];
</script>

<div class="stories-demo">
  <Lightbox.Root
    loop
    viewTransition="snappy"
    awaitImageDecode={false}
    scrollTriggerIntoView={[
      { type: 'onOpenComplete', behavior: 'instant', inline: 'nearest' },
      { type: 'onChange', behavior: 'instant', inline: 'nearest' },
    ]}
  >
    <p class="title">Stories</p>
    <ul class="tray">
      {#each stories as item, i (item.id)}
        <li>
          <Lightbox.Trigger index={i} aria-label="{item.name}’s story" crossfade="both">
            <img src={item.avatar} alt="" width="56" height="56" class="avatar" draggable="false" />
          </Lightbox.Trigger>
          <span class="name">{item.name}</span>
        </li>
      {/each}
    </ul>
    <CloseOnBack />
    <Lightbox.Gallery items={stories} ariaLabel="Stories" />
  </Lightbox.Root>
</div>

<style>
  .stories-demo {
    width: 100%;
    max-width: 36rem;
  }
  .title {
    margin: 0;
    padding: 0 0.25rem;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.025em;
    color: #171717;
  }
  .tray {
    display: flex;
    gap: 1rem;
    margin: 0.75rem 0 0;
    padding: 0 0.25rem 0.25rem;
    list-style: none;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }
  .tray::-webkit-scrollbar {
    display: none;
  }
  li {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
    width: 4rem;
    scroll-snap-align: center;
    scroll-margin-inline: 1rem;
  }
  .avatar {
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 1.75rem;
    object-fit: cover;
  }
  .name {
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    font-size: 11px;
    line-height: 1.25;
    color: #525252;
  }
  :global(:is(.dark, [data-theme='dark'])) .title {
    color: #fafafa;
  }
  :global(:is(.dark, [data-theme='dark'])) .name {
    color: #a3a3a3;
  }
</style>
```
