<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let {
    items,
    t,
  }: {
    items: { id: string; src: string; alt: string }[];
    t: (key: string, vars?: Record<string, unknown>) => string;
  } = $props();
</script>

<Lightbox.Root dir="rtl">
  <Lightbox.Portal>
    <Lightbox.Content aria-label={t('viewer.dialog')}>
      <Lightbox.Slides aria-label={t('viewer.photos')} aria-roledescription={t('viewer.carousel')}>
        {#each items as item, i (item.id)}
          <Lightbox.Slide>
            <Lightbox.Item
              index={i}
              aria-roledescription={t('viewer.slide')}
              aria-label={t('viewer.position', { current: i + 1, total: items.length })}
            >
              <Lightbox.Media>
                <img src={item.src} alt={item.alt} />
              </Lightbox.Media>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>

      <Lightbox.Counter>
        {#snippet children({ current, total })}
          {t('viewer.position', { current, total })}
        {/snippet}
      </Lightbox.Counter>

      <Lightbox.Previous aria-label={t('viewer.previous')} />
      <Lightbox.Next aria-label={t('viewer.next')} />
      <Lightbox.Close aria-label={t('viewer.close')} />
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
