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
