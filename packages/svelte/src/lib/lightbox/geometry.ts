/** Scroll position of every slide when it sits centered in the track, keyed by item index. */
export function slideOffsets(track: HTMLElement) {
  return [...track.querySelectorAll<HTMLElement>(':scope > [data-ramka-slide]')].map((slide) => ({
    slide,
    index: Number(slide.querySelector<HTMLElement>('[data-ramka-item]')?.dataset.index ?? -1),
    offset: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
  }));
}

/** Fractional index for a scroll position; works for LTR (rising) and RTL (falling) offsets. */
export function progressAt(slides: { index: number; offset: number }[], x: number) {
  if (!slides.length) return 0;
  const sign = slides.length > 1 && slides[1].offset < slides[0].offset ? -1 : 1;
  const at = x * sign;
  if (at <= slides[0].offset * sign) return slides[0].index;
  for (let k = 0; k < slides.length - 1; k++) {
    const a = slides[k];
    const b = slides[k + 1];
    const [ao, bo] = [a.offset * sign, b.offset * sign];
    if (at <= bo) return a.index + ((at - ao) / (bo - ao || 1)) * (b.index - a.index);
  }
  return slides[slides.length - 1].index;
}

/** Fractional slide index for the current scroll position, 1.5 = halfway between slide 1 and 2. */
export function scrollProgress(track: HTMLElement) {
  return progressAt(slideOffsets(track), track.scrollLeft);
}

/** Index whose centered offset is closest to `x`. */
export function nearestIndex(slides: { index: number; offset: number }[], x: number) {
  let best = -1;
  let distance = Infinity;
  for (const { index, offset } of slides) {
    const d = Math.abs(offset - x);
    if (d < distance) [best, distance] = [index, d];
  }
  return best;
}
