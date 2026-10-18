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
  source: 'Unsplash' | 'Pexels';
  url: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  credit?: ImageCredit;
}

export interface Project {
  /** URL-safe slug; also the project's address, `/projects/<id>`. */
  id: string;
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
}

export const projectTypeLabel: Record<ProjectType, string> = {
  villa: 'Villa',
  residential: 'Residential',
  hotel: 'Hotel',
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
};
