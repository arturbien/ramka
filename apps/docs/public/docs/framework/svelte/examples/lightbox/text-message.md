# Text message

iMessage-style chat with a single morphTo="origin" trigger over a stack of attachments.

## Source

```tsx docs/framework/svelte/examples/lightbox/text-message/page.tsx
import type { Metadata } from 'next';

import { ExampleShell } from '../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Text message example · Svelte',
  description:
    'An iMessage-style chat in Svelte where photo attachments open in a morphing lightbox from a single morphTo="origin" trigger, built with ramka.',
};

export default function SvelteTextMessagePage() {
  return (
    <ExampleShell
      title="Text message"
      description={
        <>
          A single{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Trigger</code> wraps
          an entire stack of attachments. Paired with{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            morphTo=&quot;origin&quot;
          </code>
          , the close animation always returns to the stack no matter which attachment is active.
        </>
      }
    >
      <SvelteDemo id="examples/text-message/TextMessage" />
    </ExampleShell>
  );
}
```

```svelte svelte/src/lib/examples/text-message/TextMessage.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import Gallery from '../photos-app/Gallery.svelte';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const messageImages = [
    { alt: 'Screenshot of a changelog notification' },
    { alt: 'Screenshot of a code review discussion' },
    { alt: 'Screenshot of a pull request overview' },
  ].map((image, i) => {
    const src = `/svelte/examples/text-message/msg${i + 1}.jpg`;
    return { ...image, src, thumb: src, width: 1200, height: 1600 };
  });

  const stackRotations = [0, 2, -6];
  const stackOffsets = [
    { x: 0, y: 0 },
    { x: 10, y: -4 },
    { x: -12, y: 8 },
  ];
</script>

<div class="text-message">
  <Lightbox.Root morphTo="origin">
    <CloseOnBack />
    <div class="text-message-thread">
      <span class="text-message-time">Today at 11:11 AM</span>
      <div class="text-message-bubble">some imgs</div>

      <Lightbox.Trigger index={0} crossfade="close" class="photos-app-lb-trigger text-message-trigger">
        {#snippet children({ morphRef, imageRef })}
          <div class="text-message-stack">
            {#each messageImages as image, i (image.alt)}
              {@const offset = stackOffsets[i]}
              <img
                {@attach i === 0 && morphRef}
                {@attach i === 0 && imageRef}
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                class="text-message-attachment"
                style:transform="translate(-50%, -50%) translate({offset.x}px, {offset.y}px) rotate({stackRotations[
                  i
                ]}deg)"
                style:z-index={messageImages.length - i}
              />
            {/each}
          </div>
        {/snippet}
      </Lightbox.Trigger>

      <div class="text-message-meta">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
          <rect x="5" y="1" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
          <rect x="9" y="3" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
          <rect x="3" y="8" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2" />
        </svg>
        <span>{messageImages.length} attachments</span>
      </div>
    </div>

    <Gallery items={messageImages} ariaLabel="Message attachments" />
  </Lightbox.Root>
</div>

<style>
  .text-message {
    box-sizing: border-box;
    display: flex;
    min-height: 80vh;
    align-items: flex-end;
    justify-content: flex-end;
    border-radius: 1rem;
    background-color: #f5f5f5;
    padding: 1.5rem;
  }
  :global(:is(.dark, [data-theme='dark'])) .text-message {
    background-color: #171717;
  }
  .text-message-thread {
    display: flex;
    max-width: 300px;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }
  .text-message-time {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #737373;
  }
  .text-message-bubble {
    border-radius: 20px 20px 4px 20px;
    background-color: oklch(62.3% 0.214 259.815);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: #fff;
  }
  :global(.text-message-trigger) {
    position: relative;
    display: block;
    height: 20rem;
    width: 260px;
    border-radius: 1rem;
  }
  .text-message-stack {
    position: absolute;
    inset: -1.25rem;
  }
  .text-message-attachment {
    position: absolute;
    left: 50%;
    top: 50%;
    display: block;
    height: 280px;
    width: 200px;
    max-width: none;
    border-radius: 1rem;
    object-fit: cover;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  .text-message-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #737373;
  }
  .text-message-meta svg {
    opacity: 0.4;
  }
</style>
```
