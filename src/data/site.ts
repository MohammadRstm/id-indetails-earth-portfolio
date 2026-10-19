/**
 * Company details shown across the site. Every value here is a PLACEHOLDER
 * until the real details are supplied; this is the one file to update.
 */

export interface SocialLink {
  id: number;
  label: string;
  url: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
}

export interface ContactInfo {
  /** Shown on the contact page; the contact form's messages are sent here. Null until the company sets one. */
  email: string | null;
}

export interface SiteSettings {
  /** Null until a favicon is chosen in the dashboard; the site then keeps its own icon. */
  faviconUrl: string | null;
}

/** PLACEHOLDER: the address enquiries should reach. */
export const contactInfo: ContactInfo = { email: 'studio@example.com' };

export const siteSettings: SiteSettings = { faviconUrl: '/favicon.svg' };

/** PLACEHOLDER: each points at the platform's home page until the studio's own profiles are supplied. */
export const socialLinks: SocialLink[] = [
  { id: 1, label: 'Instagram', url: 'https://www.instagram.com/' },
  { id: 2, label: 'LinkedIn', url: 'https://www.linkedin.com/' },
  { id: 3, label: 'Facebook', url: 'https://www.facebook.com/' },
  { id: 4, label: 'Behance', url: 'https://www.behance.net/' },
];

/** PLACEHOLDER: the studio's services and how it describes them. */
export const services: Service[] = [
  {
    id: 1,
    title: 'Architecture',
    description: 'From the first sketch to the finished building: concept, design development, permits and construction drawings.',
  },
  {
    id: 2,
    title: 'Interior design',
    description: 'Spaces, materials, lighting and furniture designed together with the building, so inside and outside read as one.',
  },
  {
    id: 3,
    title: 'Landscape design',
    description: 'Gardens, courtyards and terraces planned around climate, water and native planting.',
  },
  {
    id: 4,
    title: 'Master planning',
    description: 'Site strategies for resorts, residential communities and mixed-use developments.',
  },
  {
    id: 5,
    title: 'Renovation and restoration',
    description: 'Giving existing and heritage buildings a new use while keeping what makes them special.',
  },
  {
    id: 6,
    title: 'Project management',
    description: 'Coordinating consultants and contractors, and supervising work on site through to handover.',
  },
];
