'use client';

import * as React from 'react';

import { useLightboxStableContextOptional } from './lightbox-context';
import { LightboxTriggerDataAttributes } from './lightbox-data-attributes';
import {
  getLightboxHandleHost,
  registerHandleTrigger,
  subscribeLightboxHandle,
  touchHandleTrigger,
  type LightboxHandle,
  type LightboxHandleTriggerRegistration,
} from './lightbox-handle';
import { prefetchMorphRuntime } from './lightbox-morph-loader';
import { prefetchPullRuntime } from './lightbox-pull-loader';
import { prefetchZoomRuntime } from './lightbox-zoom-loader';
import { MORPH_TARGET_HIDE_CSS, MORPH_TARGET_HIDE_HREF, MORPH_TARGET_HIDE_MARKER } from './morph-target-hide';
import { useLightboxStyleNonce } from './lightbox-csp';
import { HoistableStyle, REACT_SUPPORTS_STYLE_HOISTING } from './react-style-hoisting';
import { ensureLibrarySheet } from './vt-style-sheets';
import { ignoreStateAttribute } from './lightbox-state-attributes';
import { useIsServerPaint } from './use-server-paint';
import { mergeProps } from '../render/merge-props';
import { useRender } from '../render/use-render';

/** Direction(s) in which the trigger↔item morph should crossfade snapshots. */
type LightboxCrossfade = 'open' | 'close' | 'both';

interface LightboxTriggerState extends Record<string, unknown> {
  open: boolean;
  active: boolean;
  morphTarget: boolean;
}

/**
 * Values handed to a trigger's render-function children. Attaching the refs is
 * how a consumer *explicitly* designates the trigger's image and morph element —
 * no `querySelector`/`getComputedStyle` guessing.
 */
interface LightboxTriggerRenderState {
  /**
   * Attach to the trigger's `<img>`. Its already-decoded `currentSrc` is reused
   * as the destination image's placeholder so the open transition never shows a
   * blank frame. Works correctly with `srcSet` (reads the candidate the browser
   * actually fetched). Attach it to the single image whose pixels should bridge
   * — e.g. the photo, *not* a `+N` overlay. This does not control what morphs;
   * use `morphRef` (or the trigger root by default) for that.
   */
  imageRef: (node: HTMLImageElement | null) => void;
  /**
   * Optional. Attach to the element that should morph when it should be a
   * *bigger* element than the image (e.g. a tile that also contains an overlay).
   * When unattached the whole trigger morphs, which already includes any
   * overlay — so you rarely need this. While this trigger is the morph source,
   * `data-morph-target` is set on this node (or on the trigger root when unset).
   */
  morphRef: (node: HTMLElement | null) => void;
  /** Whether the lightbox is open. */
  open: boolean;
  /** Whether this trigger's index is the active item. */
  active: boolean;
}

/**
 * Context published by each `Lightbox.Trigger` so a nested wrapper component —
 * e.g. a shared `<TriggerImage>` — can attach `imageRef` without the consumer
 * threading the render function through it. Mirrors the render function's
 * arguments.
 */
const LightboxTriggerContext = React.createContext<LightboxTriggerRenderState | null>(null);

/**
 * Optional context from the enclosing Trigger. Returns
 * `{ imageRef, morphRef, open, active }`, or `null` outside a Trigger.
 */
function useOptionalLightboxTriggerContext(): LightboxTriggerRenderState | null {
  return React.useContext(LightboxTriggerContext);
}

interface LightboxTriggerBaseProps<Payload = unknown> extends Omit<
  useRender.ComponentProps<'button', LightboxTriggerState>,
  'children'
