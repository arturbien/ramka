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
