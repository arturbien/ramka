/** One Khronos sample asset shown in the grid and in its lightbox. */
export interface Product {
  id: string;
  name: string;
  material: string;
  src: string;
}

interface ThreeModules {
  THREE: any;
  RoomEnvironment: any;
  GLTFLoader: any;
  TrackballControls: any;
}

let modules: Promise<ThreeModules> | undefined;

function loadThree() {
  modules ??= Promise.all([
    import('three'),
    import('three/examples/jsm/environments/RoomEnvironment.js'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/controls/TrackballControls.js'),
  ]).then(([THREE, room, gltf, trackball]) => ({
    THREE,
    RoomEnvironment: room.RoomEnvironment,
    GLTFLoader: gltf.GLTFLoader,
    TrackballControls: trackball.TrackballControls,
  }));
  return modules;
}

const gltfCache = new Map<string, Promise<any>>();

function loadGltf(three: ThreeModules, url: string): Promise<any> {
  let hit = gltfCache.get(url);
  if (!hit) {
    hit = new Promise((resolve, reject) => {
      new three.GLTFLoader().load(url, (gltf: any) => resolve(gltf.scene), undefined, reject);
    });
    gltfCache.set(url, hit);
  }
  return hit.then((scene) => scene.clone(true));
}

interface PaintGate {
  painted: boolean;
  waiters: Set<() => void>;
}

const paintGates = new Map<string, PaintGate>();

function getPaintGate(productId: string) {
  let gate = paintGates.get(productId);
  if (!gate) {
    gate = { painted: false, waiters: new Set() };
    paintGates.set(productId, gate);
  }
  return gate;
}

function resetPaintGate(productId: string) {
  getPaintGate(productId).painted = false;
}

function markLightboxPainted(productId: string) {
  const gate = getPaintGate(productId);
  if (gate.painted) return;
  gate.painted = true;
  for (const waiter of gate.waiters) waiter();
  gate.waiters.clear();
}

/** Resolves once the lightbox canvas painted a pose-synced frame, on abort, or after the timeout. */
export function waitForLightboxPainted(
  productId: string,
  { signal, timeoutMs }: { signal: AbortSignal; timeoutMs: number },
): Promise<void> {
  const gate = getPaintGate(productId);
  if (signal.aborted || gate.painted) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      gate.waiters.delete(finish);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    gate.waiters.add(finish);
    signal.addEventListener('abort', finish, { once: true });
  });
}

function normalizeModel(THREE: any, model: any) {
  const wrapped = new THREE.Group();
  wrapped.add(model);
  model.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  model.position.sub(center);
  wrapped.scale.setScalar(1 / maxDim);
  wrapped.updateMatrixWorld(true);
  return wrapped;
}

