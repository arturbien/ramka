'use client';

import { ExampleShell } from '../../../../_components/example-shell';
import { ChatFeed } from './chat-feed';

const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';

export default function SharedLightboxPage() {
  return (
    <ExampleShell
      title="Shared lightbox"
      description={
        <>
          One lightbox, many galleries: a group chat with a thousand messages and a single{' '}
          <code className={code}>Lightbox.Root</code>. Every photo&apos;s <code className={code}>Lightbox.Trigger</code>{' '}
          carries its message as a <code className={code}>payload</code>, and the viewer reads it with{' '}
          <code className={code}>useLightboxPayload()</code>, so opening, swiping and closing never re-render the feed.
          The feed is virtualized, so only the rows on screen exist, along with their Triggers. If the photo you close
          on belongs to an unmounted row, the <code className={code}>reveal</code> option of{' '}
          <code className={code}>scrollTriggerIntoView</code> scrolls it back so the close morph has a tile to land on.
          With <code className={code}>morphTo=&quot;closest&quot;</code>, closing on a photo behind &ldquo;+N&rdquo;
          lands on the &ldquo;+N&rdquo; tile.
        </>
      }
    >
      <ChatFeed />
    </ExampleShell>
  );
}
