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
          A virtualized chat with a thousand messages and one <code className={code}>Lightbox.Root</code> for all of
          them. Every photo is a keyed <code className={code}>Lightbox.Trigger</code> (
          <code className={code}>itemId</code> + <code className={code}>payload</code>) on a shared handle, so tiles
          in different messages never collide and each one still morphs. A &ldquo;+N&rdquo; tile stands in for the
          photos behind it with <code className={code}>overflowItemIds</code>, and{' '}
          <code className={code}>revealTrigger</code> scrolls an unmounted row back so the close morph has somewhere
          to land.
        </>
      }
    >
      <ChatFeed />
    </ExampleShell>
  );
}
