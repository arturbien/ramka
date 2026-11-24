/**
 * Base UI–style imperative handle for Lightbox.
 *
 * `createHandle()` returns a stable object you pass to `Lightbox.Root` (and
 * optionally to detached `Lightbox.Trigger`s) for programmatic control.
 */

interface LightboxHandleOpenOptions<Payload = unknown> {
  /**
   * ID of a `Lightbox.Trigger` registered with this handle (Trigger `id` +
   * `handle`). Associates the open with that trigger for morph, placeholder,
   * and focus return — including when several triggers share one index.
   */
  triggerId?: string;
  /**
   * Open at the `Lightbox.Item` registered with this `itemId` instead of a
   * numeric index. The index is resolved once the payload's items mount, so
   * the caller never needs to know where the item sits in the viewer.
   */
  itemId?: string;
  /**
   * Data for this open, handed to Root's render-function `children` as
   * `payload`. Committed in the same synchronous pre-mount as the viewer, so
   * the items it describes exist before the morph captures anything. Omit to
   * keep the current payload.
   */
  payload?: Payload;
}

interface LightboxHandle<Payload = unknown> {
  /**
   * Open the lightbox. Optional `index` sets the active item. Pass
   * `options.triggerId` to associate the open with a registered Trigger so
   * view-transition morph / placeholders can use that element, and
   * `options.payload` / `options.itemId` to open a payload-driven gallery.
   * Opening by `itemId` morphs from that item's mounted keyed Trigger, if any.
   *
   * Call only from an event handler or effect — not during render.
   */
  open(index?: number, options?: LightboxHandleOpenOptions<Payload>): void;
  open(options: LightboxHandleOpenOptions<Payload>): void;
  /** Close the lightbox. */
  close(): void;
  /**
   * Navigate to an index, or to the mounted `Lightbox.Item` with this `itemId`
   * (source: `imperative`). Does not open.
   */
  goTo(index: number): void;
  goTo(target: { itemId: string }): void;
  /** Whether the bound Root is currently open. */
  readonly isOpen: boolean;
}

/** Trigger snapshot registered with a handle (may live outside Root). */
interface LightboxHandleTriggerRegistration {
  id: string;
  index: number;
  /** Item key for keyed triggers (`itemId` prop); resolves the index via Root's items. */
  itemId?: string;
  /** Items this trigger stands in for without opening them (Trigger `overflowItemIds`). */
  overflowItemIds?: readonly string[];
  element: HTMLElement | null;
  image: HTMLImageElement | null;
  morphElement: HTMLElement | null;
}

/** Bound Root host — set while a Root with this handle is mounted. */
interface LightboxHandleHost {
  open: (index?: number, options?: LightboxHandleOpenOptions) => void;
  /** Open from a keyed Trigger's registration (its element is the morph origin). */
  openFromTrigger: (reg: LightboxHandleTriggerRegistration, payload: unknown) => void;
  close: () => void;
  goTo: (target: number | { itemId: string }) => void;
  getOpen: () => boolean;
  getActiveIndex: () => number;
  /** Viewer index of the mounted item with this `itemId`, or -1. */
  getItemIndex: (itemId: string) => number;
  /** Trigger element that opened the lightbox, if any. */
  getOpeningElement: () => HTMLElement | null;
  /** Trigger element the close morph will land on right now, if any. */
  getMorphTargetElement: () => HTMLElement | null;
  /** DOM id of the dialog, for `aria-controls`. */
  getContentId: () => string;
  syncTrigger: (reg: LightboxHandleTriggerRegistration) => void;
  unsyncTrigger: (reg: LightboxHandleTriggerRegistration) => void;
}

interface LightboxHandleState {
  host: LightboxHandleHost | null;
  triggers: Map<string, LightboxHandleTriggerRegistration>;
  version: number;
  listeners: Set<() => void>;
}

const handleStates = new WeakMap<object, LightboxHandleState>();

function getHandleState(handle: LightboxHandle<any>): LightboxHandleState {
  const state = handleStates.get(handle);
  if (!state) {
    throw new Error('Invalid Lightbox handle');
  }
  return state;
}

function notifyHandle(state: LightboxHandleState): void {
  state.version += 1;
  for (const listener of state.listeners) {
    listener();
  }
}

/**
 * Creates a new handle to control a Lightbox imperatively and to associate
 * detached Triggers with a Root.
 *
 * Pass a `Payload` type when one Root serves many galleries (a chat feed, a
 * search grid): each Trigger carries the payload for the gallery it opens, and
 * Root's render-function `children` receives it.
 *
 * @example
 * const lightbox = Lightbox.createHandle();
 *
 * <Lightbox.Trigger handle={lightbox} id="hero" index={0}>…</Lightbox.Trigger>
 * <Lightbox.Root handle={lightbox}>…</Lightbox.Root>
 *
 * lightbox.open(0, { triggerId: 'hero' });
 *
 * @example
 * const viewer = Lightbox.createHandle<Message>();
 *
 * <Lightbox.Trigger handle={viewer} itemId={photo.id} payload={message}>…</Lightbox.Trigger>
 * <Lightbox.Root handle={viewer}>
 *   {({ payload }) => payload?.images.map((photo, i) => (
 *     <Lightbox.Item key={photo.id} itemId={photo.id} index={i}>…</Lightbox.Item>
 *   ))}
 * </Lightbox.Root>
 */
