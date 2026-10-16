export type ProjectStatus = 'discovery' | 'in-development' | 'live' | 'completed';

export interface ProjectLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
  /** IANA time zone, used to show the local time at the location. */
  timeZone?: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectDetails {
  overview: string;
  scope: string[];
  stack: string[];
}

export interface Project {
  id: string;
  title: string;
  location: ProjectLocation;
  status: ProjectStatus;
  category: string;
  description: string;
  /** ISO date, `YYYY-MM` or `YYYY-MM-DD`. */
  startDate?: string;
  image?: ProjectImage;
  featured?: boolean;
  details?: ProjectDetails;
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  discovery: 'Discovery',
  'in-development': 'In development',
  live: 'Live',
  completed: 'Completed',
};
