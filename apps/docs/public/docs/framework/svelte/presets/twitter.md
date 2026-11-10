# Twitter

X-style split viewer: a semi-translucent dark media pane with close (top-left) and previous/next on the gallery edges. Desktop keeps a white thread sidebar; mobile shows a bottom engagement bar and opens the thread as a full-screen sheet from the comment control. Copy the **Package** files ( `index.ts`, the `.svelte` files and `lightbox.css`) into your design system, then wire triggers in your app. The **Example** tab shows a three-post feed with Facebook-style image grids: single image, three-up, and a `+N` crossfade tile, each opening the split viewer (scoped CSS only).

## Source

```ts svelte/src/lib/presets/twitter/index.ts
import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import ThreadPanel from './ThreadPanel.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, ThreadAuthor, ThreadPost, ThreadReply } from './ThreadPanel.svelte';

/** Twitter skin: the library primitives with a styled Trigger, the split Gallery and its ThreadPanel. */
export const Lightbox = { ...Primitives, Trigger, Gallery, ThreadPanel };
```

```svelte svelte/src/lib/presets/twitter/Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import Icon from './Icon.svelte';
  import ThreadPanel, { formatCount, type LightboxItem, type ThreadPost } from './ThreadPanel.svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    thread: ThreadPost;
    ariaLabel: string;
  }

  let { items, thread, ariaLabel }: Props = $props();

  const showNav = $derived(items.length > 1);
  const stats = $derived(thread.stats);
  let threadOpen = $state(false);
</script>

<Lightbox.Portal class="xlb-portal">
  <Lightbox.Backdrop class="xlb-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} class={['xlb-content', threadOpen && 'xlb-content-thread-open']}>
    <div class="xlb-media-pane">
      <Lightbox.Close class="xlb-control xlb-close xlb-chrome-pull-hide" aria-label="Close">
        <Icon name="x" />
      </Lightbox.Close>

      <Lightbox.Slides aria-label="Post media" aria-roledescription="carousel" preload={1} class="xlb-slides">
        {#each items as item, i (item.id ?? i)}
          <Lightbox.Slide class="xlb-slide">
            <Lightbox.Item index={i} aria-roledescription="slide" aria-label="{i + 1} of {items.length}">
              <Lightbox.Zoom>
                <Lightbox.Media width={item.width} height={item.height} class="xlb-media">
                  <img
                    width={item.width}
                    height={item.height}
                    src={item.src}
                    alt={item.alt}
                    loading="eager"
                    draggable="false"
                  />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>

      {#if showNav}
        <Lightbox.Previous class="xlb-control xlb-nav xlb-nav-prev xlb-chrome-pull-hide" aria-label="Previous">
          <Icon name="chevron-left" />
        </Lightbox.Previous>
        <Lightbox.Next class="xlb-control xlb-nav xlb-nav-next xlb-chrome-pull-hide" aria-label="Next">
          <Icon name="chevron-right" />
        </Lightbox.Next>
        <Lightbox.Counter class="xlb-counter xlb-chrome-pull-hide" />
      {/if}

      <div class="xlb-mobile-bar xlb-chrome-pull-hide" aria-label="Post actions">
        <button type="button" class="xlb-mobile-action" aria-label="View comments" onclick={() => (threadOpen = true)}>
          <Icon name="reply" />
          <span>{formatCount(stats?.replies)}</span>
        </button>
        <button type="button" class="xlb-mobile-action" aria-label="Repost">
          <Icon name="repost" />
          <span>{formatCount(stats?.reposts)}</span>
        </button>
        <button type="button" class="xlb-mobile-action" aria-label="Like">
          <Icon name="like" />
          <span>{formatCount(stats?.likes)}</span>
        </button>
        <button type="button" class="xlb-mobile-action" aria-label="Views">
          <Icon name="views" />
          <span>{stats?.views ?? '—'}</span>
        </button>
        <button type="button" class="xlb-mobile-action" aria-label="Share">
          <Icon name="share" />
        </button>
      </div>
    </div>

    <ThreadPanel {thread} open={threadOpen} onClose={() => (threadOpen = false)} />
  </Lightbox.Content>
</Lightbox.Portal>
```

