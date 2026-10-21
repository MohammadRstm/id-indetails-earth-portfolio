import { describe, expect, it } from 'vitest';
import { layoutMasonry, PLACEHOLDER_RATIO, stepIndex } from './gallery';

describe('stepIndex', () => {
  it('moves to the next and previous picture', () => {
    expect(stepIndex(2, 1, 5)).toBe(3);
    expect(stepIndex(2, -1, 5)).toBe(1);
  });

  it('wraps round at either end', () => {
    expect(stepIndex(4, 1, 5)).toBe(0);
    expect(stepIndex(0, -1, 5)).toBe(4);
  });

  it('stays put with a single picture', () => {
    expect(stepIndex(0, 1, 1)).toBe(0);
    expect(stepIndex(0, -1, 1)).toBe(0);
  });
});

describe('layoutMasonry', () => {
  // 880px wide with a 20px gap fits three columns of 280px.
  it('fills the first row from left to right, then starts the next under the leftmost', () => {
    const { tiles } = layoutMasonry([1, 1, 1, 1], 880, 20);
    expect(tiles.map((tile) => tile.left)).toEqual([0, 300, 600, 0]);
    expect(tiles.map((tile) => tile.top)).toEqual([0, 0, 0, 300]);
    expect(tiles.every((tile) => tile.width === 280)).toBe(true);
  });

  it('gives each photo its own height from its shape', () => {
    const { tiles } = layoutMasonry([2, 1, 0.5], 880, 20);
    expect(tiles.map((tile) => tile.height)).toEqual([140, 280, 560]);
  });

  it('sets the next photo under the shortest column', () => {
    const { tiles } = layoutMasonry([0.5, 1, 1, 1, 1, 1], 880, 20);
    expect(tiles[3]).toMatchObject({ left: 300, top: 300 });
    expect(tiles[4]).toMatchObject({ left: 600, top: 300 });
    expect(tiles[5]).toMatchObject({ left: 0, top: 580 });
  });

  it('is as tall as its tallest column, without the gap after it', () => {
    const { height } = layoutMasonry([0.5, 1, 1, 1, 1, 1], 880, 20);
    expect(height).toBe(860);
  });

  it('uses fewer columns as the width narrows', () => {
    expect(new Set(layoutMasonry([1, 1, 1, 1], 600, 20).tiles.map((tile) => tile.left)).size).toBe(2);
    expect(new Set(layoutMasonry([1, 1, 1, 1], 300, 20).tiles.map((tile) => tile.left)).size).toBe(1);
  });

  it('uses one column, as wide as the grid, when the grid is narrower than a column', () => {
    const { tiles, height } = layoutMasonry([2, 1], 200, 20);
    expect(tiles).toEqual([
      { left: 0, top: 0, width: 200, height: 100 },
      { left: 0, top: 120, width: 200, height: 200 },
    ]);
    expect(height).toBe(320);
  });

  it('keeps a single photo at column width and a lone row for two', () => {
    expect(layoutMasonry([1.5], 880, 20).tiles).toEqual([{ left: 0, top: 0, width: 280, height: 280 / 1.5 }]);
    expect(layoutMasonry([1, 1], 880, 20).tiles.map((tile) => tile.left)).toEqual([0, 300]);
  });

  it('has nothing to lay out without photos', () => {
    expect(layoutMasonry([], 880, 20)).toEqual({ tiles: [], height: 0 });
  });

  it('gives a photo whose shape is not a positive number the placeholder shape', () => {
    for (const ratio of [0, -1, NaN, Infinity]) {
      expect(layoutMasonry([ratio], 880, 20).tiles[0].height).toBeCloseTo(280 / PLACEHOLDER_RATIO);
    }
  });
});
