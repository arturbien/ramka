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