> {
  /**
   * Handle from `Lightbox.createHandle()`. Pass the same handle as Root to use
   * this Trigger outside the Root tree (Base UI Dialog-style detached triggers).
   */
  handle?: LightboxHandle<Payload>;
  /**
   * Crossfade between trigger and item snapshots during the view-transition
   * morph. Omit (default) for a hard-cut morph — ideal when trigger and item
   * show the same image at the same intrinsic aspect (a CSS `object-cover`
   * window or smaller srcset is fine; a CDN-baked crop that changes the
   * aspect is not). Use a direction when they differ visually:
   * - `'both'` — crossfade on open and close (e.g. a stack → single photo)
   * - `'open'` — crossfade only when opening
   * - `'close'` — crossfade only when closing (e.g. poster → live video)
   *
   * Sets `data-crossfade` on the trigger and `data-ramka-crossfade` on
   * `<html>` during phases that dissolve (omitted for hard-cut).
   */
  crossfade?: LightboxCrossfade;
  /**
   * Static children, or a render function that receives `imageRef` /
   * `morphRef` (attach them to designate the placeholder source and the
   * morph element) plus `open` / `active` state. The render function is the
   * recommended form: it wires the flash-free placeholder without any DOM
   * guessing.
   */
  children?: React.ReactNode | ((state: LightboxTriggerRenderState) => React.ReactNode);
}

/**
 * Every Trigger prop. The exported `LightboxTriggerProps` makes `payload`
 * required once the handle declares a payload type.
 */
interface LightboxTriggerAllProps<Payload = unknown> extends LightboxTriggerBaseProps<Payload> {
  /**
   * The item this trigger opens: the `itemId` of a `Lightbox.Item`. Only
   * triggers whose `itemId` is in the open gallery take part in the morph,
   * placeholders and `morphTo`, so one Root can serve many galleries.
   */
  itemId: string;
  /**
   * Items this trigger stands in for without opening them, for grids whose
   * visible tiles aren't simply the first photos (a curated "Show all
   * photos" tile). While one of them is active the close morph lands on this
   * trigger, crossfading since the tile shows a different photo; an item's
   * own trigger always wins. A "+N" tile after the first photos doesn't need
   * this: `morphTo="closest"` already lands on it.
   */
  overflowItemIds?: readonly string[];
  /**
   * Data for the gallery this trigger opens, read in the viewer with
   * `useLightboxPayload()`. Pass whatever the viewer needs — the full image
   * list, or just an id to look it up by. Required when the handle declares
   * a payload type (`createHandle<Payload>()`), so a trigger can't silently
   * reopen the previous gallery.
   */
  payload?: Payload;
}

type LightboxTriggerProps<Payload = unknown> = unknown extends Payload
  ? LightboxTriggerAllProps<Payload>
  : LightboxTriggerAllProps<Payload> & { payload: Payload };

const OPEN_BIT = 1;
const ACTIVE_BIT = 2;
const MORPH_TARGET_BIT = 4;
const OPENED_BY_THIS_BIT = 8;

const triggerStateAttributesMapping = {
  open: (value: unknown) => (value ? { [LightboxTriggerDataAttributes.open]: '' } : null),
  active: (value: unknown) => (value ? { [LightboxTriggerDataAttributes.active]: '' } : null),
  // Suppress Base UI's default `data-morphtarget` serialization. We set the
  // documented `data-morph-target` imperatively on the resolved morph element
  // (trigger root, or `morphRef` node) instead.
  morphTarget: ignoreStateAttribute,
};

/**
 * A trigger that opens the Lightbox at the item with its `itemId`.
 *
 * By default the trigger element is the morph source for the view
 * transition animation (pass `viewTransition={false}` on Root to opt out).
 *
 * Prefer the render-function form of `children` so you can attach
 * `imageRef` to the trigger's image — that's what lets the destination
 * image reuse the already-decoded thumbnail as a placeholder and avoid a blank
 * frame during the open morph.
 *
 * Pass `handle` (from `Lightbox.createHandle()`) to render this Trigger
 * outside `Lightbox.Root`, matching Base UI Dialog detached triggers.
 */
