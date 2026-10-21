export type ProjectType = 'villa' | 'residential' | 'hotel';

export type ProjectStatus = 'completed' | 'in-progress';

export interface ProjectLocation {
  /** Null when only the country is known. */
  city: string | null;
  country: string;
  /** ISO 3166-1 alpha-2, upper case ("LB"). */
  countryCode: string;
  /** Where the marker goes on the globe; always set, see `approximate`. */
  lat: number;
  lng: number;
  /**
   * True when the API picked the point (near the city's centre, or somewhere in the country when there is no
   * city) rather than it being typed in; such a point is not shown as the project's position.
   */
  approximate: boolean;
}

/** "City, Country", or just "Country" when no city is given. */
export const placeName = ({ city, country }: ProjectLocation) => (city ? `${city}, ${country}` : country);

/** Whether the coordinates are the project's own, typed in, rather than a point the API picked. */
export const hasExactPosition = (location: ProjectLocation) => !location.approximate;

export interface ProjectImage {
  src: string;
  alt: string;
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
  /** The card picture: a 3:2 landscape card in the strip, a 4:5 card in the grid, cropped to fit. */
  thumbnail: string;
  hero: ProjectImage;
  gallery: ProjectImage[];
  /** Optional: the text beside the concept pictures; null when there is none. */
  conceptDescription: string | null;
  /** Optional: up to CONCEPT_LIMIT concept pictures (not the gallery's), the first being the main one; empty when none. */
  conceptImages: ProjectImage[];
  /** Whether the project is one of those in the drifting strip on the landing page (at most 20). */
  showInConveyor: boolean;
  /** Position in the strip; null when the project is not in it. */
  conveyorOrder: number | null;
}

/** The most projects the landing page's strip shows. */
export const CONVEYOR_LIMIT = 20;

/** The most concept pictures a project page shows. */
export const CONCEPT_LIMIT = 5;

export const projectTypeLabel: Record<ProjectType, string> = {
  villa: 'Villa',
  residential: 'Residential',
  hotel: 'Hotel',
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
};
