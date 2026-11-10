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
