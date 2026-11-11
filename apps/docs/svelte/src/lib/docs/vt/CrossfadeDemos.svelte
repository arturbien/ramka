<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';
  import Play from '@lucide/svelte/icons/play';
  import DataTable from '#lib/components/DataTable.svelte';
  import { Separator } from '#lib/components/ui/separator/index.js';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';
  import InitialsTriggers from '../InitialsTriggers.svelte';
  import PlusNTriggers from '../PlusNTriggers.svelte';

  const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';
  const heading = 'text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
  const text = 'text-sm text-neutral-600 dark:text-neutral-400';
  const crossfadeValues = [
    ['undefined', 'Same picture, same intrinsic aspect ratio. Element boxes may differ'],
    ['"both"', 'Trigger ≠ item both ways: stacks, +N overlays, swatches'],
    ['"close"', 'Open frames match, close doesn’t: poster → playing video'],
    ['"open"', 'Rare inverse of close'],
  ];

  const photos = [
    photo('xfade-a', 'Coastal cliffs'),
    photo('xfade-b', 'Mountain lake'),
    photo('xfade-c', 'Desert road'),
  ];
  const album = [
    ...photos,
    photo('xfade-d', 'Pine forest'),
    photo('xfade-e', 'City night'),
    photo('xfade-f', 'Snow peak'),
    photo('xfade-g', 'River bend'),
  ];
  const team = [
    {
      ...photo('xfade-ava', 'Portrait of Ava Chen', 'Ava Chen'),
      name: 'Ava Chen',
      initials: 'AC',
      color: '#2a7ab5',
    },
    {
      ...photo('xfade-jules', 'Portrait of Jules Okonkwo', 'Jules Okonkwo'),
      name: 'Jules Okonkwo',
      initials: 'JO',
      color: '#c93c20',
    },
    {
      ...photo('xfade-sam', 'Portrait of Sam Rivera', 'Sam Rivera'),
      name: 'Sam Rivera',
      initials: 'SR',
      color: '#7a9a6d',
    },
    {
      ...photo('xfade-mei', 'Portrait of Mei Laurent', 'Mei Laurent'),
      name: 'Mei Laurent',
      initials: 'ML',
      color: '#7b3f72',
    },
  ];
  const trailer = {
    ...photo('bbb-poster', 'Big Buck Bunny', 'Big Buck Bunny'),
    video: 'https://download.blender.org/peach/trailer/trailer_iphone.m4v',
    width: 480,
    height: 270,
  };
  let playing = $state(false);

  function playback(video: HTMLVideoElement) {
    if (playing) video.play().catch(() => {});
    else {
      video.pause();
      video.currentTime = 0;
    }
  }
</script>

<div class="flex flex-col gap-10">
  <DataTable columns={['Value', 'Use when']} rows={crossfadeValues}>
    {#snippet cell(value, i)}
      {#if i === 0}<code class="font-mono text-xs">{value}</code>{:else}{value}{/if}
    {/snippet}
  </DataTable>

  <section class="space-y-3">
    <h4 class={heading}>Omit: same picture</h4>
    <p class={text}>
      Same picture and intrinsic aspect ratio; element boxes may differ. Both sides use
      <code class={code}>object-fit: cover</code>. Below: square thumbs → landscape viewer from 3∶2 sources.
    </p>
    <Lightbox.Root>
      <div class="grid max-w-md grid-cols-3 gap-2">
        {#each photos as item, i (item.src)}
          <Lightbox.Trigger
            index={i}
            class="block aspect-square overflow-hidden rounded-lg bg-transparent p-0 {triggerFocus}"
          >
            <img src={item.thumb} alt={item.alt} class="block size-full object-cover" />
          </Lightbox.Trigger>
        {/each}
      </div>
      <LightboxGallery items={photos} ariaLabel="Same-image morph" />
    </Lightbox.Root>
  </section>
  <Separator />

  <section class="space-y-3">
    <h4 class={heading}><code class={code}>crossfade="both"</code>: +N tile</h4>
    <p class={text}>
      Open dissolves the overlay +N tile into a clean photo. Close from a photo without a thumb uses
      <code class={code}>morphTo="closest"</code>.
    </p>
    <Lightbox.Root morphTo="closest">
      <PlusNTriggers items={album} visible={2} />
      <LightboxGallery items={album} ariaLabel="Crossfade both demo" />
    </Lightbox.Root>
  </section>
  <Separator />

  <section class="space-y-3">
    <h4 class={heading}><code class={code}>crossfade="both"</code>: any element</h4>
    <p class={text}>
      Morph sources don’t have to be images: dissolve initials chips into portraits so letters don’t stretch.
    </p>
    <Lightbox.Root>
      <InitialsTriggers people={team} />
      <LightboxGallery items={team} ariaLabel="Team portraits" />
    </Lightbox.Root>
  </section>
  <Separator />

  <section class="space-y-3">
    <h4 class={heading}><code class={code}>crossfade="close"</code>: poster → video</h4>
    <p class={text}>
      Open hard-cuts into the matching poster frame; close dissolves the live video back to the poster.
    </p>
    <Lightbox.Root
      onOpenChange={(open) => !open && (playing = false)}
      onOpenChangeComplete={(open) => (playing = open)}
    >
      <Lightbox.Trigger index={0} crossfade="close" class="group block w-40 bg-transparent p-0 {triggerFocus}">
        {#snippet children({ morphRef })}
          <div class="relative overflow-hidden rounded-xl" {@attach morphRef}>
            <img src={trailer.thumb} alt={trailer.alt} class="block aspect-[2/3] w-full rounded-xl object-cover" />
            <div
              class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-black">
                <Play aria-hidden="true" class="h-4 w-4 fill-current" />
              </div>
            </div>
          </div>
        {/snippet}
      </Lightbox.Trigger>
      <LightboxGallery items={[trailer]} ariaLabel={trailer.alt} thumbnails="never" zoomControls={false}>
        {#snippet item()}
          <Lightbox.Zoom>
            <Lightbox.Media width={trailer.width} height={trailer.height} class="overflow-hidden rounded-xl">
              <video
                src={trailer.video}
                poster={trailer.src}
                width={trailer.width}
                height={trailer.height}
                controls
                playsinline
                muted
                preload="metadata"
                class="object-cover"
                {@attach playback}
              ></video>
            </Lightbox.Media>
          </Lightbox.Zoom>
        {/snippet}
      </LightboxGallery>
    </Lightbox.Root>
  </section>
</div>
