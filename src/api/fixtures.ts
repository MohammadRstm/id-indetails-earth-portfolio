/** A project exactly as the public website API sends it, per the agreed contract. Used by the API client's tests. */
export const apiProject = {
  id: 7,
  slug: 'aegean-cliff-villa',
  title: 'Aegean Cliff Villa',
  type: 'villa',
  status: 'completed',
  client: 'Private client',
  location: { city: 'Mykonos', country: 'Greece', countryCode: 'GR', lat: 37.4467, lng: 25.3289, approximate: false },
  year: 2024,
  description: 'A whitewashed family villa.',
  thumbnail: '/api/public/website/files/1',
  hero: { src: '/api/public/website/files/2', alt: 'The villa' },
  gallery: [{ src: '/api/public/website/files/3', alt: 'The pool' }],
  showInConveyor: true,
  conveyorOrder: 3,
};
