# Content Security Policy

Running the lightbox on pages with a strict `style-src`. Part of [Lightbox](docs/framework/svelte/lightbox.md).

## What the library injects

The library is headless (your chrome, your CSS), but its structural rules have to come from somewhere. They live in one stylesheet with constant text. When the first Root or Trigger mounts, the library prepends it to `<head>` as a `<style data-ramka>` tag, so your own CSS still wins on equal specificity.

If a strict `style-src` refuses that tag, the library notices and delivers the same rules through a [constructed stylesheet](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet) instead, which CSP does not police at all. Everything keeps working with no configuration. The only thing a strict policy can cost is the first paint of a page that server-renders an *open* lightbox: that page carries the same tag inline so media fits, the active trigger hides, and the initial slide sits in place before any code runs. Refused, those first-paint details wait for hydration.

This differs from `@ramka/react`, which splits the rules across three tags and relies on React’s style hoisting. The Svelte port keeps one tag and one fallback.

## Passing a nonce

The standard way to allow specific inline styles is a [nonce](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src#unsafe_inline_styles) : the server generates a random value per request, puts it in the header, and any `<style>` carrying the same value is allowed. Wrap [CSPProvider](docs/framework/svelte/lightbox/api.md#api-csp-provider) around everything that renders lightbox parts and pass it that value; the library stamps it on the tag it inserts.

In SvelteKit, mint the nonce in `handle`, keep it on `event.locals` (declare `nonce: string` on `App.Locals`), and hand it to the root layout through a server load:

```typescript src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const nonce = crypto.randomUUID();
  event.locals.nonce = nonce;
  const response = await resolve(event);
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; style-src-elem 'self' 'nonce-${nonce}'; style-src-attr 'unsafe-inline';`
  );
  return response;
};
```

```typescript src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({ nonce: locals.nonce });
```

```svelte src/routes/+layout.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { data, children } = $props();
</script>

<Lightbox.CSPProvider nonce={data.nonce}>
  {@render children()}
</Lightbox.CSPProvider>
```

Put it above the *whole* app, not around one gallery. A detached [Trigger](docs/framework/svelte/lightbox/api.md#api-trigger) living outside any Root reads the context too, and whichever part mounts first inserts the tag, so an uncovered Trigger would insert it without the nonce.

SvelteKit’s own `csp` option (with `mode: 'nonce'`) covers the scripts and styles Kit renders, but it does not hand its nonce to components. If you use it, either let your `handle` own the style directive as above, or rely on the constructed-stylesheet fallback.

## Server rendering

A Root that renders open on the server writes its tag straight into the HTML, nonce included, because Svelte components render their own markup. There is no framework call to thread the nonce through, so deep-linked pages that server-render an open viewer keep their first-paint styling under a strict policy. React needs the nonce passed to the render call as well, and Next.js does not forward it yet; that limit does not apply here.

Prerendered pages have no request to mint a nonce for. Use a hash-based policy for those (see below).

## Inline style attributes

Separate from `<style>` elements, CSP also governs `style="…"` attributes, and nonces cannot be applied to attributes at all. The library’s structural styles ride on inline attributes, which only matters for markup parsed from server HTML: styles set from JavaScript after hydration are not policed. If you server-render lightbox pages under a policy stricter than `style-src` alone, split the directives and keep `'unsafe-inline'` on the attribute half:

```tsx CSP header
Content-Security-Policy:
  default-src 'self';
  style-src-elem 'self' 'nonce-<generated-per-request>';
  style-src-attr 'unsafe-inline';
```

This is the industry-standard shape: Base UI and Material UI document the same split. Style *attributes* cannot exfiltrate data or execute code the way style elements can, so allowing them is a far smaller concession than `'unsafe-inline'` on elements.

## Hash-based policies

Statically hosted sites have no server to mint a per-request nonce. CSP’s alternative is a hash source: allow exactly this style block by its SHA-256. That is normally impractical for component libraries, but the library’s tag has *constant* text by design, so its hash is stable for a given release. The quickest way to collect it is the browser itself: load a page with the policy enforced and copy the `sha256-…` value Chrome prints in the console violation message into `style-src`. Collect it again when you upgrade the package, because the rule text can change between releases.
