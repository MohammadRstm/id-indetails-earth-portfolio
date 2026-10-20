/** The picture `step` places away from `index`, wrapping round at either end. */
export const stepIndex = (index: number, step: number, count: number) => (((index + step) % count) + count) % count;