```svelte svelte/src/lib/presets/twitter/ThreadPanel.svelte
<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    src: string;
    thumb: string;
    alt: string;
    width: number;
    height: number;
  }

  /** Author of a post or reply. */
  export interface ThreadAuthor {
    name: string;
    handle: string;
    avatar: string;
    verified?: boolean;
  }

  /** One reply under the post. */
  export interface ThreadReply {
    id: string;
    author: ThreadAuthor;
    text: string;
    time: string;
  }

  /** The post shown in the sidebar or mobile sheet. */
  export interface ThreadPost {
    author: ThreadAuthor;
    text: string;
    time: string;
    stats?: {
      replies?: number;
      reposts?: number;
      likes?: number;
      views?: string;
    };
    replies: ThreadReply[];
  }

  /** Compact count: 3842 to 3.8K, 1200000 to 1.2M. */
  export function formatCount(value: number | undefined): string {
    if (value == null) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(value);
  }
</script>

<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import Icon from './Icon.svelte';

  interface Props {
    thread: ThreadPost;
    open: boolean;
    onClose: () => void;
  }

  let { thread, open, onClose }: Props = $props();

  const mobileQuery = new MediaQuery('(max-width: 767px)', false);
  const mobile = $derived(mobileQuery.current);
  const sheetActive = $derived(!mobile || open);
  const stats = $derived(thread.stats);

  function focusOnOpen(scroll: HTMLDivElement) {
    if (open && mobile) scroll.focus({ preventScroll: true });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !mobile || !open) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }
</script>

<aside
  class="xlb-thread-pane"
  aria-label="Post thread"
  data-open={open ? '' : undefined}
  aria-hidden={sheetActive ? undefined : true}
  inert={!sheetActive}
  {onkeydown}
>
  <div class="xlb-thread-header">
    <button type="button" class="xlb-thread-back" aria-label="Close thread" onclick={onClose}>
      <Icon name="x" />
    </button>
    <h2 class="xlb-thread-title">Post</h2>
    <span class="xlb-thread-header-spacer" aria-hidden="true"></span>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div {@attach focusOnOpen} class="xlb-thread-scroll" tabindex="0" role="region" aria-label="Thread">
    <div class="xlb-thread-body">
      <div class="xlb-author">
        <img src={thread.author.avatar} alt="" class="xlb-avatar" draggable="false" />
        <div class="xlb-author-meta">
          <div class="xlb-author-line">
            <span class="xlb-author-name">{thread.author.name}</span>
            {#if thread.author.verified}<Icon name="verified" />{/if}
          </div>
          <div class="xlb-author-line">
            <span class="xlb-author-handle">@{thread.author.handle}</span>
          </div>
        </div>
        <button type="button" class="xlb-follow">Follow</button>
      </div>

      <p class="xlb-post-text">{thread.text}</p>

      <p class="xlb-post-meta">
        <span class="xlb-post-time">{thread.time}</span>
        {#if stats?.views}
          &middot; <strong>{stats.views}</strong> Views
        {/if}
      </p>

      {#if stats}
        <p class="xlb-post-meta">
          <strong>{formatCount(stats.reposts)}</strong> Reposts &middot;
          <strong>{formatCount(stats.likes)}</strong> Likes
        </p>
      {/if}

      <div class="xlb-actions" aria-label="Post actions">
        <button type="button" class="xlb-action" aria-label="Reply">
          <Icon name="reply" />
          {stats?.replies != null ? formatCount(stats.replies) : ''}
        </button>
        <button type="button" class="xlb-action" aria-label="Repost">
          <Icon name="repost" />
          {stats?.reposts != null ? formatCount(stats.reposts) : ''}
        </button>
        <button type="button" class="xlb-action" aria-label="Like">
          <Icon name="like" />
          {stats?.likes != null ? formatCount(stats.likes) : ''}
        </button>
        <button type="button" class="xlb-action" aria-label="Share">
          <Icon name="share" />
        </button>
      </div>
    </div>

    <div class="xlb-reply-box">
      <img src={thread.author.avatar} alt="" class="xlb-avatar xlb-reply-avatar" draggable="false" />
      <input type="text" class="xlb-reply-input" placeholder="Post your reply" aria-label="Post your reply" />
    </div>

    <ul class="xlb-replies" aria-label="Replies">
      {#each thread.replies as reply (reply.id)}
        <li class="xlb-reply">
          <img src={reply.author.avatar} alt="" class="xlb-avatar xlb-reply-avatar" draggable="false" />
          <div class="xlb-author-meta">
            <div class="xlb-author-line">
              <span class="xlb-author-name">{reply.author.name}</span>
              <span class="xlb-author-handle">@{reply.author.handle}</span>
              <span class="xlb-author-handle">· {reply.time}</span>
            </div>
            <p class="xlb-reply-text">{reply.text}</p>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</aside>
```