function createHandle<Payload = unknown>(): LightboxHandle<Payload> {
  const state: LightboxHandleState = {
    host: null,
    triggers: new Map(),
    version: 0,
    listeners: new Set(),
  };

  const warnUnbound = (method: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`LightboxHandle.${method}() was called before a Lightbox.Root with this handle was mounted.`);
    }
  };

  const handle: LightboxHandle<Payload> = {
    open(indexOrOptions?: number | LightboxHandleOpenOptions<Payload>, options?: LightboxHandleOpenOptions<Payload>) {
      if (!state.host) {
        warnUnbound('open');
        return;
      }
      if (typeof indexOrOptions === 'object' && indexOrOptions !== null) {
        state.host.open(undefined, indexOrOptions);
      } else {
        state.host.open(indexOrOptions, options);
      }
    },
    close() {
      if (!state.host) {
        warnUnbound('close');
        return;
      }
      state.host.close();
    },
    goTo(target: number | { itemId: string }) {
      if (!state.host) {
        warnUnbound('goTo');
        return;
      }
      state.host.goTo(target);
    },
    get isOpen() {
      return state.host?.getOpen() ?? false;
    },
  };

  handleStates.set(handle, state);
  return handle;
}

/** @internal Notify detached Triggers that host open/index state changed. */
function notifyLightboxHandle(handle: LightboxHandle<any>): void {
  notifyHandle(getHandleState(handle));
}

/** @internal Bind a mounted Root as the host for this handle. */
function bindLightboxHandle(handle: LightboxHandle<any>, host: LightboxHandleHost): void {
  const state = getHandleState(handle);
  if (process.env.NODE_ENV !== 'production' && state.host && state.host !== host) {
    console.warn('Lightbox handle is already bound to another Root.');
  }
  state.host = host;
  for (const reg of state.triggers.values()) {
    host.syncTrigger(reg);
  }
  notifyHandle(state);
}

/** @internal */
function unbindLightboxHandle(handle: LightboxHandle<any>, host: LightboxHandleHost): void {
  const state = getHandleState(handle);
  if (state.host === host) {
    state.host = null;
    notifyHandle(state);
  }
}

/**
 * @internal Register a trigger on the handle. Returns cleanup.
 * The registration object is mutated in place by Trigger; call
 * `touchHandleTrigger` after mutating element/image/morph fields.
 */
function registerHandleTrigger(handle: LightboxHandle<any>, reg: LightboxHandleTriggerRegistration): () => void {
  const state = getHandleState(handle);
  const prev = state.triggers.get(reg.id);
  if (prev && prev !== reg) {
    state.host?.unsyncTrigger(prev);
  }
  state.triggers.set(reg.id, reg);
  state.host?.syncTrigger(reg);
  notifyIfOpen(state);
  return () => {
    if (state.triggers.get(reg.id) !== reg) return;
    state.triggers.delete(reg.id);
    state.host?.unsyncTrigger(reg);
    notifyIfOpen(state);
  };
}

/**
 * Registration churn (a virtualized feed mounting rows) only changes what
 * triggers read while the viewer is open — closed, every snapshot is `false` —
 * so skip the O(triggers) notify then.
 */
function notifyIfOpen(state: LightboxHandleState): void {
  if (state.host?.getOpen()) notifyHandle(state);
}

/** @internal Re-sync a mutated registration object to the bound Root. */
function touchHandleTrigger(handle: LightboxHandle<any>, reg: LightboxHandleTriggerRegistration): void {
  const state = getHandleState(handle);
  if (state.triggers.get(reg.id) !== reg) return;
  state.host?.syncTrigger(reg);
  notifyIfOpen(state);
}

/** @internal */
function getHandleTrigger(handle: LightboxHandle<any>, id: string): LightboxHandleTriggerRegistration | undefined {
  return getHandleState(handle).triggers.get(id);
}

/** @internal Subscribe to handle host / trigger registration changes. */
function subscribeLightboxHandle(handle: LightboxHandle<any>, onStoreChange: () => void): () => void {
  const state = getHandleState(handle);
  state.listeners.add(onStoreChange);
  return () => {
    state.listeners.delete(onStoreChange);
  };
}

/** @internal The bound Root host, or `null` while no Root is mounted. */
function getLightboxHandleHost(handle: LightboxHandle<any>): LightboxHandleHost | null {
  return getHandleState(handle).host;
}

export { createHandle };
export type { LightboxHandle, LightboxHandleOpenOptions, LightboxHandleTriggerRegistration, LightboxHandleHost };
export {
  bindLightboxHandle,
  unbindLightboxHandle,
  notifyLightboxHandle,
  registerHandleTrigger,
  touchHandleTrigger,
  getHandleTrigger,
  subscribeLightboxHandle,
  getLightboxHandleHost,
};