function fitCameraToUnitObject(THREE: any, camera: any, controls: any) {
  const fitHeightDistance = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const fitWidthDistance = fitHeightDistance / Math.max(camera.aspect, 0.001);
  const distance = 1.45 * Math.max(fitHeightDistance, fitWidthDistance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  controls.target.set(0, 0, 0);
  camera.up.set(0, 1, 0);
  camera.position.set(distance * 0.35, distance * 0.2, distance);
  camera.lookAt(controls.target);
  camera.updateProjectionMatrix();
}

type Vec = [number, number, number];

interface ViewPose {
  direction: Vec;
  up: Vec;
  spinAxis: Vec;
  spinSpeed: number;
}

interface SpinState {
  axis: any;
  speed: number;
}

interface ViewStore {
  pose: ViewPose | null;
  listeners: Set<(pose: ViewPose, source: symbol) => void>;
}

const viewStores = new Map<string, ViewStore>();

function getViewStore(productId: string) {
  let store = viewStores.get(productId);
  if (!store) {
    store = { pose: null, listeners: new Set() };
    viewStores.set(productId, store);
  }
  return store;
}

function publish(store: ViewStore, pose: ViewPose, source: symbol) {
  store.pose = pose;
  for (const listener of store.listeners) listener(pose, source);
}

const TARGET_SPIN_RAD_PER_SEC = (2 * Math.PI) / 60;
const SPIN_SPEED_BLEND = 2.2;

function readViewPose(camera: any, controls: any, spin: SpinState): ViewPose {
  const direction = camera.position.clone().sub(controls.target).normalize();
  const up = camera.up.clone().normalize();
  return {
    direction: [direction.x, direction.y, direction.z],
    up: [up.x, up.y, up.z],
    spinAxis: [spin.axis.x, spin.axis.y, spin.axis.z],
    spinSpeed: spin.speed,
  };
}

function applyViewPose(THREE: any, camera: any, controls: any, pose: ViewPose, spin: SpinState) {
  const radius = camera.position.distanceTo(controls.target) || 1;
  const direction = new THREE.Vector3().fromArray(pose.direction).normalize();
  camera.position.copy(controls.target).addScaledVector(direction, radius);
  camera.up.fromArray(pose.up).normalize();
  camera.lookAt(controls.target);
  controls._eye.subVectors(camera.position, controls.target);
  controls._lastPosition.copy(camera.position);
  controls._lastAngle = 0;
  if (pose.spinAxis.some((v) => v !== 0)) spin.axis.fromArray(pose.spinAxis).normalize();
  if (Number.isFinite(pose.spinSpeed)) spin.speed = Math.max(0, pose.spinSpeed);
}

function captureFlickIntoSpin(controls: any, spin: SpinState, dt: number) {
  if (controls._lastAxis.lengthSq() > 1e-8) spin.axis.copy(controls._lastAxis).normalize();
  const frameDt = Math.max(dt, 1 / 120);
  if (Math.abs(controls._lastAngle) > 1e-6) spin.speed = Math.abs(controls._lastAngle) / frameDt;
  controls._lastAngle = 0;
}

function applySpinStep(camera: any, controls: any, spin: SpinState, dt: number) {
  const blend = 1 - Math.exp(-SPIN_SPEED_BLEND * dt);
  spin.speed += (TARGET_SPIN_RAD_PER_SEC - spin.speed) * blend;
  const angle = spin.speed * dt;
  if (Math.abs(angle) < 1e-8) return;
  const offset = camera.position.clone().sub(controls.target).applyAxisAngle(spin.axis, angle);
  camera.position.copy(controls.target).add(offset);
  camera.up.applyAxisAngle(spin.axis, angle);
  camera.lookAt(controls.target);
  controls._eye.subVectors(camera.position, controls.target);
  controls._lastPosition.copy(camera.position);
}

interface SceneOptions {
  product: Product;
  role: 'trigger' | 'lightbox';
  interactive: () => boolean;
  autoRotate: () => boolean;
}

/** Mounts a Three.js canvas into `host`, synced with every other canvas of the same product; returns the cleanup. */
export function mountScene(host: HTMLElement, { product, role, interactive, autoRotate }: SceneOptions) {
  let teardown: (() => void) | undefined;
  let disposed = false;
  if (role === 'lightbox') resetPaintGate(product.id);

  loadThree().then((three) => {
    if (disposed) return;
    teardown = setup(three, host, product, role, interactive, autoRotate);
  });

  return () => {
    disposed = true;
    if (role === 'lightbox') resetPaintGate(product.id);
    teardown?.();
  };
}

function setup(
  three: ThreeModules,
  host: HTMLElement,
  product: Product,
  role: SceneOptions['role'],
  interactive: () => boolean,
  autoRotate: () => boolean,
) {
  const { THREE } = three;
  const canvas = document.createElement('canvas');
  canvas.className = 'models-3d-canvas';
  canvas.style.touchAction = 'none';
  host.appendChild(canvas);

  const sourceId = Symbol(product.id);
  const store = getViewStore(product.id);
  let paintSignaled = false;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new three.RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-3, 1.5, -2);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const controls = new three.TrackballControls(camera, canvas);
  controls.noPan = true;
  controls.noZoom = true;
  controls.rotateSpeed = 1.4;
  controls.dynamicDampingFactor = 0.15;
  controls.enabled = interactive();

  const spin: SpinState = {
    axis: store.pose ? new THREE.Vector3().fromArray(store.pose.spinAxis).normalize() : new THREE.Vector3(0, 1, 0),
    speed: store.pose?.spinSpeed ?? TARGET_SPIN_RAD_PER_SEC,
  };

  let frame = 0;
  let disposed = false;
  let applyingShared = false;
  let userDragging = false;
  let lastFrameTime = performance.now();
  let lastDt = 1 / 60;
  let ready = false;

  const publishPose = () => {
    if (!ready || applyingShared || disposed) return;
    publish(store, readViewPose(camera, controls, spin), sourceId);
  };
  const onStart = () => (userDragging = true);
  const onEnd = () => {
    userDragging = false;
    captureFlickIntoSpin(controls, spin, lastDt);
    publishPose();
  };
  controls.addEventListener('change', publishPose);
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  const listener = (pose: ViewPose, source: symbol) => {
    if (!ready || source === sourceId || disposed) return;
    applyingShared = true;
    applyViewPose(THREE, camera, controls, pose, spin);
    applyingShared = false;
  };
  store.listeners.add(listener);

  const setSize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 1 || height < 1) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.handleResize();
  };

  const signalPaintedIfNeeded = () => {
    if (role !== 'lightbox' || !ready || disposed || paintSignaled) return;
    if (host.clientWidth < 1 || host.clientHeight < 1) return;
    paintSignaled = true;
    if (store.pose) {
      applyingShared = true;
      applyViewPose(THREE, camera, controls, store.pose, spin);
      applyingShared = false;
    }
    setSize();
    controls.update();
    renderer.render(scene, camera);
    markLightboxPainted(product.id);
  };

  const render = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;
    lastDt = dt;
    controls.enabled = interactive();
    if (autoRotate() && !userDragging && ready) {
      applySpinStep(camera, controls, spin, dt);
      publishPose();
    }
    signalPaintedIfNeeded();
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };

  setSize();
  frame = requestAnimationFrame(render);
  const resizeObserver = new ResizeObserver(setSize);
  resizeObserver.observe(host);

  loadGltf(three, product.src)
    .then((model) => {
      if (disposed) return;
      scene.add(normalizeModel(THREE, model));
      const savedPose = store.pose;
      applyingShared = true;
      fitCameraToUnitObject(THREE, camera, controls);
      controls.handleResize();
      controls.update();
      if (savedPose) applyViewPose(THREE, camera, controls, savedPose, spin);
      else publish(store, readViewPose(camera, controls, spin), sourceId);
      applyingShared = false;
      ready = true;
      signalPaintedIfNeeded();
    })
    .catch((err) => console.warn('[3d-models] Failed to load GLB', product.src, err));

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    store.listeners.delete(listener);
    controls.removeEventListener('change', publishPose);
    controls.removeEventListener('start', onStart);
    controls.removeEventListener('end', onEnd);
    if (ready && !applyingShared) {
      captureFlickIntoSpin(controls, spin, lastDt);
      publish(store, readViewPose(camera, controls, spin), sourceId);
    }
    controls.dispose();
    env.dispose();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
