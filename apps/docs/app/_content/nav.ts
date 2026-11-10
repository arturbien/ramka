import { lightboxExamples, type ExampleLink } from '../_components/examples';
import { lightboxPresets } from '../(docs)/presets/presets';
import { debugPagesList } from './debug-pages';
import type { Framework } from './frameworks';
import { lightboxDocsPages } from './lightbox/docs-pages';
import { svelteBase, svelteDocsPagerOrder } from './svelte/docs-pages';
import { svelteExamples, svelteExamplesBase } from './svelte/examples';
import { sveltePresets } from './svelte/presets';

export interface NavLink {
  href: string;
  title: string;
  description?: string;
  /**
   * When true (default for most links), only an exact pathname match is active.
   * Use `prefix` so a parent route stays highlighted on nested pages.
   */
  match?: 'exact' | 'prefix';
}

export interface NavSection {
  title: string;
  links: NavLink[];
  /** Optional nested groups under a section title. */
  groups?: { title: string; links: NavLink[] }[];
}

function toExampleLink(ex: ExampleLink): NavLink {
  return {
    href: `/examples/lightbox/${ex.slug}`,
    title: ex.title,
    description: ex.description,
  };
}

const baseNavSections: NavSection[] = [
  {
    title: 'Getting started',
    links: [{ href: '/docs', title: 'Installation' }],
  },
  {
    title: 'Lightbox',
    links: [
      lightboxDocsPages.overview,
      lightboxDocsPages.stateLifecycle,
      lightboxDocsPages.composition,
      lightboxDocsPages.nextjsImage,
      lightboxDocsPages.viewTransitions,
      lightboxDocsPages.gestures,
      lightboxDocsPages.zoom,
      lightboxDocsPages.rtl,
      lightboxDocsPages.csp,
      lightboxDocsPages.api,
    ],
  },
  {
    title: 'Presets',
    links: lightboxPresets,
  },
  {
    title: 'Examples',
    links: lightboxExamples.map(toExampleLink),
  },
];

const debugNavSection: NavSection = {
  title: 'Debug',
  links: debugPagesList.map((page) => ({
    href: page.href,
    title: page.title,
    description: page.description,
  })),
};

/** Sidebar sections. Debug links are included only outside production builds. */
export const navSections: NavSection[] =
  process.env.NODE_ENV === 'production'
    ? baseNavSections
    : [...baseNavSections, debugNavSection];

const svelteNavSections: NavSection[] = [
  {
    title: 'Getting started',
    links: [{ href: svelteBase, title: 'Installation' }],
  },
  {
    title: 'Lightbox',
    links: svelteDocsPagerOrder,
  },
  {
    title: 'Presets',
    links: sveltePresets,
  },
  {
    title: 'Examples',
    links: svelteExamples.map((ex) => ({
      href: `${svelteExamplesBase}/${ex.slug}`,
      title: ex.title,
      description: ex.description,
      match: 'prefix',
    })),
  },
];

/** Sidebar sections for one framework; React keeps the debug links outside production. */
export function navSectionsFor(framework: Framework): NavSection[] {
  return framework === 'svelte' ? svelteNavSections : navSections;
}
