// @vitest-environment node
//
// Server rendering of a deep link by `itemId`: the server has no registered
// Items yet, so Root's `itemIds` is the only way to place the active item.
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LightboxContent } from './lightbox-content';
import { LightboxCounter } from './lightbox-counter';
import { LightboxPortal } from './lightbox-portal';
import { LightboxRoot } from './lightbox-root';
import { LightboxTrigger } from './lightbox-trigger';

const IDS = ['sea', 'sky', 'sand'] as const;

function attrsOf(html: string, tag: string, testid: string): string {
  const chunk = html
    .split(`<${tag}`)
    .slice(1)
    .find((c) => c.slice(0, c.indexOf('>')).includes(`data-testid="${testid}"`));
  expect(chunk, `${tag} ${testid} in server HTML`).toBeTruthy();
  return chunk!.slice(0, chunk!.indexOf('>'));
}

function Page({ itemIds }: { itemIds?: readonly string[] }) {
  return (
    <LightboxRoot defaultOpen defaultValue="sky" itemIds={itemIds}>
      {IDS.map((id) => (
        <LightboxTrigger key={id} itemId={id} data-testid={`t-${id}`}>
          {id}
        </LightboxTrigger>
      ))}
      <LightboxPortal container={null}>
        <LightboxContent aria-label="viewer">
          <LightboxCounter data-testid="counter" />
        </LightboxContent>
      </LightboxPortal>
    </LightboxRoot>
  );
}

describe('server rendering a deep link by itemId', () => {
  it('stamps data-morph-target on the trigger named by defaultValue', () => {
    const html = renderToString(<Page itemIds={IDS} />);
    expect(attrsOf(html, 'button', 't-sky')).toContain('data-morph-target');
    expect(attrsOf(html, 'button', 't-sea')).not.toContain('data-morph-target');
    expect(attrsOf(html, 'button', 't-sand')).not.toContain('data-morph-target');
  });

  it('places the counter at the item named by defaultValue when itemIds is passed', () => {
    const html = renderToString(<Page itemIds={IDS} />);
    expect(html).toContain('2 / 3');
  });

  it('marks the active trigger without itemIds', () => {
    const html = renderToString(<Page />);
    expect(attrsOf(html, 'button', 't-sky')).toContain('data-morph-target');
  });
});
