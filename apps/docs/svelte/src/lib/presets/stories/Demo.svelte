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
