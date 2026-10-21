import { useEffect, useState } from 'react';
import { getContactInfo, getLocations, getServices, getSiteSettings, getSocialLinks } from '../api/website';
import type { Office } from '../data/offices';
import type { ContactInfo, Service, SiteSettings, SocialLink } from '../data/site';

/** Everything the site shows besides the projects. */
export interface SiteContent {
  /** False until every part has answered (or failed), so the site can wait for its settings before showing pages. */
  loaded: boolean;
  offices: Office[];
  services: Service[];
  contact: ContactInfo;
  socialLinks: SocialLink[];
  settings: SiteSettings;
}

export const emptySiteContent: SiteContent = {
  loaded: false,
  offices: [],
  services: [],
  contact: { email: null },
  socialLinks: [],
  settings: { faviconUrl: null, underConstruction: false },
};

/**
 * Loads the site's content from the website API. Each part stands alone: one
 * that fails is logged and stays empty, and the pages leave out what is empty,
 * so a broken list never takes a whole page down.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState(emptySiteContent);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const settle = <T,>(result: PromiseSettledResult<T>, fallback: T, what: string): T => {
      if (result.status === 'fulfilled') return result.value;
      if (!signal.aborted) console.error(`The site's ${what} failed to load`, result.reason);
      return fallback;
    };

    Promise.allSettled([getLocations(signal), getServices(signal), getContactInfo(signal), getSocialLinks(signal), getSiteSettings(signal)]).then(
      ([offices, services, contact, socialLinks, settings]) => {
        if (signal.aborted) return;
        setContent({
          loaded: true,
          offices: settle(offices, emptySiteContent.offices, 'offices'),
          services: settle(services, emptySiteContent.services, 'services'),
          contact: settle(contact, emptySiteContent.contact, 'contact details'),
          socialLinks: settle(socialLinks, emptySiteContent.socialLinks, 'social links'),
          settings: settle(settings, emptySiteContent.settings, 'settings'),
        });
      },
    );
    return () => controller.abort();
  }, []);

  return content;
}
