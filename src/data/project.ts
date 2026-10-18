export type ProjectType = 'villa' | 'residential' | 'hotel';

export type ProjectStatus = 'completed' | 'in-progress';

export interface ProjectLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ImageCredit {
  photographer: string;
  /** Where the photo comes from, for example Pexels. */
  source: string;
  url: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  credit?: ImageCredit;
}

export interface Project {
  id: number;
  /** URL-safe and unique; the project's address is `/projects/<slug>`. */
  slug: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  /** The client organisation. */
  client: string;
  location: ProjectLocation;
  /** Year of completion, or the expected year while the project is in progress. */
  year: number;
  description: string;
  /** Portrait crop used in the project strip. */
  thumbnail: string;
  hero: ProjectImage;
  gallery: ProjectImage[];
  /** Whether the project is one of those in the drifting strip on the landing page (at most 20). */
  showInConveyor: boolean;
  /** Position in the strip; null when the project is not in it. */
  conveyorOrder: number | null;
}

/** The most projects the landing page's strip shows. */
export const CONVEYOR_LIMIT = 20;

export const projectTypeLabel: Record<ProjectType, string> = {
  villa: 'Villa',
  residential: 'Residential',
  hotel: 'Hotel',
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
};
