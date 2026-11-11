import {
  clamp,
  elasticClamp,
  haptic,
  invertElasticClamp,
  isPerceptibleSnapback,
  momentumVelocity,
  PAN_FRICTION,
  panRange,
  resolvePinchZoom,
  RUBBER_BAND_MOUSE,
  RUBBER_BAND_TOUCH,
  rubberBandClamp,
  scaleZoom,
  tween,
} from './gestures.js';

type Point = { x: number; y: number };
type GestureEvent = Event & { scale: number; clientX: number; clientY: number };

interface ZoomOptions {
  min: number;
  max: number;
  step: number;
  scrollToZoom: boolean;
  wheelSensitivity: number;
  doubleClickDelay: number;
  panViewport(): HTMLElement;
}

interface ZoomEvents {
  onchange(scale: number): void;
  ondrag(dragging: boolean): void;
  onpinch(pinching: boolean): void;
}

interface Gesture {
  scale: number;
  x: number;
  y: number;
  mid: Point;
  a: Point;
  b?: Point;
  baseline: number;
  engaged: boolean;
}

const DOUBLE_TAP_DISTANCE = 50;
const TAP_MOVE = 10;
const WHEEL_PINCH_END = 120;
const VELOCITY_WINDOW = 100;
const KEY_EVENTS = ['keydown', 'keyup', 'blur'];

let physicalCtrl = false;
let ctrlUsers = 0;

function onkey(e: Event) {
  if (e.type === 'blur') physicalCtrl = false;
  else if ((e as KeyboardEvent).key === 'Control') physicalCtrl = e.type === 'keydown';
}

function trackCtrl() {
  if (ctrlUsers++ === 0) for (const type of KEY_EVENTS) window.addEventListener(type, onkey, true);
  return () => {
    if (--ctrlUsers > 0) return;
    for (const type of KEY_EVENTS) window.removeEventListener(type, onkey, true);
    physicalCtrl = false;
  };
}

/** Pinch, pan, double tap, wheel, trackpad pinch and discrete zoom for one media box. */
export class ZoomController {
  scale: number;
  x = 0;
  y = 0;
  #pointers = new Map<number, Point>();
  #gesture: Gesture | null = null;
  #samples: (Point & { t: number })[] = [];
  #focal: Point = { x: 0, y: 0 };
  #lastTap = { t: 0, x: 0, y: 0 };
  #downAt: Point = { x: 0, y: 0 };
  #cancel = () => {};
  #pointerType = '';
  #dragging = false;
  #pinched = false;
  #wheelTimer = 0;
  #wheelZoom: number | undefined;
  #gestureZoom: number | undefined;
  #releaseCtrl = trackCtrl();
  #viewport: HTMLElement;
  #content: HTMLElement;
  #options: () => ZoomOptions;
  #events: ZoomEvents;

  constructor(viewport: HTMLElement, content: HTMLElement, options: () => ZoomOptions, events: ZoomEvents) {
    this.#viewport = viewport;
    this.#content = content;
    this.#options = options;
    this.#events = events;
    this.scale = options().min;
  }

  #local(e: { clientX: number; clientY: number }): Point {
    const r = this.#viewport.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  }

