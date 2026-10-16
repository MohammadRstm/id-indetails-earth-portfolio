import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M10 3.5 5.5 8l4.5 4.5" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </svg>
);

export const PauseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5.5 3.5v9M10.5 3.5v9" />
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 3.2v9.6L12.5 8z" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

/** The wordmark's emblem: a meridian ring with a single location point. */
export const EmblemIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 24 24" width={22} height={22} strokeWidth={1.3} {...props}>
    <circle cx="12" cy="12" r="9.25" />
    <ellipse cx="12" cy="12" rx="4.2" ry="9.25" />
    <circle cx="15.6" cy="8.4" r="1.7" fill="currentColor" stroke="none" />
  </svg>
);
