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
