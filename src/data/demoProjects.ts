import type { Project } from './project';

/**
 * Illustrative projects. Names, clients and details are invented to show how
 * work will be presented; the photographs are free-licence stock images (Pexels
 * License, no credit required) that do not show the buildings described.
 */
export const demoProjects: Project[] = [
  {
    id: 1,
    slug: 'alfama-lofts',
    showInConveyor: true,
    conveyorOrder: 1,
    title: 'Alfama Lofts',
    type: 'residential',
    status: 'completed',
    location: { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', lat: 38.7114, lng: -9.13, approximate: false },
    year: 2023,
    client: 'Casa Tejo Development',
    description:
      'Twenty-four lofts inside a restored nineteenth-century warehouse on the slopes of the Alfama district. The original pine trusses and lime walls were kept and exposed. New floors are hung as light steel mezzanines inside the old volume, so each loft reads as a room within a room, and a planted courtyard is cut through the centre to bring daylight down to the lowest flats.',
    thumbnail: '/projects/alfama-lofts/thumb.jpg',
    hero: {
      src: '/projects/alfama-lofts/hero.jpg',
      alt: 'A Lisbon apartment facade covered in blue ceramic tiles with French windows and wrought-iron balconies.',
    },
    gallery: [
      {
        src: '/projects/alfama-lofts/gallery-1.jpg',
        alt: 'Terracotta rooftops and colourful houses of an old Lisbon hillside district sloping toward the river.',
      },
      {
        src: '/projects/alfama-lofts/gallery-2.jpg',
        alt: 'Pastel apartment buildings with wrought-iron balconies and hanging laundry under a blue sky.',
      },
    ],
  },
  {
    id: 2,
    slug: 'byblos-harbour-hotel',
    showInConveyor: true,
    conveyorOrder: 3,
    title: 'Byblos Harbour Hotel',
    type: 'hotel',
    status: 'completed',
    location: { city: 'Byblos', country: 'Lebanon', countryCode: 'LB', lat: 34.1211, lng: 35.6481, approximate: false },
    year: 2022,
    client: 'Jbeil Heritage Hospitality',
    description:
      'A nineteen-key boutique hotel in three restored stone houses beside the old harbour, joined by linked courtyards. Each courtyard is given its own temperature and light: a shaded fountain court, an orange-tree garden and a rooftop pool terrace facing the sea. Thick limestone walls and timber screens keep the rooms cool through the summer without heavy air conditioning.',
    thumbnail: '/projects/byblos-harbour-hotel/thumb.jpg',
    hero: {
      src: '/projects/byblos-harbour-hotel/hero.jpg',
      alt: 'A hotel courtyard with a turquoise pool, brick arches and carved columns.',
    },
    gallery: [
      {
        src: '/projects/byblos-harbour-hotel/gallery-1.jpg',
        alt: 'A pink courtyard with a tiled fountain, green arched doors and patterned tilework.',
      },
      {
        src: '/projects/byblos-harbour-hotel/gallery-2.jpg',
        alt: 'A view looking down into a white carved-plaster courtyard with a mosaic floor and seating.',
      },
    ],
  },
  {
    id: 3,
    slug: 'batroun-cliff-villa',
    showInConveyor: true,
    conveyorOrder: 4,
    title: 'Batroun Cliff Villa',
    type: 'villa',
    status: 'completed',
    location: { city: 'Batroun', country: 'Lebanon', countryCode: 'LB', lat: 34.2553, lng: 35.6581, approximate: false },
    year: 2024,
    client: 'Private client',
    description:
      'A whitewashed family villa stepped down a limestone cliff above the Mediterranean, every room opening onto the sea. The house is broken into four cubic volumes that follow the fall of the land, linked by outdoor stairs and shaded terraces. Deep window reveals and a planted roof protect the interiors from the sea wind, while an infinity pool runs along the lowest terrace.',
    thumbnail: '/projects/batroun-cliff-villa/thumb.jpg',
    hero: {
      src: '/projects/batroun-cliff-villa/hero.jpg',
      alt: 'A whitewashed cubic villa with stone walls and a turquoise pool under a deep blue sky.',
    },
    gallery: [
      {
        src: '/projects/batroun-cliff-villa/gallery-1.jpg',
        alt: 'Whitewashed multi-level villas with arched terraces and blue accents stepping up a rocky hillside.',
      },
      {
        src: '/projects/batroun-cliff-villa/gallery-2.jpg',
        alt: 'A white facade with blue shutters and a wrought-iron balcony framed by orange flowering vines.',
      },
    ],
  },
  {
    id: 4,
    slug: 'corniche-residences',
    showInConveyor: true,
    conveyorOrder: 2,
    title: 'Corniche Residences',
    type: 'residential',
    status: 'in-progress',
    location: { city: 'Beirut', country: 'Lebanon', countryCode: 'LB', lat: 33.8959, lng: 35.4784, approximate: false },
    year: 2026,
    client: 'Raouché Estates',
    description:
      'A sixteen-storey residential building facing the Mediterranean along the Beirut corniche. Every apartment has a deep loggia that doubles as an outdoor room. The loggias shift slightly from floor to floor, giving the facade a gentle rhythm and shading the glass behind them. A shared garden on the podium roof sits above the street noise.',
    thumbnail: '/projects/corniche-residences/thumb.jpg',
    hero: {
      src: '/projects/corniche-residences/hero.jpg',
      alt: 'A terraced residential tower with white balconies and planted decks, seen through palm fronds against a blue sky.',
    },
    gallery: [
      {
        src: '/projects/corniche-residences/gallery-1.jpg',
        alt: 'A waterfront city skyline glowing at sunset with a small boat on calm water in the foreground.',
      },
      {
        src: '/projects/corniche-residences/gallery-2.jpg',
        alt: 'The upper floors of a high-rise apartment tower with stacked, angled concrete balconies.',
      },
    ],
  },
  {
    id: 5,
    slug: 'marina-crown-hotel',
    showInConveyor: true,
    conveyorOrder: 5,
    title: 'Marina Crown Hotel',
    type: 'hotel',
    status: 'completed',
    location: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.0805, lng: 55.1403, approximate: false },
    year: 2021,
    client: 'Crown Hospitality Group',
    description:
      'A 320-key waterfront hotel tower with a sky lobby and pool deck overlooking Dubai Marina. The tower is wrapped in a fine vertical fin facade that reads as a single crown from the water and filters the desert sun. A sky lobby on the 40th floor gives every guest the view on arrival, and the podium opens onto the promenade with shaded terraces.',
    thumbnail: '/projects/marina-crown-hotel/thumb.jpg',
    hero: {
      src: '/projects/marina-crown-hotel/hero.jpg',
      alt: 'A luxury resort hotel made of stacked, illuminated terraced volumes glowing gold against the night sky.',
    },
    gallery: [
      {
        src: '/projects/marina-crown-hotel/gallery-1.jpg',
        alt: 'A sand-coloured beachfront hotel complex and high-rise towers beside a curved sandy shoreline at sunset.',
      },
      {
        src: '/projects/marina-crown-hotel/gallery-2.jpg',
        alt: 'A glass tower with a large rectangular opening rising above palm trees.',
      },
    ],
  },
  {
    id: 6,
    slug: 'ubud-forest-villa',
    showInConveyor: true,
    conveyorOrder: 6,
    title: 'Ubud Forest Villa',
    type: 'villa',
    status: 'completed',
    location: { city: 'Ubud', country: 'Indonesia', countryCode: 'ID', lat: -8.5069, lng: 115.2625, approximate: false },
    year: 2023,
    client: 'Private client',
    description:
      'An open-sided retreat raised on stone plinths at the edge of a rainforest ravine. Pavilions with wide overhanging roofs sit on stone plinths, connected by covered walkways. Walls slide away entirely so living spaces become verandas, and the pool is set into the ravine edge so it appears to merge with the treetops.',
    thumbnail: '/projects/ubud-forest-villa/thumb.jpg',
    hero: {
      src: '/projects/ubud-forest-villa/hero.jpg',
      alt: 'A contemporary tropical villa with timber cladding, stone walls and a cantilevered canopy among palms.',
    },
    gallery: [
      {
        src: '/projects/ubud-forest-villa/gallery-1.jpg',
        alt: 'Low-rise villa pavilions and a pool on a green clifftop above tropical forest.',
      },
      {
        src: '/projects/ubud-forest-villa/gallery-2.jpg',
        alt: 'A long lap pool in a lush tropical garden with frangipani trees and a villa pavilion.',
      },
    ],
  },
  {
    id: 7,
    slug: 'harbour-tower-apartments',
    showInConveyor: true,
    conveyorOrder: 7,
    title: 'Harbour Tower Apartments',
    type: 'residential',
    status: 'in-progress',
    location: { city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093, approximate: false },
    year: 2028,
    client: 'Harbourline Living',
    description:
      'A slender residential tower with winter gardens on every level, overlooking Sydney Harbour. The tower tapers as it rises, and its corners are carved into enclosed winter gardens with operable glass, giving every home a sheltered outdoor room. A public laneway at ground level links the street to the harbour foreshore.',
    thumbnail: '/projects/harbour-tower-apartments/thumb.jpg',
    hero: {
      src: '/projects/harbour-tower-apartments/hero.jpg',
      alt: 'Two modern residential towers rising against a clear blue sky.',
    },
    gallery: [
      {
        src: '/projects/harbour-tower-apartments/gallery-1.jpg',
        alt: 'Contemporary waterfront apartment buildings on a timber wharf beside blue harbour water.',
      },
      {
        src: '/projects/harbour-tower-apartments/gallery-2.jpg',
        alt: 'The upper floors of a residential tower with layered horizontal balconies against a deep blue sky.',
      },
    ],
  },
  {
    id: 8,
    slug: 'clifton-bay-house',
    showInConveyor: true,
    conveyorOrder: 8,
    title: 'Clifton Bay House',
    type: 'villa',
    status: 'completed',
    location: { city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', lat: -33.9399, lng: 18.377, approximate: false },
    year: 2022,
    client: 'Private client',
    description:
      'A cantilevered concrete house above Clifton Bay, framed between the ocean and Lion’s Head. Two concrete planes slide past each other: the lower one holds bedrooms tucked into the hillside, the upper one cantilevers towards the ocean with an open living floor and a pool that projects beyond the rock. A glazed stair links the two and frames the mountain.',
    thumbnail: '/projects/clifton-bay-house/thumb.jpg',
    hero: {
      src: '/projects/clifton-bay-house/hero.jpg',
      alt: 'A contemporary white villa with glass balconies, palm trees and a long swimming pool on a timber deck.',
    },
    gallery: [
      {
        src: '/projects/clifton-bay-house/gallery-1.jpg',
        alt: 'A modern two-storey house with timber and pale stone cladding behind a rectangular pool and lawn.',
      },
      {
        src: '/projects/clifton-bay-house/gallery-2.jpg',
        alt: 'Houses perched on a wooded hillside above the water.',
      },
    ],
  },
  {
    id: 9,
    slug: 'tulum-beach-hotel',
    showInConveyor: true,
    conveyorOrder: 9,
    title: 'Tulum Beach Hotel',
    type: 'hotel',
    status: 'in-progress',
    location: { city: 'Tulum', country: 'Mexico', countryCode: 'MX', lat: 20.2114, lng: -87.4654, approximate: false },
    year: 2026,
    client: 'Selva Mar Resorts',
    description:
      'A low-rise beach hotel of forty suites set among the jungle and dunes of the Riviera Maya. Suites are grouped in small two-storey clusters threaded between existing trees, raised on piles above the dune. Timber lattices and chukum plaster soften the buildings into the jungle, and a sinuous boardwalk leads from the arrival court to the sea.',
    thumbnail: '/projects/tulum-beach-hotel/thumb.jpg',
    hero: {
      src: '/projects/tulum-beach-hotel/hero.jpg',
      alt: 'An aerial view of a boutique hotel with a thatched pavilion and rooftop pool surrounded by jungle.',
    },
    gallery: [
      {
        src: '/projects/tulum-beach-hotel/gallery-1.jpg',
        alt: 'Thatched-roof beachfront hotel suites behind green coastal vegetation and a white sand shore.',
      },
      {
        src: '/projects/tulum-beach-hotel/gallery-2.jpg',
        alt: 'An aerial view of a beachside resort tucked into coastal forest beside turquoise sea.',
      },
    ],
  },
  {
    id: 10,
    slug: 'tribeca-lofts',
    showInConveyor: true,
    conveyorOrder: 10,
    title: 'Tribeca Lofts',
    type: 'residential',
    status: 'completed',
    location: { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7163, lng: -74.0086, approximate: false },
    year: 2020,
    client: 'Hudson Row Partners',
    description:
      'A cast-iron loft building in Tribeca restored and extended with a recessed glass penthouse. The historic facade was restored piece by piece, while a two-storey glass penthouse is set back so it disappears from the sidewalk. Inside, the original columns and timber floors define open lofts, and a new light well brings daylight to the centre of the deep plan.',
    thumbnail: '/projects/tribeca-lofts/thumb.jpg',
    hero: {
      src: '/projects/tribeca-lofts/hero.jpg',
      alt: 'An ornate cast-iron building facade with arched windows and carved columns against a blue sky.',
    },
    gallery: [
      {
        src: '/projects/tribeca-lofts/gallery-1.jpg',
        alt: 'Red-brick apartment towers with rows of balconies on a city street.',
      },
      {
        src: '/projects/tribeca-lofts/gallery-2.jpg',
        alt: 'A red-brick loft building with arched upper windows and small balconies catching the late light.',
      },
    ],
  },
];
