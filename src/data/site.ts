/**
 * Company details shown across the site. Every value here is a PLACEHOLDER
 * until the real details are supplied; this is the one file to update.
 */

export interface SocialLink {
  label: string;
  url: string;
}

export interface Service {
  title: string;
  description: string;
}

/** PLACEHOLDER: the address enquiries should reach. */
export const contactEmail = 'studio@example.com';

/** PLACEHOLDER: each points at the platform's home page until the studio's own profiles are supplied. */
export const socialLinks: SocialLink[] = [
  { label: 'Instagram', url: 'https://www.instagram.com/' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
  { label: 'Facebook', url: 'https://www.facebook.com/' },
  { label: 'Behance', url: 'https://www.behance.net/' },
];

/** PLACEHOLDER: the studio's services and how it describes them. */
export const services: Service[] = [
  {
    title: 'Architecture',
    description: 'From the first sketch to the finished building: concept, design development, permits and construction drawings.',
  },
  {
    title: 'Interior design',
    description: 'Spaces, materials, lighting and furniture designed together with the building, so inside and outside read as one.',
  },
  {
    title: 'Landscape design',
    description: 'Gardens, courtyards and terraces planned around climate, water and native planting.',
  },
  {
    title: 'Master planning',
    description: 'Site strategies for resorts, residential communities and mixed-use developments.',
  },
  {
    title: 'Renovation and restoration',
    description: 'Giving existing and heritage buildings a new use while keeping what makes them special.',
  },
  {
    title: 'Project management',
    description: 'Coordinating consultants and contractors, and supervising work on site through to handover.',
  },
];
