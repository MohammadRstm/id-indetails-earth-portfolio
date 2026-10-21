/** The picture `step` places away from `index`, wrapping round at either end. */
export const stepIndex = (index: number, step: number, count: number) => (((index + step) % count) + count) % count;

/** The width / height a photo is given until it has loaded and its own is known: the old 4:3 tile. */
export const PLACEHOLDER_RATIO = 4 / 3;

/** The narrowest a column of photos may be; the width decides how many columns fit. */
const MIN_COLUMN_PX = 260;

/** Where one photo goes in the grid, in pixels from its top left corner. */
export interface MasonryTile {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Sets photos, in order, into as many columns of one width as fit in `width`
 * (at least one), each under the shortest column so far (the left one on a tie),
 * so they read left to right and top to bottom. Every photo keeps its own shape;
 * a ratio that isn't a positive number is taken as the placeholder's.
 */
export function layoutMasonry(ratios: readonly number[], width: number, gap: number) {
  const columns = Math.max(1, Math.floor((width + gap) / (MIN_COLUMN_PX + gap)));
  const columnWidth = (width - gap * (columns - 1)) / columns;
  const bottoms = new Array<number>(columns).fill(0);

  const tiles = ratios.map((ratio): MasonryTile => {
    const column = bottoms.indexOf(Math.min(...bottoms));
    const top = bottoms[column];
    const height = columnWidth / (ratio > 0 && Number.isFinite(ratio) ? ratio : PLACEHOLDER_RATIO);
    bottoms[column] = top + height + gap;
    return { left: column * (columnWidth + gap), top, width: columnWidth, height };
  });

  return { tiles, height: tiles.length > 0 ? Math.max(...bottoms) - gap : 0 };
}
