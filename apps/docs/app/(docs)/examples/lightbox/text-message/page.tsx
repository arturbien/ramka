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
          all of them. Every photo is a keyed <code className={code}>Lightbox.Trigger</code> (
          <code className={code}>itemId</code> + <code className={code}>payload</code>), so tiles in different messages
          never collide and each one still morphs. The viewer reads the opening message with{' '}
          <code className={code}>useLightboxPayload()</code>; opening, swiping and closing never re-render the feed. A
          &ldquo;+N&rdquo; tile stands in for the photos behind it with <code className={code}>overflowItemIds</code>,
          and <code className={code}>revealTrigger</code> scrolls an unmounted row back so the close morph has somewhere
          to land.
        </>
      }
    >
      <ChatFeed />
    </ExampleShell>
  );
}
