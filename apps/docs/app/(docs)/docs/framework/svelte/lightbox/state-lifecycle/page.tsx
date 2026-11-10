import type { Metadata } from 'next';

import { DocsDemo } from '../../../../../../_components/docs-demo';
import { DocsLink } from '../../../../../../_components/docs-link';
import { DocsPager } from '../../../../../../_components/docs-pager';
import { DocsSection, DocsShell, type DocsTocItem } from '../../../../../../_components/docs-shell';
import { SvelteDemo } from '../../../../../../_components/svelte-demo';
import { svelteApiHref, svelteDocsPages } from '../../../../../../_content/svelte/docs-pages';
import { svelteExamplesBase } from '../../../../../../_content/svelte/examples';
import { svelteExcerpts } from '../../../../../../_content/svelte/excerpts/generated';

export const metadata: Metadata = {
  title: 'State and lifecycle · Svelte',
  description:
    'Controlled and uncontrolled lightbox state in Svelte: bind:open and bind:index, imperative handles with createHandle, and lifecycle callbacks like onBeforeOpen.',
};

const toc: DocsTocItem[] = [
  { id: 'controlled', title: 'Controlled state' },
  { id: 'imperative', title: 'Imperative API' },
  { id: 'lifecycle', title: 'Lifecycle callbacks' },
  { id: 'before-open', title: 'onBeforeOpen' },
  { id: 'before-close', title: 'onBeforeClose' },
];

export default function SvelteStateLifecyclePage() {
  return (
    <DocsShell
      title="State & lifecycle"
      description={
        <>
          Control open state and the active index with bindings, <code className="text-xs">createHandle()</code>, or
          both, and know when callbacks fire. Part of <DocsLink href={svelteDocsPages.overview.href}>Lightbox</DocsLink>
          .
        </>
      }
      toc={toc}
    >
      <DocsSection id="controlled" title="Controlled state">
        <p>
          Bind <code className="text-xs">open</code> and <code className="text-xs">index</code> on{' '}
          <DocsLink href={svelteApiHref.root}>Root</DocsLink> to drive the lightbox from URL params, a store, or sibling
          UI. Leave them unbound and Root keeps its own state, starting closed at index 0.
        </p>
        <p>
          The React version splits this into <code className="text-xs">open</code>/
          <code className="text-xs">onOpenChange</code>, <code className="text-xs">value</code>/
          <code className="text-xs">onValueChange</code>, and <code className="text-xs">defaultOpen</code>/
          <code className="text-xs">defaultValue</code>. In Svelte, <code className="text-xs">bind:</code> covers all
          three: pass a plain value for the initial state, bind it to control it.
        </p>
        <DocsDemo code={svelteExcerpts['controlled-state'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/state/ControlledDemo" />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="imperative" title="Imperative API">
        <p>
          <DocsLink href={svelteApiHref.root}>Lightbox.createHandle()</DocsLink> lets Triggers and Root live apart: pass
          the same handle to both. Call <code className="text-xs">open(index, &#123; triggerId &#125;)</code> from any
          button so the open still morphs from the matching <DocsLink href={svelteApiHref.trigger}>Trigger</DocsLink>.
          The handle also has <code className="text-xs">close()</code>, <code className="text-xs">goTo(index)</code>,
          and a reactive <code className="text-xs">isOpen</code>.
        </p>
        <DocsDemo code={svelteExcerpts['create-handle'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/state/HandleDemo" />
        </DocsDemo>
        <p>
          Inside one component you can skip the handle: <code className="text-xs">bind:this</code> on Root exposes{' '}
          <code className="text-xs">show(index)</code> and <code className="text-xs">close()</code>.
        </p>
      </DocsSection>

      <DocsSection id="lifecycle" title="Lifecycle callbacks">
        <p>
          <code className="text-xs">onOpenChange</code> fires immediately when open flips: use it to sync the URL or
          external state. <code className="text-xs">onOpenChangeComplete</code> fires after enter and exit motion
          settles: use it for cleanup and focus. <code className="text-xs">onValueChange</code> reports the new index
          plus a <DocsLink href={svelteApiHref.types}>NavigationSource</DocsLink> (including{' '}
          <code className="text-xs">imperative</code> for handle navigation).
        </p>
        <DocsDemo code={svelteExcerpts['lifecycle-callbacks'].code} title="Gallery.svelte" lang="svelte">
          <SvelteDemo id="docs/state/LifecycleDemo" />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="before-open" title="onBeforeOpen">
        <p>
          When View Transitions are on, open is <em>prepare → optional image decode → optional onBeforeOpen → morph</em>
          . Use <DocsLink href={svelteApiHref.root}>Root</DocsLink>’s <code className="text-xs">onBeforeOpen</code> to
          delay the morph until custom media is ready (iframe <code className="text-xs">load</code>, video, WebGL). It
          runs after the lightbox is mounted hidden, so destination nodes exist, and before{' '}
          <code className="text-xs">startViewTransition</code>.
        </p>
        <p>
          Keep <code className="text-xs">awaitImageDecode</code> for photos (default{' '}
          <code className="text-xs">true</code>). For non-image destinations, pass{' '}
          <code className="text-xs">awaitImageDecode=&#123;false&#125;</code> and wait in{' '}
          <code className="text-xs">onBeforeOpen</code>. Bound your own timeout;{' '}
          <code className="text-xs">ctx.signal</code> aborts if a newer open or close wins. See{' '}
          <DocsLink href={`${svelteExamplesBase}/3d-models`}>3D models</DocsLink>.
        </p>
      </DocsSection>

      <DocsSection id="before-close" title="onBeforeClose">
        <p>
          <code className="text-xs">onBeforeClose</code> fires synchronously when close begins and, with View
          Transitions, <em>before</em> the old snapshot is captured. Use it to freeze custom media (
          <code className="text-xs">video.pause()</code>, stop a rAF loop) so the close morph isn’t a mid-frame. Unlike{' '}
          <code className="text-xs">onBeforeOpen</code>, it cannot delay close.{' '}
          <code className="text-xs">onOpenChange(false)</code> is too late for this: it runs inside the transition
          callback, after the snapshot.
        </p>
      </DocsSection>

      <DocsPager prev={svelteDocsPages.overview} next={svelteDocsPages.composition} />
    </DocsShell>
  );
}
