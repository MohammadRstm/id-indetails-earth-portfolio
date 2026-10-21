/** The company details the website API sends, edited in the app's Website area. */

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
  /** Switched on in the dashboard: every page but Contact and Privacy shows the under-construction page. */
  underConstruction: boolean;
}
