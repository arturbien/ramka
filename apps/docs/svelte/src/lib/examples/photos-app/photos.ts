/** A local photo: full-size source, a lighter grid thumbnail, and its intrinsic pixel size. */
export interface PhotoAsset {
  src: string;
  thumb: string;
  width: number;
  height: number;
}

const sizes: [number, number][] = [
  [1600, 1067],
  [1067, 1600],
  [1600, 1600],
  [1600, 900],
  [1200, 1600],
  [1600, 1200],
];

/** The 48 demo photos shared by the photos app and the infinite feed. */
export const photoAssets: PhotoAsset[] = Array.from({ length: 48 }, (_, i) => {
  const [width, height] = sizes[i % sizes.length];
  return {
    src: `/svelte/examples/photos-app/full/ramka-photos-${i}.jpg`,
    thumb: `/svelte/examples/photos-app/thumb/ramka-photos-${i}.jpg`,
    width,
    height,
  };
});
