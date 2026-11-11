<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    src: string;
    thumb?: string;
    alt: string;
    caption?: string;
    credit?: string;
    width: number;
    height: number;
  }
</script>

<script lang="ts">
  import Backdrop from './Backdrop.svelte';
  import Caption from './Caption.svelte';
  import Close from './Close.svelte';
  import Content from './Content.svelte';
  import Counter from './Counter.svelte';
  import Item from './Item.svelte';
  import Media from './Media.svelte';
  import Next from './Next.svelte';
  import Portal from './Portal.svelte';
  import Previous from './Previous.svelte';
  import Slide from './Slide.svelte';
  import Slides from './Slides.svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    ariaLabel: string;
  }

  let { items, ariaLabel }: Props = $props();

  const multiple = $derived(items.length > 1);
</script>

<Portal>
  <Backdrop />
  <Content aria-label={ariaLabel}>
    <Slides aria-label="Article photographs" aria-roledescription="carousel" preload={2}>
      {#each items as item, i (item.id ?? i)}
        {#snippet figureCaption()}
          {#if item.caption}<span class="elb-caption-text">{item.caption}</span>{/if}
          {#if item.credit}<span class="elb-credit">{item.credit}</span>{/if}
        {/snippet}
        <Slide>
          <Item
            index={i}
            caption={item.caption || item.credit ? figureCaption : undefined}
            aria-roledescription="slide"
            aria-label="{i + 1} of {items.length}"
          >
            <Media width={item.width} height={item.height}>
              <img
                width={item.width}
                height={item.height}
                src={item.src}
                alt={item.alt}
                loading="eager"
                draggable="false"
              />
            </Media>
          </Item>
        </Slide>
      {/each}
    </Slides>

    <div class="elb-top elb-chrome-gesture-hide">
      {#if multiple}
        <Counter>
          {#snippet children({ current, total })}{current} / {total}{/snippet}
        </Counter>
      {:else}
        <span></span>
      {/if}
      <Close />
    </div>

    {#if multiple}
      <Previous class="elb-chrome-gesture-hide" />
      <Next class="elb-chrome-gesture-hide" />
    {/if}

    <div class="elb-bottom elb-chrome-gesture-hide">
      <Caption />
    </div>
  </Content>
</Portal>