```svelte svelte/src/lib/presets/twitter/Trigger.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['xlb-trigger', className]} {...rest} />
```

```svelte svelte/src/lib/presets/twitter/Icon.svelte
<script lang="ts">
  let {
    name,
  }: {
    name: 'x' | 'chevron-left' | 'chevron-right' | 'verified' | 'reply' | 'repost' | 'like' | 'views' | 'share';
  } = $props();
</script>

{#if name === 'verified'}
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="xlb-verified">
    <path
      d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-.99-1-2.5-1.27-3.9-.82C14.6 2.9 13.3 2 12 2s-2.6.9-3.06 2.13c-1.4-.45-2.91-.18-3.9.82-1.01 1.01-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1 .99 2.5 1.27 3.9.82.46 1.23 1.76 2.13 3.06 2.13s2.6-.9 3.06-2.13c1.4.45 2.91.18 3.9-.82 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.91 2.19-3.34Zm-6.01-3.77 1.72 1.72-6.01 6.01-3.54-3.54 1.72-1.72 1.82 1.82 4.29-4.29Z"
    />
  </svg>
{:else if name === 'x' || name === 'chevron-left' || name === 'chevron-right'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
    <path
      d={name === 'x' ? 'M18 6 6 18M6 6l12 12' : name === 'chevron-left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
    {#if name === 'reply'}
      <path
        d="M19.5 10.5c0 4.142-3.358 7.5-7.5 7.5-1.38 0-2.67-.37-3.78-1.02L3 19.5V15.3c.65-1.11 1.02-2.4 1.02-3.78 0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'repost'}
      <path
        d="M4.5 9.5 9 5l4.5 4.5M9 5v11.5M19.5 14.5 15 19l-4.5-4.5M15 19V7.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'like'}
      <path
        d="M12 20.25c-.19 0-.38-.07-.53-.2-5.47-4.06-8.97-6.74-8.97-11.1 0-2.98 2.4-5.4 5.36-5.4 1.64 0 3.14.79 4.14 2.02 1-1.23 2.5-2.02 4.14-2.02 2.96 0 5.36 2.42 5.36 5.4 0 4.36-3.5 7.04-8.97 11.1-.15.13-.34.2-.53.2Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'views'}
      <path d="M4 18V10M10 18V6M16 18v-5M20 18V8" stroke-linecap="round" stroke-linejoin="round" />
    {:else}
      <path
        d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14M12 4v11M8.5 7.5 12 4l3.5 3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/if}
  </svg>
{/if}
```

