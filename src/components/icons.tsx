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

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M13.5 8h-11M6.5 4l-4 4 4 4" />
  </svg>
);

export const ArrowDownIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 2.5v11M4 9.5l4 4 4-4" />
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

/** The two halves of the logo's split "0", in the PNG's 1024-unit coordinates. Also `public/favicon.svg`. */
const LOGO_HALVES = [
  'M495.5 95.68A221 245 0 0 0 291 340V685A221 243 0 0 0 495.5 927.32V777.21A77 77 0 0 1 435 702V320A77 77 0 0 1 495.5 244.79Z',
  'M528.5 95.68A221 245 0 0 1 733 340V685A221 243 0 0 1 528.5 927.32V777.21A77 77 0 0 0 589 702V320A77 77 0 0 0 528.5 244.79Z',
];

/** The ID-Indetails logo: the split "0" on its own, in the text colour. */
export const LogoMark = (props: IconProps) => (
  <svg viewBox="291 95 442 833" width={16} height={30} fill="currentColor" aria-hidden focusable={false} {...props}>
    {LOGO_HALVES.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
