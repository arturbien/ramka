'use client';

import { ExampleShell } from '../../../../_components/example-shell';
import { ChatFeed } from './chat-feed';

const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';

export default function TextMessagePage() {
  return (
    <ExampleShell
      title="Text message"
      description={
        <>
          A virtualized group chat with a thousand messages and one <code className={code}>Lightbox.Root</code> wrapping
          all of them. Every photo&apos;s <code className={code}>Lightbox.Trigger</code> carries its message as a{' '}
          <code className={code}>payload</code>, and the viewer reads it with{' '}
          <code className={code}>useLightboxPayload()</code>; opening, swiping and closing never re-render the feed.
          With <code className={code}>morphTo=&quot;closest&quot;</code>, closing on a photo behind &ldquo;+N&rdquo;
          lands on the &ldquo;+N&rdquo; tile, and <code className={code}>revealTrigger</code> scrolls an unmounted row
          back so the close morph has somewhere to land.
        </>
      }
    >
      <ChatFeed />
    </ExampleShell>
  );
}