```css svelte/src/lib/presets/twitter/lightbox.css
.xlb-portal {
  --xlb-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --xlb-duration-open: var(--lightbox-vt-duration, 360ms);
  --xlb-thread-width: 22.5rem;
  --xlb-media-bg: transparent;
  --xlb-safe-inline-start: env(safe-area-inset-left, 0px);
  --xlb-safe-inline-end: env(safe-area-inset-right, 0px);
}

.xlb-portal:dir(rtl) {
  --xlb-safe-inline-start: env(safe-area-inset-right, 0px);
  --xlb-safe-inline-end: env(safe-area-inset-left, 0px);
}

:where(.xlb-portal, .xlb-trigger),
:where(.xlb-portal, .xlb-trigger) :where(*, ::before, ::after) {
  box-sizing: border-box;
}

:where(.xlb-portal) :where(p, h2) {
  margin: 0;
}

:where(.xlb-portal) :where(button, input) {
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background-color: transparent;
}

.xlb-trigger {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
}

.xlb-trigger:focus {
  outline: none;
}

.xlb-trigger:focus-visible {
  outline: 2px solid #1d9bf0;
  outline-offset: 2px;
}

.xlb-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background: #000;
  transition: opacity var(--lightbox-pull-snap-duration, var(--xlb-duration-open))
    var(--lightbox-pull-snap-easing, var(--xlb-ease-out));
}

@media (min-width: 768px) {
  .xlb-backdrop {
    background: rgb(0 0 0 / 0.9);
  }
}

@starting-style {
  .xlb-backdrop[data-open] {
    opacity: 0;
  }
}

.xlb-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.75);
}

.xlb-backdrop[data-pulling] {
  transition: none;
}

.xlb-content {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  outline: none;
  opacity: 0;
  transition: opacity var(--xlb-duration-open) var(--xlb-ease-out);
}

.xlb-content[data-open] {
  opacity: 1;
}

@starting-style {
  .xlb-content[data-open] {
    opacity: 0;
  }
}

.xlb-media-pane {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 0%;
  flex-direction: column;
  overflow: hidden;
  background: var(--xlb-media-bg);

  --xlb-inset-top: calc(3rem + env(safe-area-inset-top, 0px));
  --xlb-inset-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
  --xlb-inset-inline: 0px;
}

@media (min-width: 768px) {
  .xlb-media-pane {
    --xlb-inset-inline: 3.5rem;
  }
}

.xlb-slides {
  flex: 1;
  min-height: 0;
  gap: 0;
  scrollbar-width: none;
}

.xlb-slides::-webkit-scrollbar {
  display: none;
}

.xlb-slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: var(--xlb-inset-top) var(--xlb-inset-inline) var(--xlb-inset-bottom);
}

.xlb-media img {
  user-select: none;
  -webkit-user-select: none;
}

.xlb-chrome-pull-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .xlb-chrome-pull-hide {
    opacity: 0;
  }
}

.xlb-content:is([data-pulling], [data-pull-dismissing]) .xlb-chrome-pull-hide {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.xlb-close {
  position: absolute;
  z-index: 2;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  inset-inline-start: calc(0.75rem + var(--xlb-safe-inline-start));
}

.xlb-nav {
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
}

.xlb-nav-prev {
  inset-inline-start: calc(0.75rem + var(--xlb-safe-inline-start));
}

.xlb-nav-next {
  inset-inline-end: calc(0.75rem + var(--xlb-safe-inline-end));
}

.xlb-nav:dir(rtl) svg {
  transform: scaleX(-1);
}

.xlb-control {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: rgb(15 20 25 / 0.65);
  color: #fff;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition:
    background-color 150ms ease-out,
    transform 150ms ease-out,
    opacity 150ms ease-out;
  cursor: pointer;
}

.xlb-control:hover {
  background: rgb(15 20 25 / 0.82);
}

.xlb-control:active {
  transform: scale(0.96);
}

.xlb-nav:active {
  transform: translateY(-50%) scale(0.96);
}

.xlb-control:focus {
  outline: none;
}

.xlb-control:focus-visible {
  box-shadow: 0 0 0 2px #fff;
}

.xlb-control:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.xlb-control:disabled:active {
  transform: none;
}

.xlb-nav:disabled:active {
  transform: translateY(-50%);
}

.xlb-control svg {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
}

.xlb-counter {
  direction: ltr;
  unicode-bidi: isolate;
}

.xlb-counter {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: rgb(255 255 255 / 0.92);
  background: rgb(15 20 25 / 0.55);
}

.xlb-mobile-bar {
  position: absolute;
  z-index: 2;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.625rem 1.25rem calc(0.625rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, rgb(0 0 0 / 0.72), rgb(0 0 0 / 0));
  color: #fff;
}

.xlb-mobile-action {
  display: inline-flex;
  min-width: 2.75rem;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 0;
  border-radius: 9999px;
  padding: 0.4rem 0.35rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.xlb-mobile-action svg {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}

.xlb-mobile-action:focus {
  outline: none;
}

.xlb-mobile-action:focus-visible {
  box-shadow: 0 0 0 2px #fff;
}

@media (min-width: 768px) {
  .xlb-mobile-bar {
    display: none;
  }
}

@media (max-width: 767px) {
  .xlb-media-pane {
    --xlb-inset-bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  }

  .xlb-nav {
    display: none;
  }

  .xlb-counter {
    bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
  }
}

.xlb-thread-pane {
  display: flex;
  min-height: 0;
  flex-direction: column;
  background: #fff;
  color: #0f1419;
}

@media (max-width: 767px) {
  .xlb-thread-pane {
    position: absolute;
    inset: 0;
    z-index: 20;
    width: 100%;
    max-height: none;
    transform: translateY(100%);
    visibility: hidden;
    pointer-events: none;
    transition:
      transform var(--xlb-duration-open) var(--xlb-ease-out),
      visibility 0s linear var(--xlb-duration-open);
  }

  .xlb-thread-pane[data-open] {
    transform: translateY(0);
    visibility: visible;
    pointer-events: auto;
    transition:
      transform var(--xlb-duration-open) var(--xlb-ease-out),
      visibility 0s linear 0s;
  }

  .xlb-content-thread-open .xlb-media-pane {
    visibility: hidden;
  }
}

@media (min-width: 768px) {
  .xlb-content {
    flex-direction: row;
  }

  .xlb-thread-pane {
    position: relative;
    width: var(--xlb-thread-width);
    max-width: 40vw;
    flex: 0 0 var(--xlb-thread-width);
    border-inline-start: 1px solid rgb(239 243 244);
    transform: none;
    visibility: visible;
    pointer-events: auto;
  }
}

.xlb-thread-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  outline: none;
}

.xlb-thread-scroll:focus-visible {
  box-shadow: inset 0 0 0 2px #1d9bf0;
}

.xlb-thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgb(239 243 244);
}

.xlb-thread-back,
.xlb-thread-header-spacer {
  display: none;
}

.xlb-thread-back {
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  padding: 0;
  color: #0f1419;
  background: transparent;
  cursor: pointer;
}

.xlb-thread-back svg {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
}

.xlb-thread-back:focus {
  outline: none;
}

.xlb-thread-back:focus-visible {
  box-shadow: 0 0 0 2px #1d9bf0;
}

.xlb-thread-header-spacer {
  width: 2rem;
  flex-shrink: 0;
}

.xlb-thread-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
}

@media (max-width: 767px) {
  .xlb-thread-back {
    display: inline-flex;
  }

  .xlb-thread-header-spacer {
    display: block;
  }
}

@media (min-width: 768px) {
  .xlb-thread-title {
    flex: 1;
  }
}

.xlb-thread-body {
  padding: 0.875rem 1rem 0;
}

.xlb-author {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.xlb-avatar {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
}

.xlb-author-meta {
  min-width: 0;
  flex: 1;
}

.xlb-author-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.xlb-author-name {
  font-size: 0.9375rem;
  font-weight: 700;
}

.xlb-verified {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  color: #1d9bf0;
}

.xlb-author-handle,
.xlb-post-time {
  font-size: 0.9375rem;
  color: rgb(83 100 113);
}

.xlb-follow {
  flex-shrink: 0;
  border: 1px solid rgb(207 217 222);
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  background: #fff;
  color: #0f1419;
  cursor: pointer;
}

.xlb-post-text {
  margin: 0.75rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

.xlb-post-meta {
  margin-top: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(239 243 244);
  font-size: 0.9375rem;
  color: rgb(83 100 113);
}

.xlb-post-meta strong {
  color: #0f1419;
}

.xlb-actions {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid rgb(239 243 244);
}

.xlb-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  border-radius: 9999px;
  padding: 0.625rem;
  font-size: 0.8125rem;
  color: rgb(83 100 113);
  background: transparent;
  cursor: pointer;
}

.xlb-action svg {
  width: 1.125rem;
  height: 1.125rem;
}

.xlb-reply-box {
  display: flex;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgb(239 243 244);
}

.xlb-reply-input {
  min-width: 0;
  flex: 1;
  border: 0;
  padding: 0.625rem 0;
  font: inherit;
  font-size: 0.9375rem;
  color: inherit;
  background: transparent;
}

.xlb-reply-input::placeholder {
  color: rgb(83 100 113);
}

@media (max-width: 767px) {
  .xlb-reply-input {
    font-size: 1rem;
  }
}

.xlb-reply-input:focus {
  outline: none;
}

.xlb-replies {
  list-style: none;
  margin: 0;
  padding: 0;
}

.xlb-reply {
  display: flex;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgb(239 243 244);
}

.xlb-reply-avatar {
  width: 2rem;
  height: 2rem;
}

.xlb-reply-text {
  margin: 0.125rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.35;
}

:is(.dark, [data-theme='dark']) .xlb-thread-pane {
  background: #000;
  color: #e7e9ea;
  border-inline-start-color: #2f3336;
}

:is(.dark, [data-theme='dark']) :is(.xlb-thread-header, .xlb-post-meta, .xlb-actions, .xlb-reply-box, .xlb-reply) {
  border-bottom-color: #2f3336;
}

:is(.dark, [data-theme='dark']) .xlb-thread-back {
  color: #e7e9ea;
}

:is(.dark, [data-theme='dark']) :is(.xlb-author-handle, .xlb-post-time, .xlb-post-meta, .xlb-action) {
  color: #71767b;
}

:is(.dark, [data-theme='dark']) .xlb-reply-input::placeholder {
  color: #71767b;
}

:is(.dark, [data-theme='dark']) .xlb-post-meta strong {
  color: #e7e9ea;
}

:is(.dark, [data-theme='dark']) .xlb-follow {
  border-color: transparent;
  background: #eff3f4;
  color: #0f1419;
}
```

