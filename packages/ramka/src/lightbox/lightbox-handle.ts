/**
 * Base UI–style imperative handle for Lightbox.
 *
 * `createHandle()` returns a stable object you pass to `Lightbox.Root` (and
 * optionally to detached `Lightbox.Trigger`s) for programmatic control.
 */

interface LightboxHandleOpenOptions<Payload = unknown> {
  /**
   * Data for this open, read in the viewer with `useLightboxPayload()`.
   * Committed in the same synchronous pre-mount as the viewer, so the items
   * it describes exist before the morph captures anything. Omit to keep the
   * current payload.
   */
  payload?: Payload;
}

interface LightboxHandle<Payload = unknown> {
  /**
   * Open the lightbox at the `Lightbox.Item` with this `itemId` (or at the
   * current item when omitted). The item's position is resolved once the
   * payload's items mount, and the open morphs from that item's mounted
   * Trigger, if any.
   *
   * Call only from an event handler or effect — not during render.
   */
  open(itemId?: string, options?: LightboxHandleOpenOptions<Payload>): void;
  /** Close the lightbox. */
  close(): void;
  /** Navigate to the mounted `Lightbox.Item` with this `itemId` (source: `imperative`). Does not open. */
  goTo(itemId: string): void;
  /** Whether the bound Root is currently open. */
  readonly isOpen: boolean;
}

/** Trigger snapshot registered with a handle (may live outside Root). */
interface LightboxHandleTriggerRegistration {
  id: string;
  /** The item this trigger opens; resolves to a position through Root's items. */
  itemId: string;
  /** Items this trigger stands in for without opening them (Trigger `overflowItemIds`). */
  overflowItemIds?: readonly string[];
  element: HTMLElement | null;
  image: HTMLImageElement | null;
  morphElement: HTMLElement | null;
}

/** Bound Root host — set while a Root with this handle is mounted. */
interface LightboxHandleHost {
  open: (itemId?: string, options?: LightboxHandleOpenOptions) => void;
  /** Open from a Trigger's registration (its element is the morph origin). */
  openFromTrigger: (reg: LightboxHandleTriggerRegistration, payload: unknown) => void;
  close: () => void;
  goTo: (itemId: string) => void;
  getOpen: () => boolean;
  /** Whether the view-transition morph is enabled (drives trigger warm-up). */
  getViewTransition: () => boolean;
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
  notifyScheduled: boolean;
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
 * search grid): each Trigger carries the payload for the gallery it opens,
 * and the viewer reads it with `useLightboxPayload()`.
 *
 * @example
 * const lightbox = Lightbox.createHandle();
 *
 * <Lightbox.Trigger handle={lightbox} itemId="hero">…</Lightbox.Trigger>
 * <Lightbox.Root handle={lightbox}>…</Lightbox.Root>
 *
 * lightbox.open('hero');
 *
 * @example
 * const viewer = Lightbox.createHandle<Message>();
 *
 * <Lightbox.Trigger handle={viewer} itemId={photo.id} payload={message}>…</Lightbox.Trigger>
 * <Lightbox.Root handle={viewer}>
 *   <Viewer />
 * </Lightbox.Root>
 *
 * function Viewer() {
 *   const message = Lightbox.useLightboxPayload<Message>();
 *   return message?.images.map((photo, i) => (
 *     <Lightbox.Item key={photo.id} itemId={photo.id} index={i}>…</Lightbox.Item>
 *   ));
 * }
 */
function createHandle<Payload = unknown>(): LightboxHandle<Payload> {
  const state: LightboxHandleState = {
    host: null,
    triggers: new Map(),
    version: 0,
    listeners: new Set(),
    notifyScheduled: false,
  };

  const warnUnbound = (method: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`LightboxHandle.${method}() was called before a Lightbox.Root with this handle was mounted.`);
    }
  };

  const handle: LightboxHandle<Payload> = {
    open(itemId?: string, options?: LightboxHandleOpenOptions<Payload>) {
      if (!state.host) {
        warnUnbound('open');
        return;
      }
      state.host.open(itemId, options);
    },
    close() {
      if (!state.host) {
        warnUnbound('close');
        return;
      }
      state.host.close();
    },
    goTo(itemId: string) {
      if (!state.host) {
        warnUnbound('goTo');
        return;
      }
      state.host.goTo(itemId);
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
 * so skip the O(triggers) notify then. Open, batch a commit's registrations
 * (rows mounting as the feed scrolls) into one notify. Registrations run in
 * layout effects, so the microtask still lands before paint.
 */
function notifyIfOpen(state: LightboxHandleState): void {
  if (!state.host?.getOpen() || state.notifyScheduled) return;
  state.notifyScheduled = true;
  queueMicrotask(() => {
    state.notifyScheduled = false;
    notifyHandle(state);
  });
}

/** @internal Re-sync a mutated registration object to the bound Root. */
function touchHandleTrigger(handle: LightboxHandle<any>, reg: LightboxHandleTriggerRegistration): void {
  const state = getHandleState(handle);
  if (state.triggers.get(reg.id) !== reg) return;
  state.host?.syncTrigger(reg);
  notifyIfOpen(state);
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
  subscribeLightboxHandle,
  getLightboxHandleHost,
};
