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

/** The ID-Indetails logo: a split white "0" on a black rounded square. Also `public/favicon.svg`. */
export const LogoMark = (props: IconProps) => (
  <svg viewBox="0 0 1024 1024" width={28} height={28} aria-hidden focusable={false} {...props}>
    <rect width="1024" height="1024" rx="220" fill="#000" />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M291 340A221 245 0 0 1 733 340V685A221 243 0 0 1 291 685ZM435 320A77 77 0 0 1 589 320V702A77 77 0 0 1 435 702Z"
    />
    <path fill="#000" d="M495 80h33v180h-33ZM495 760h33v190h-33Z" />
  </svg>
);
