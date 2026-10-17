export type ProjectType = 'villa' | 'residential' | 'hotel';

export type ProjectStatus = 'completed' | 'under-construction' | 'in-design';

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

export interface ProjectCredit {
  role: string;
  name: string;
}

export interface Project {
  /** URL-safe slug; also the project's address, `/projects/<id>`. */
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  location: ProjectLocation;
  /** Year of completion, or the expected year while the project is still under way. */
  year: number;
  client: string;
  /** Gross floor area in square metres. */
  areaSqm: number;
  services: string[];
  /** One or two sentences shown beside the project strip. */
  summary: string;
  brief: string;
  concept: string;
  materials: string[];
  sustainability: string[];
  /** Portrait crop used in the project strip. */
  thumbnail: string;
  hero: ProjectImage;
  gallery: ProjectImage[];
  team: ProjectCredit[];
}

export const projectTypeLabel: Record<ProjectType, string> = {
  villa: 'Villa',
  residential: 'Residential',
  hotel: 'Hotel',
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  completed: 'Completed',
  'under-construction': 'Under construction',
  'in-design': 'In design',
};
