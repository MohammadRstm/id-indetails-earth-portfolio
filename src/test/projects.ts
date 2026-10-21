import type { Office } from '../data/offices';
import type { Project, ProjectStatus, ProjectType } from '../data/project';

/**
 * Made-up projects and offices for the tests, spread over real places so the
 * globe and country maths have something real to work on. The site itself
 * only ever shows what the API sends.
 */

let nextId = 1;

function project(
  slug: string,
  type: ProjectType,
  status: ProjectStatus,
  year: number,
  client: string,
  place: { city: string; country: string; countryCode: string; lat: number; lng: number },
): Project {
  const title = slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
  return {
    id: nextId++,
    slug,
    title,
    type,
    status,
    location: { ...place, approximate: false },
    year,
    client,
    description: `${title}, a test project.`,
    thumbnail: `/test/${slug}/thumb.jpg`,
    hero: { src: `/test/${slug}/hero.jpg`, alt: title },
    gallery: [{ src: `/test/${slug}/gallery-1.jpg`, alt: `${title}, inside` }],
    showInConveyor: true,
    conveyorOrder: nextId,
  };
}

export const testProjects: Project[] = [
  project('alfama-lofts', 'residential', 'completed', 2023, 'Casa Tejo Development', {
    city: 'Lisbon',
    country: 'Portugal',
    countryCode: 'PT',
    lat: 38.7114,
    lng: -9.13,
  }),
  project('corniche-residences', 'residential', 'in-progress', 2026, 'Raouché Estates', {
    city: 'Beirut',
    country: 'Lebanon',
    countryCode: 'LB',
    lat: 33.8959,
    lng: 35.4784,
  }),
  project('byblos-harbour-hotel', 'hotel', 'completed', 2022, 'Jbeil Heritage Hospitality', {
    city: 'Byblos',
    country: 'Lebanon',
    countryCode: 'LB',
    lat: 34.1211,
    lng: 35.6481,
  }),
  project('batroun-cliff-villa', 'villa', 'completed', 2024, 'Private client', {
    city: 'Batroun',
    country: 'Lebanon',
    countryCode: 'LB',
    lat: 34.2553,
    lng: 35.6581,
  }),
  project('marina-crown-hotel', 'hotel', 'completed', 2021, 'Crown Hospitality Group', {
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 25.0805,
    lng: 55.1403,
  }),
  project('clifton-bay-house', 'villa', 'completed', 2022, 'Private client', {
    city: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    lat: -33.9399,
    lng: 18.377,
  }),
  project('tulum-beach-hotel', 'hotel', 'in-progress', 2026, 'Selva Mar Resorts', {
    city: 'Tulum',
    country: 'Mexico',
    countryCode: 'MX',
    lat: 20.2114,
    lng: -87.4654,
  }),
  project('tribeca-lofts', 'residential', 'completed', 2020, 'Hudson Row Partners', {
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7163,
    lng: -74.0086,
  }),
];

export const testOffices: Office[] = [
  { id: 1, city: 'Beirut', country: 'Lebanon', countryCode: 'LB', lat: 33.8938, lng: 35.5018, address: 'Test street, Beirut', phone: '+961 1 000 000' },
  { id: 2, city: 'Abidjan', country: "Côte d'Ivoire", countryCode: 'CI', lat: 5.36, lng: -4.0083, address: 'Test street, Abidjan', phone: '+225 27 00 00 00 00' },
];
