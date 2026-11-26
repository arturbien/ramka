import { InterceptedViewer } from './photo-viewer';

/**
 * The layout is what makes the parallel-route slot exist: `@modal` renders as
 * the `modal` prop NEXT TO the page, not inside it. During soft navigation to
 * `photos/[id]` the interception route fills this slot while `children` keeps
 * showing the grid the user was on; on hard loads the slot renders
 * `@modal/default.tsx` (null) and `children` is the standalone photo page.
 *
 * The viewer lives here, around both slots, so the grid's tiles can be its
 * Triggers and the close can morph back onto them. The slot only tells it
 * which photo the URL shows.
 */
export default function InterceptedRoutesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <InterceptedViewer>
      {children}
      {modal}
    </InterceptedViewer>
  );
}
