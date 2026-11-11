/** Stand-in for SvelteKit's `$app/state` page: the URL and history state of the Next.js page hosting a demo. */
export const page = $state<{ url: URL; state: App.PageState; shallow: { url: URL } | null }>({
  url: new URL('http://localhost/'),
  state: {},
  shallow: null,
});

/** Copies `location` and `history.state` into `page`. */
export function syncPage() {
  page.url = new URL(location.href);
  page.state = { ...(history.state as App.PageState | null) };
}