```svelte svelte/src/lib/presets/twitter/Demo.svelte
<script lang="ts">
  import { Heart, MessageCircle, Repeat2, Share } from '@lucide/svelte';
  import { Lightbox, type LightboxItem, type ThreadPost } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  interface FeedPost {
    id: string;
    time: string;
    thread: ThreadPost;
    images: LightboxItem[];
  }

  const photo = (name: string, alt: string, width: number, height: number): LightboxItem => ({
    src: `/photos/${name}.jpg`,
    thumb: `/photos/${name}-thumb.jpg`,
    alt,
    width,
    height,
  });
  const avatar = (seed: string) => `https://i.pravatar.cc/96?u=${seed}`;

  const feed: FeedPost[] = [
    {
      id: 'post-road-trip',
      time: '2d',
      thread: {
        author: {
          name: 'Tomás Rivera',
          handle: 'tomasrivera',
          avatar: avatar('tomas'),
          verified: true,
        },
        text: 'Week-long road trip along the coast is done. Seven stops, seven completely different landscapes.',
        time: 'Aug 9, 2026 · 6:41 PM',
        stats: { replies: 97, reposts: 514, likes: 3842, views: '212K' },
        replies: [
          {
            id: 'r1',
            author: { name: 'Sofia Lindgren', handle: 'sofialind', avatar: avatar('sofia') },
            text: 'The lighthouse shot is unreal. What time of day was that?',
            time: '1d',
          },
          {
            id: 'r2',
            author: { name: 'James Okafor', handle: 'jamesokafor', avatar: avatar('james') },
            text: 'Route details please — planning the same trip for October.',
            time: '20h',
          },
        ],
      },
      images: [
        photo('rg-6a', 'Dramatic cliffside road at sunset', 1600, 1000),
        photo('rg-6b', 'Turquoise cove with fishing boats', 1600, 1000),
        photo('rg-6c', 'Terraced vineyards in morning mist', 1600, 1000),
        photo('rg-6d', 'Old lighthouse on a rocky headland', 900, 1400),
        photo('rg-6e', 'Wild horses grazing on a dune', 1600, 1000),
        photo('rg-6f', 'Street musicians in a coastal town square', 1200, 1200),
        photo('rg-6g', 'Milky Way over a deserted beach', 1600, 1000),
      ],
    },
    {
      id: 'post-good-light',
      time: '8h',
      thread: {
        author: { name: 'Aisha Patel', handle: 'aishapatel', avatar: avatar('aisha') },
        text: 'Golden hour across the valley, the canopy from below, and still water at dusk. A good day for light.',
        time: 'Aug 11, 2026 · 4:05 AM',
        stats: { replies: 28, reposts: 67, likes: 892, views: '31K' },
        replies: [
          {
            id: 'r1',
            author: { name: 'Marcus Chen', handle: 'marcusc', avatar: avatar('marcus') },
            text: 'That canopy frame is a wallpaper. Straight out of camera?',
            time: '6h',
          },
        ],
      },
      images: [
        photo('rg-3a', 'Rolling fields at golden hour', 1600, 900),
        photo('rg-3b', 'Dense forest canopy from below', 1000, 1400),
        photo('rg-3c', 'Quiet lake reflecting the hills', 1500, 1000),
      ],
    },
    {
      id: 'post-first-light',
      time: '2h',
      thread: {
        author: { name: 'Elena Vasquez', handle: 'elenavsq', avatar: avatar('elena') },
        text: 'First light over the ridgeline this morning — worth every minute of the 4am alarm.',
        time: 'Aug 11, 2026 · 10:12 AM',
        stats: { replies: 12, reposts: 31, likes: 284, views: '9.4K' },
        replies: [
          {
            id: 'r1',
            author: { name: 'Priya Nair', handle: 'priyanair', avatar: avatar('priya') },
            text: 'The 4am alarm gang eats again. Gorgeous.',
            time: '1h',
          },
        ],
      },
      images: [photo('rg-1', 'Mountain range under a wide morning sky', 1600, 1000)],
    },
  ];

  const roots = $state<{ show: (i?: number) => Promise<void> }[]>([]);

  function formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
  }

  function corner(index: number, count: number): string {
    if (count === 2) return index === 0 ? 'round-l' : 'round-r';
    if (count === 3) return index === 0 ? 'round-l' : index === 1 ? 'round-tr' : 'round-br';
    if (count === 4) return ['round-tl', 'round-tr', 'round-bl', 'round-br'][index];
    return 'round';
  }