  #view() {
    return this.#options().panViewport().getBoundingClientRect();
  }

  #bounds(scale = this.scale) {
    const v = this.#view();
    const z = this.#viewport.getBoundingClientRect();
    return {
      x: panRange(this.#content.offsetWidth * scale, z.left + z.width / 2, v.left, v.right),
      y: panRange(this.#content.offsetHeight * scale, z.top + z.height / 2, v.top, v.bottom),
    };
  }

  #render() {
    this.#content.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${this.scale})`;
    this.#events.onchange(this.scale);
  }

  #set(scale: number, x: number, y: number) {
    [this.scale, this.x, this.y] = [scale, x, y];
    this.#render();
  }

  #clamped(scale: number, x: number, y: number) {
    const { min, max } = this.#options();
    const s = clamp(scale, min, max);
    const b = this.#bounds(s);
    return [s, clamp(x, ...b.x), clamp(y, ...b.y)] as const;
  }

  #elastic(scale: number, x: number, y: number, touch: boolean) {
    const b = this.#bounds(scale);
    const v = this.#view();
    const factor = touch ? RUBBER_BAND_TOUCH : RUBBER_BAND_MOUSE;
    const axis = (value: number, [lo, hi]: readonly [number, number], size: number) =>
      touch && lo === hi ? lo : rubberBandClamp(value, lo, hi, size * factor);
    this.#set(scale, axis(x, b.x, v.width), axis(y, b.y, v.height));
  }

  #zoomAround(scale: number, focal: Point) {
    const ratio = scale / this.scale;
    const b = this.#bounds(scale);
    this.#focal = focal;
    this.#set(
      scale,
      clamp(focal.x - (focal.x - this.x) * ratio, ...b.x),
      clamp(focal.y - (focal.y - this.y) * ratio, ...b.y),
    );
  }

  #drag(on: boolean) {
    if (this.#dragging !== on) this.#events.ondrag((this.#dragging = on));
  }

  #pinch(on: boolean) {
    if (this.#pinched !== on) this.#events.onpinch((this.#pinched = on));
  }

  #sample(p: Point, t: number) {
    this.#samples.push({ ...p, t });
    while (t - this.#samples[0].t > VELOCITY_WINDOW) this.#samples.shift();
  }

  #settle(velocity: Point | null = null) {
    const { min, max } = this.#options();
    const bound = clamp(this.scale, min, max);
    if (isPerceptibleSnapback(this.scale, min, max)) haptic();
    const ratio = bound / this.scale;
    const f = this.#focal;
    const coast = velocity ? { x: velocity.x / PAN_FRICTION, y: velocity.y / PAN_FRICTION } : { x: 0, y: 0 };
    this.animateTo(
      bound,
      f.x - (f.x - this.x) * ratio + coast.x,
      f.y - (f.y - this.y) * ratio + coast.y,
      velocity ? 3000 / PAN_FRICTION : 300,
    );
  }

  animateTo(scale: number, x: number, y: number, duration = 300) {
    this.#cancel();
    const [s, tx, ty] = this.#clamped(scale, x, y);
    const from = { s: this.scale, x: this.x, y: this.y };
    this.#cancel = tween(duration, (p) =>
      this.#set(from.s + (s - from.s) * p, from.x + (tx - from.x) * p, from.y + (ty - from.y) * p),
    );
  }

  zoomAt(scale: number, focal: Point = { x: 0, y: 0 }, duration?: number) {
    const { min, max } = this.#options();
    const s = clamp(scale, min, max);
    const ratio = s / this.scale;
    this.animateTo(s, focal.x - (focal.x - this.x) * ratio, focal.y - (focal.y - this.y) * ratio, duration);
  }

  zoomIn = () => this.zoomAt(this.scale * this.#options().step);
  zoomOut = () => this.zoomAt(this.scale / this.#options().step);
  zoomTo = (target: number, { rapid = false, dx = 0, dy = 0 } = {}) =>
    this.zoomAt(target, { x: dx, y: dy }, rapid ? 0 : undefined);
  reset = (rapid = false) => this.animateTo(this.#options().min, 0, 0, rapid ? 0 : 300);
  pan = (dx: number, dy: number) => this.animateTo(this.scale, this.x + dx * this.scale, this.y + dy * this.scale, 200);
  changeOffsets = (dx: number, dy: number) => {
    this.#cancel();
    this.#set(...this.#clamped(this.scale, this.x - dx * this.scale, this.y - dy * this.scale));
  };

  #startGesture() {
    const [a, b] = [...this.#pointers.values()];
    this.#samples = [];
    this.#gesture = {
      scale: this.scale,
      x: this.x,
      y: this.y,
      mid: b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a,
      a,
      b,
      baseline: b ? Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1) : 0,
      engaged: false,
    };
  }

  onpointerdown = (e: PointerEvent) => {
    const { min } = this.#options();
    this.#pointerType = e.pointerType;
    if (e.isPrimary) this.#pointers.clear();
    if (e.pointerType === 'mouse' && (e.button !== 0 || this.scale <= min)) return;
    this.#pointers.set(e.pointerId, this.#local(e));
    if (this.#pointers.size > 2) return;
    if (this.#pointers.size === 2 || this.scale > min) {
      e.stopPropagation();
      this.#viewport.setPointerCapture(e.pointerId);
    }
    if (this.#pointers.size === 2) this.#pinch(true);
    this.#cancel();
    this.#downAt = this.#local(e);
    this.#startGesture();
  };

  onpointermove = (e: PointerEvent) => {
    if (!this.#pointers.has(e.pointerId) || !this.#gesture) return;
    this.#pointers.set(e.pointerId, this.#local(e));
    const { min, max } = this.#options();
    const g = this.#gesture;
    const touch = e.pointerType === 'touch';
    const [a, b] = [...this.#pointers.values()];
    if (b && g.b) {
      e.stopPropagation();
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const pinch = resolvePinchZoom(g.scale, g.baseline, g.engaged, g.a, a, g.b, b);
      [g.engaged, g.baseline] = [pinch.engaged, pinch.baseline];
      const scale = elasticClamp(pinch.zoom, min, max);
      const ratio = scale / g.scale;
      this.#focal = mid;
      this.#sample(mid, e.timeStamp);
      this.#elastic(scale, mid.x - (g.mid.x - g.x) * ratio, mid.y - (g.mid.y - g.y) * ratio, touch);
      return;
    }
    if (this.scale <= min) return;
    e.stopPropagation();
    this.#drag(true);
    this.#sample(a, e.timeStamp);
    this.#elastic(this.scale, g.x + a.x - g.mid.x, g.y + a.y - g.mid.y, touch);
  };

  onpointerup = (e: PointerEvent) => {
    if (!this.#pointers.delete(e.pointerId)) return;
    const point = this.#local(e);
    if (this.#pointers.size === 1) return this.#startGesture();
    const { min } = this.#options();
    const last = this.#samples.at(-1);
    const velocity = last && e.timeStamp - last.t <= VELOCITY_WINDOW ? momentumVelocity(this.#samples) : null;
    this.#gesture = null;
    this.#samples = [];
    this.#drag(false);
    this.#pinch(false);
    const moved = Math.hypot(point.x - this.#downAt.x, point.y - this.#downAt.y) > TAP_MOVE;
    if (e.pointerType !== 'mouse' && !moved && e.type === 'pointerup') return this.#tap(e, point);
    if (this.scale === min && this.x === 0 && this.y === 0) return;
    this.#settle(this.scale > min ? velocity : null);
  };

  #tap(e: PointerEvent, point: Point) {
    const { min, max, doubleClickDelay } = this.#options();
    const last = this.#lastTap;
    const double =
      e.timeStamp - last.t < doubleClickDelay && Math.hypot(point.x - last.x, point.y - last.y) < DOUBLE_TAP_DISTANCE;
    this.#lastTap = double ? { t: 0, x: 0, y: 0 } : { t: e.timeStamp, ...point };
    if (double) this.toggle(point);
    else if (this.scale !== clamp(this.scale, min, max)) this.#settle();
  }

  /** Double tap: zoom to one step at `point`, or back to rest when already zoomed. */
  toggle(point: Point) {
    const { min, max, step } = this.#options();
    if (this.scale > min + 0.01) this.reset();
    else this.zoomAt(Math.min(step, max), point);
  }

  ondblclick = (e: MouseEvent) => {
    if (this.#pointerType === 'mouse') this.toggle(this.#local(e));
  };

  onwheel = (e: WheelEvent) => {
    const { min, max, scrollToZoom, wheelSensitivity } = this.#options();
    const zoomKey = (e.ctrlKey && this.#gestureZoom === undefined) || e.metaKey;
    if ((zoomKey || scrollToZoom) && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.stopPropagation();
      this.#cancel();
      this.#pinch(true);
      clearTimeout(this.#wheelTimer);
      const focal = this.#local(e);
      if (e.ctrlKey && !physicalCtrl) {
        const from = this.#wheelZoom ?? invertElasticClamp(this.scale, min, max);
        this.#wheelZoom = scaleZoom(from, -e.deltaY, wheelSensitivity);
        this.#zoomAround(elasticClamp(this.#wheelZoom, min, max), focal);
      } else {
        this.#wheelZoom = undefined;
        this.#zoomAround(clamp(scaleZoom(this.scale, -e.deltaY, wheelSensitivity), min, max), focal);
      }
      this.#wheelTimer = window.setTimeout(() => {
        this.#pinch(false);
        if (this.#wheelZoom === undefined) return;
        this.#wheelZoom = undefined;
        this.#settle();
      }, WHEEL_PINCH_END);
      return;
    }
    if (this.scale <= min) return;
    e.preventDefault();
    e.stopPropagation();
    if (!scrollToZoom) this.changeOffsets(e.deltaX / this.scale, e.deltaY / this.scale);
  };

  /** Safari trackpad pinch through `gesturestart`, `gesturechange` and `gestureend`. */
  ongesture = (event: Event) => {
    const e = event as GestureEvent;
    e.preventDefault();
    const { min, max } = this.#options();
    if (e.type === 'gesturestart') {
      this.#cancel();
      this.#gestureZoom = invertElasticClamp(this.scale, min, max);
      this.#pinch(true);
      return;
    }
    if (this.#gestureZoom === undefined) return;
    if (e.type === 'gestureend') {
      this.#gestureZoom = undefined;
      this.#pinch(false);
      return this.#settle();
    }
    this.#zoomAround(elasticClamp(this.#gestureZoom * e.scale, min, max), this.#local(e));
  };

  destroy() {
    this.#releaseCtrl();
    this.#cancel();
    clearTimeout(this.#wheelTimer);
    this.#drag(false);
    this.#pinch(false);
  }
}