const LightboxTriggerImpl = React.forwardRef<HTMLButtonElement, LightboxTriggerAllProps>(
  function LightboxTrigger(props, forwardedRef) {
    const {
      render,
      itemId,
      overflowItemIds,
      payload,
      handle: handleProp,
      crossfade,
      children,
      ...elementProps
    } = props;

    // Triggers never write the Root's index maps: the Root joins them to items
    // by `itemId`, through its host — reached via `handle`, or the enclosing
    // Root when there is none.
    const enclosingRootContext = useLightboxStableContextOptional();
    const rootContext = handleProp ? undefined : enclosingRootContext;
    const styleNonce = useLightboxStyleNonce();
    if (!enclosingRootContext && !handleProp) {
      throw new Error(
        'Lightbox.Trigger must be used within a Lightbox.Root, or passed a handle from Lightbox.createHandle()',
      );
    }
    if (process.env.NODE_ENV !== 'production' && typeof itemId !== 'string') {
      console.error('[ramka] Lightbox.Trigger needs an `itemId`: the `itemId` of the Lightbox.Item it opens.');
    }

    const handleTriggerId = React.useId();
    const internalRef = React.useRef<HTMLButtonElement | null>(null);

    // Triggers are an O(n) population (one per grid tile, or thousands in a
    // feed), so each reads one packed PRIMITIVE off the Root's host: a
    // notification (open, navigation, any trigger or item registering)
    // re-renders only the triggers whose own state flipped. A trigger is
    // "open" only while the viewer shows its gallery, so opening one message
    // re-renders that message's tiles, not the feed. Elements (not indexes)
    // decide morph target / opened-by-this-trigger, so duplicates stay apart.
    const subscribeRoot = rootContext?.subscribeKeyed;
    const subscribe = React.useCallback(
      (onStoreChange: () => void) => {
        if (handleProp) return subscribeLightboxHandle(handleProp, onStoreChange);
        return subscribeRoot ? subscribeRoot(onStoreChange) : () => {};
      },
      [handleProp, subscribeRoot],
    );
    const readHost = () => (handleProp ? getLightboxHandleHost(handleProp) : (rootContext?.keyedHost ?? null));
    const readBits = () => {
      const host = readHost();
      if (!host?.getOpen()) return 0;
      const resolved = host.getItemIndex(itemId);
      if (resolved < 0) return 0;
      const el = internalRef.current;
      return (
        OPEN_BIT |
        (host.getActiveIndex() === resolved ? ACTIVE_BIT : 0) |
        (el && host.getMorphTargetElement() === el ? MORPH_TARGET_BIT : 0) |
        (el && host.getOpeningElement() === el ? OPENED_BY_THIS_BIT : 0)
      );
    };
    // Server render (and the hydration render that must match it): items
    // register in effects, which never run there, so read Root's render-time
    // state — the active `itemId`, and the gallery's ids from Root's
    // `itemIds`. The active trigger stamps itself hidden as the morph target
    // (`origin` has no opening trigger on a fresh page, so nothing hides).
    const store = enclosingRootContext?.store ?? null;
    const serverItemIdsRef = rootContext?.serverItemIdsRef;
    const readServerBits = () => {
      const state = store?.getState();
      if (!rootContext || !state?.open) return 0;
      const active = state.activeItemId === itemId;
      const inGallery = active || !!serverItemIdsRef?.current?.has(itemId);
      if (!inGallery) return 0;
      return OPEN_BIT | (active ? ACTIVE_BIT | (state.morphTo === 'origin' ? 0 : MORPH_TARGET_BIT) : 0);
    };
    const bits = React.useSyncExternalStore(subscribe, readBits, readServerBits);
    const open = (bits & OPEN_BIT) !== 0;
    const active = (bits & ACTIVE_BIT) !== 0;
    const morphTarget = (bits & MORPH_TARGET_BIT) !== 0;
    const openedByThisTrigger = (bits & OPENED_BY_THIS_BIT) !== 0;

    // The image node the consumer designated via `imageRef`, if any.
    const imageNodeRef = React.useRef<HTMLImageElement | null>(null);
    // The morph node the consumer designated via `morphRef`, if any.
    const morphNodeRef = React.useRef<HTMLElement | null>(null);
    const registrationRef = React.useRef<LightboxHandleTriggerRegistration | null>(null);

    const registerInRoot = rootContext?.registerKeyedTrigger;
    const touchInRoot = rootContext?.touchKeyedTrigger;
    // Re-sync the registration after its element / image / morph node changed.
    // A no-op until the layout effect below has registered: on first mount the
    // registration reads every ref directly (refs attach before layout effects).
    const syncRegistration = React.useCallback(() => {
      const reg = registrationRef.current;
      if (!reg) return;
      reg.element = internalRef.current;
      reg.image = imageNodeRef.current;
      reg.morphElement = morphNodeRef.current;
      if (handleProp) touchHandleTrigger(handleProp, reg);
      else touchInRoot?.(reg);
    }, [handleProp, touchInRoot]);

    // Content key, not the array: consumers pass a fresh array every render.
    const overflowKey = overflowItemIds?.join('\u0000') ?? '';

    // Register with the handle's Root, or with the enclosing Root.
    React.useLayoutEffect(() => {
      if (!handleProp && !registerInRoot) {
        registrationRef.current = null;
        return;
      }
      const reg: LightboxHandleTriggerRegistration = {
        id: handleTriggerId,
        itemId,
        overflowItemIds: overflowKey ? overflowKey.split('\u0000') : undefined,
        element: internalRef.current,
        image: imageNodeRef.current,
        morphElement: morphNodeRef.current,
      };
      registrationRef.current = reg;
      return handleProp ? registerHandleTrigger(handleProp, reg) : registerInRoot!(reg);
    }, [handleProp, registerInRoot, handleTriggerId, itemId, overflowKey]);

    const mergedRefCallback = React.useCallback(
      (node: HTMLButtonElement | null) => {
        internalRef.current = node;
        syncRegistration();
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef, syncRegistration],
    );

    const imageRef = React.useCallback(
      (node: HTMLImageElement | null) => {
        imageNodeRef.current = node;
        syncRegistration();
      },
      [syncRegistration],
    );

    // Tracks whether this trigger is currently the morph source so `morphRef`
    // can move `data-morph-target` imperatively without setState (inline
    // consumer ref callbacks re-fire null→node every render).
    const isMorphTargetRef = React.useRef(false);
    const morphTargetAttrElRef = React.useRef<HTMLElement | null>(null);

    const syncMorphTargetAttribute = React.useCallback((active: boolean) => {
      const triggerEl = internalRef.current;
      const morphEl = morphNodeRef.current ?? triggerEl;
      const prev = morphTargetAttrElRef.current;
      const attr = LightboxTriggerDataAttributes.morphTarget;

      if (prev && prev !== morphEl) {
        prev.removeAttribute(attr);
      }

      // A server render stamps the attribute on the trigger ROOT (see the
      // SSR-only prop in the render below) — it cannot know whether a
      // `morphRef` node will attach on the client. When one does, the resolved
      // morph element differs from the root, and the root's server-rendered
      // copy is stale: clear it, or the whole trigger stays hidden.
      if (triggerEl && triggerEl !== morphEl) {
        triggerEl.removeAttribute(attr);
      }

      if (active && morphEl) {
        morphEl.setAttribute(attr, '');
        morphTargetAttrElRef.current = morphEl;
      } else {
        morphEl?.removeAttribute(attr);
        if (prev && prev !== morphEl) prev.removeAttribute(attr);
        morphTargetAttrElRef.current = null;
      }
    }, []);

    const morphRef = React.useCallback(
      (node: HTMLElement | null) => {
        morphNodeRef.current = node;
        syncRegistration();
        if (isMorphTargetRef.current) {
          syncMorphTargetAttribute(true);
        }
      },
      [syncRegistration, syncMorphTargetAttribute],
    );

    // Open through the Root's host, with this element as the morph origin.
    const handleClick = React.useCallback(() => {
      const host = handleProp ? getLightboxHandleHost(handleProp) : rootContext?.keyedHost;
      const reg = registrationRef.current;
      if (host && reg) {
        host.openFromTrigger(reg, payload);
      } else {
        // Unbound handle: let it warn.
        handleProp?.open(itemId, { payload });
      }
    }, [handleProp, rootContext, itemId, payload]);

    // Intent warm-up. Wired to hover and focus as well as pointerdown: hover
    // buys a few hundred milliseconds over pointerdown's ~50–150ms, and focus
    // covers keyboard users, who otherwise reach the open with a cold chunk.
    // The loaders memoize, so a grid of triggers only ever does the work once.
    //
    // All three viewer runtimes are warmed. Any chunk still in flight at open
    // time gets fetched+evaluated inside the click→first-frame window, so a
    // cold-cache first open starts visibly later than every other one (and on
    // Gecko, whose composited-morph handover resolves synchronously, that
    // work is skipped out of the morph rather than waited out — see the
    // anchoring note in vt-composited-morph.ts). Interaction-gated on
    // purpose: an idle page-load prefetch would fetch ~20KB of viewer code
    // for every visitor, including the ones who never open a lightbox.
    const warmEngines = React.useCallback(() => {
      // Event-time host read — config, not render state, so no subscription.
      const host = handleProp ? getLightboxHandleHost(handleProp) : rootContext?.keyedHost;
      if (host?.getViewTransition()) prefetchMorphRuntime();
      prefetchZoomRuntime();
      prefetchPullRuntime();
    }, [handleProp, rootContext]);

    const isServerPaint = useIsServerPaint();

    // Disclosure semantics matching Base UI's Dialog.Trigger: the button
    // advertises that it opens a dialog, exposes whether *this* trigger's
    // dialog is currently open, and points at the dialog it controls.
    //
    //  - `aria-haspopup="dialog"` — always (every trigger opens the lightbox).
    //  - `aria-expanded` — true only on the trigger that actually opened the
    //    lightbox (Base UI's `isOpenedByThisTrigger`), so a gallery of triggers
    //    doesn't announce every thumbnail as "expanded" while the viewer is up.
    //    Element identity (not `itemId`) is used so duplicate triggers for one
    //    item stay correct.
    //  - `aria-controls` — the dialog's id, on the opening trigger only while
    //    open (the referenced element is only in the DOM then) — a feed of
    //    thousands shouldn't all point at the viewer.
    const contentId = openedByThisTrigger ? readHost()?.getContentId() : undefined;

    // CSSOM delivery of the morph-target hide rule — the strict-CSP path,
    // mirroring Media's fill rules. The hoistable <style> rendered below covers
    // server paints; where a strict `style-src` refuses it, this copy applies.
    // `ensureLibrarySheet` is once-per-document, so a grid of triggers inserts
    // one sheet. Never released: the rule is structural and page-global — same
    // lifetime it had inside the VT structural sheet that used to ship it.
    React.useInsertionEffect(() => {
      ensureLibrarySheet(MORPH_TARGET_HIDE_MARKER, () => MORPH_TARGET_HIDE_CSS);
    }, []);

    // Publish `data-morph-target` on the resolved morph element (trigger root,
    // or `morphRef` node). No setState here — see `morphRef` / `syncMorphTargetAttribute`.
    //
    // `isServerPaint` is a dep on purpose: the hydration render owns the
    // server-paint stamp as a React prop (see the render below), so the
    // post-hydration flip re-render makes React REMOVE that attribute from the
    // trigger root — clobbering this effect's imperative copy when the
    // resolved morph element IS the root. Re-running on the flip re-applies it
    // in the same commit (mutations land before layout effects), so the active
    // trigger never paints un-hidden.
    React.useLayoutEffect(() => {
      isMorphTargetRef.current = morphTarget;
      syncMorphTargetAttribute(morphTarget);
      return () => {
        isMorphTargetRef.current = false;
        const el = morphTargetAttrElRef.current;
        if (el) {
          el.removeAttribute(LightboxTriggerDataAttributes.morphTarget);
          morphTargetAttrElRef.current = null;
        }
      };
    }, [morphTarget, syncMorphTargetAttribute, isServerPaint]);

    const state = React.useMemo<LightboxTriggerState>(
      () => ({ open, active, morphTarget }),
      [open, active, morphTarget],
    );

    const renderState = React.useMemo<LightboxTriggerRenderState>(
      () => ({ imageRef, morphRef, open, active }),
      [imageRef, morphRef, open, active],
    );

    const resolvedChildren = typeof children === 'function' ? children(renderState) : children;

    const rendered = useRender({
      render,
      ref: mergedRefCallback,
      state,
      stateAttributesMapping: triggerStateAttributesMapping,
      props: mergeProps<'button'>(
        {
          type: 'button',
          'aria-haspopup': 'dialog',
          'aria-expanded': openedByThisTrigger,
          ...(contentId ? { 'aria-controls': contentId } : null),
          onClick: handleClick,
          onPointerEnter: warmEngines,
          onFocus: warmEngines,
          onPointerDown: warmEngines,
          // Stable styling hook — consumer CSS can target every trigger
          // (e.g. for a default focus outline) without relying on
          // state-only attributes like `data-popup-open` or `data-active`.
          // Mirrors the `data-ramka-item` hook on Lightbox.Item.
          [LightboxTriggerDataAttributes.trigger]: '',
          ...(crossfade ? { [LightboxTriggerDataAttributes.crossfade]: crossfade } : undefined),
          // SERVER PAINT ONLY: on the client `data-morph-target` is managed
          // imperatively (it may belong to a `morphRef` node — see
          // `syncMorphTargetAttribute`), but a page that server-renders an open
          // lightbox would otherwise paint the active trigger un-hidden until
          // hydration. The trigger root is the best-effort stand-in the server
          // can know about; the hydration layout effect re-syncs to the
          // resolved morph element and clears this copy if that's a `morphRef`
          // node.
          //
          // Gated on `useIsServerPaint` — NOT `typeof window` — so the
          // hydration render also includes the prop (matching the server
          // byte-for-byte; React 19 warns on attributes the server rendered
          // but hydration didn't). On the post-hydration flip React removes
          // its copy, and the layout effect above (which re-runs on the flip)
          // restores the imperative one in the same commit.
          //
          // During the server paint `morphTarget` comes from the server
          // snapshot: the active trigger, unless `morphTo` is `origin` (a
          // server-rendered page has no opening trigger).
          ...(morphTarget && isServerPaint ? { [LightboxTriggerDataAttributes.morphTarget]: '' } : null),
        } as React.ComponentPropsWithRef<'button'>,
        elementProps as React.ComponentPropsWithRef<'button'>,
        { children: resolvedChildren } as React.ComponentPropsWithRef<'button'>,
      ),
      defaultTagName: 'button',
    });

    return (
      <LightboxTriggerContext.Provider value={renderState}>
        {/*
          Markup delivery of the morph-target hide rule — the SERVER-PAINT
          path (same dual-path pattern as Media's fill rules). Effects never
          run during server rendering, so without this a server-rendered open
          lightbox would paint its active trigger visible: the rule used to
          arrive only with the first view transition of the session. React 19
          hoists this into <head> and dedupes by `href` across every trigger
          and remount (constant rule text keeps the dedupe sound).
          React-19-only — React 18 has no hoisting and would render one inline
          tag per trigger (a 200-tile grid ships 200 copies and shifts
          consumers' :nth-child selectors), so it keeps the CSSOM-only
          baseline; see react-style-hoisting.ts. Under a strict `style-src`
          the tag is refused unless `Lightbox.CSPProvider` supplies the
          page's nonce (React 19.2+); otherwise the CSSOM copy above takes
          over.
        */}
        {REACT_SUPPORTS_STYLE_HOISTING ? (
          <HoistableStyle href={MORPH_TARGET_HIDE_HREF} precedence="ramka" nonce={styleNonce}>
            {MORPH_TARGET_HIDE_CSS}
          </HoistableStyle>
        ) : null}
        {rendered}
      </LightboxTriggerContext.Provider>
    );
  },
);

LightboxTriggerImpl.displayName = 'LightboxTrigger';

// Re-typed so `payload` is checked against the handle's payload type.
const LightboxTrigger = LightboxTriggerImpl as (<Payload = unknown>(
  props: LightboxTriggerProps<Payload> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null) & { displayName?: string };

export { LightboxTrigger, LightboxTriggerContext, useOptionalLightboxTriggerContext };
export type {
  LightboxTriggerProps,
  LightboxTriggerAllProps,
  LightboxTriggerState,
  LightboxTriggerRenderState,
  LightboxCrossfade,
};
