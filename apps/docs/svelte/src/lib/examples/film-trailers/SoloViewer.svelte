<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Lightbox } from '@ramka/svelte';
  import X from '@lucide/svelte/icons/x';
  import './viewer.css';

  interface Props {
    ariaLabel: string;
    caption: string;
    preload?: number;
    pullToClose?: boolean;
    children: Snippet;
  }

  let { ariaLabel, caption, preload = 3, pullToClose = true, children }: Props = $props();
</script>

<Lightbox.Portal>
  <Lightbox.Backdrop class="film-trailers-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} {pullToClose} class="film-trailers-content">
    <Lightbox.Slides
      aria-label="Full-size images"
      aria-roledescription="carousel"
      {preload}
      class="film-trailers-slides"
    >
      <Lightbox.Slide>
        <Lightbox.Item index={0} {caption} aria-roledescription="slide" aria-label="1 of 1">
          {@render children()}
        </Lightbox.Item>
      </Lightbox.Slide>
    </Lightbox.Slides>

    <div class="film-trailers-chrome-top film-trailers-chrome-hide">
      <Lightbox.Close class="film-trailers-button" aria-label="Close">
        <X aria-hidden="true" strokeWidth={2.25} />
        <span class="film-trailers-tooltip" aria-hidden="true">Close</span>
      </Lightbox.Close>
    </div>

    <div class="film-trailers-chrome-bottom film-trailers-chrome-hide">
      <div class="film-trailers-caption-group">
        <Lightbox.Caption class="film-trailers-caption" />
      </div>
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