</script>

{#snippet tile(img: LightboxItem, i: number, count: number, cls: string)}
  <Lightbox.Trigger index={i} class={['tile', corner(i, count), cls]}>
    <img
      src={img.thumb}
      alt={img.alt}
      width={img.width}
      height={img.height}
      class={['tile-img', corner(i, count), cls]}
      draggable="false"
    />
  </Lightbox.Trigger>
{/snippet}

<div class="feed preset-twitter-demo">
  {#each feed as post, p (post.id)}
    {@const author = post.thread.author}
    {@const stats = post.thread.stats}
    {@const count = post.images.length}
    <Lightbox.Root bind:this={roots[p]} loop morphTo={count > 4 ? 'closest' : undefined}>
      <article class="post">
        <img src={author.avatar} alt="" class="avatar" draggable="false" />
        <div class="body">
          <div class="byline">
            <span class="name">{author.name}</span>
            <span class="muted">@{author.handle}</span>
            <span class="muted">· {post.time}</span>
          </div>

          <p class="text">{post.thread.text}</p>

          {#if count === 1}
            {@render tile(post.images[0], 0, 1, 'single')}
          {:else if count === 2}
            <div class="pair grid">
              {#each post.images as img, i (img.src)}
                {@render tile(img, i, 2, 'portrait')}
              {/each}
            </div>
          {:else if count === 3}
            <div class="quad grid">
              {#each post.images.slice(0, 3) as img, i (img.src)}
                {@render tile(img, i, 3, i === 0 ? 'tall' : 'fill')}
              {/each}
            </div>
          {:else}
            <div class="quad grid">
              {#each post.images.slice(0, 4) as img, i (img.src)}
                {@const overlay = i === 3 && count > 4}
                <Lightbox.Trigger
                  index={i}
                  crossfade={overlay ? 'both' : undefined}
                  class={['tile', 'fill', corner(i, 4)]}
                >
                  <span class="morph {corner(i, 4)}" data-ramka-morph>
                    <img src={img.thumb} alt={img.alt} width={img.width} height={img.height} draggable="false" />
                    {#if overlay}
                      <span class="more"><span>+{count - 4}</span></span>
                    {/if}
                  </span>
                </Lightbox.Trigger>
              {/each}
            </div>
          {/if}

          <div class="actions">
            <button type="button" class="action" aria-label="View replies" onclick={() => roots[p]?.show(0)}>
              <MessageCircle aria-hidden="true" />
              <span>{formatCount(stats?.replies ?? 0)}</span>
            </button>
            <button type="button" class="action" aria-label="Repost">
              <Repeat2 aria-hidden="true" />
              <span>{formatCount(stats?.reposts ?? 0)}</span>
            </button>
            <button type="button" class="action" aria-label="Like">
              <Heart aria-hidden="true" />
              <span>{formatCount(stats?.likes ?? 0)}</span>
            </button>
            <button type="button" class="action" aria-label="Share">
              <Share aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      <CloseOnBack />
      <Lightbox.Gallery items={post.images} thread={post.thread} ariaLabel="Photos by {author.name}" />
    </Lightbox.Root>
  {/each}
</div>

<style>
  .feed {
    box-sizing: border-box;
    width: 100%;
    max-width: 36rem;
    overflow: hidden;
    border: 1px solid #e5e5e5;
    border-radius: 1rem;
    background: #fff;
    box-shadow:
      0 1px 3px 0 rgb(0 0 0 / 0.1),
      0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
  .post {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    text-align: start;
  }
  .post:not(:last-child) {
    border-bottom: 1px solid #e5e5e5;
  }
  .avatar {
    display: block;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    border-radius: 9999px;
    object-fit: cover;
  }
  .body {
    min-width: 0;
    flex: 1;
  }
  .byline {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  .name {
    font-weight: 700;
    color: #171717;
  }
  .muted {
    color: #737373;
  }
  .text {
    margin: 0.25rem 0 0.75rem;
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.375;
    color: #171717;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px;
    overflow: hidden;
    border-radius: 0.75rem;
  }
  .quad {
    aspect-ratio: 3 / 2;
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
  .feed :global(.tile) {
    display: block;
    overflow: hidden;
    background: transparent;
    padding: 0;
  }
  .feed :global(.single) {
    width: 100%;
  }
  .feed :global(.tall) {
    grid-row: span 2 / span 2;
  }
  .tile-img,
  .morph img {
    display: block;
    width: 100%;
    object-fit: cover;
  }
  .tile-img.portrait {
    aspect-ratio: 4 / 5;
  }
  .tile-img:is(.tall, .fill),
  .morph img {
    height: 100%;
  }
  .morph {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .more {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 0.5);
  }
  .more span {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
    color: #fff;
  }
  .feed :global(.round) {
    border-radius: 0.75rem;
  }
  .feed :global(.round-l) {
    border-radius: 0.75rem 0 0 0.75rem;
  }
  .feed :global(.round-r) {
    border-radius: 0 0.75rem 0.75rem 0;
  }
  .feed :global(.round-tl) {
    border-top-left-radius: 0.75rem;
  }
  .feed :global(.round-tr) {
    border-top-right-radius: 0.75rem;
  }
  .feed :global(.round-bl) {
    border-bottom-left-radius: 0.75rem;
  }
  .feed :global(.round-br) {
    border-bottom-right-radius: 0.75rem;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0.25rem 0 -0.375rem;
    margin-inline-start: -0.5rem;
    color: #737373;
  }
  .action {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border: 0;
    border-radius: 9999px;
    padding: 0.375rem 0.5rem;
    background: transparent;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1rem;
    color: inherit;
    cursor: pointer;
    transition-property: color, background-color;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .action:hover {
    background: #f5f5f5;
    color: #171717;
  }
  .action :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  :global(.dark) .feed {
    border-color: #404040;
    background: #171717;
  }
  :global(.dark) .post:not(:last-child) {
    border-bottom-color: #262626;
  }
  :global(.dark) .name {
    color: #fafafa;
  }
  :global(.dark) .text {
    color: #f5f5f5;
  }
  :global(.dark) .action:hover {
    background: #262626;
    color: #f5f5f5;
  }
</style>
```
