/** Pixel offset of a drawn image inside its box for a CSS `object-position` value. */
export function objectPositionOffset(objectPosition: string, freeX: number, freeY: number) {
  const fraction = (token: string | undefined, axis: 'x' | 'y') => {
    if (!token || token === 'center') return 0.5;
    if (token === (axis === 'x' ? 'left' : 'top')) return 0;
    if (token === (axis === 'x' ? 'right' : 'bottom')) return 1;
    const pct = token.endsWith('%') ? Number.parseFloat(token) : NaN;
    return Number.isFinite(pct) ? pct / 100 : 0.5;
  };
  const [x, y] = (objectPosition || '').trim().split(/\s+/);
  return { x: freeX * fraction(x, 'x'), y: freeY * fraction(y, 'y') };
}

/** Paints the decoded trigger image under a still loading destination image; returns a remover, or null when it cannot. */
export function paintPlaceholder(
  img: HTMLImageElement,
  source: HTMLImageElement | null | undefined,
  host: HTMLElement,
) {
  if (!source?.complete || !source.naturalWidth || !source.naturalHeight || host === img) return null;
  const boxW = img.clientWidth || host.clientWidth;
  const boxH = img.clientHeight || host.clientHeight;
  const ctx = boxW && boxH ? document.createElement('canvas').getContext('2d') : null;
  if (!ctx) return null;
  const canvas = ctx.canvas;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.max(1, Math.round(boxW * dpr));
  canvas.height = Math.max(1, Math.round(boxH * dpr));
  canvas.setAttribute('data-ramka-placeholder', '');
  canvas.style.cssText =
    'position:absolute;top:0;inset-inline-start:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  const { objectFit, objectPosition } = getComputedStyle(img);
  const [natW, natH] = [source.naturalWidth, source.naturalHeight];
  const scale = (objectFit === 'cover' ? Math.max : Math.min)(boxW / natW, boxH / natH);
  const [drawW, drawH] = [natW * scale, natH * scale];
  const offset = objectPositionOffset(objectPosition, boxW - drawW, boxH - drawH);
  try {
    ctx.scale(dpr, dpr);
    ctx.drawImage(source, offset.x, offset.y, drawW, drawH);
  } catch {
    return null;
  }
  const isolation = host.style.isolation;
  host.style.isolation = 'isolate';
  host.prepend(canvas);
  host.setAttribute('data-placeholder', '');
  return () => {
    canvas.remove();
    host.style.isolation = isolation;
    host.removeAttribute('data-placeholder');
  };
}
