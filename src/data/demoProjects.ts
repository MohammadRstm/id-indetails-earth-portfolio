import type { Project } from './project';

/**
 * Illustrative projects. Names, clients and details are invented to show how
 * work will be presented; the photographs are free-licence stock images that
 * do not show the buildings described, credited on each image.
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
    location: { city: 'Lisbon', country: 'Portugal', lat: 38.7114, lng: -9.13 },
    year: 2023,
    client: 'Casa Tejo Development',
    description:
      'Twenty-four lofts inside a restored nineteenth-century warehouse on the slopes of the Alfama district. The original pine trusses and lime walls were kept and exposed. New floors are hung as light steel mezzanines inside the old volume, so each loft reads as a room within a room, and a planted courtyard is cut through the centre to bring daylight down to the lowest flats.',
    thumbnail: '/projects/alfama-lofts/thumb.jpg',
    hero: {
      src: '/projects/alfama-lofts/hero.jpg',
      alt: 'A Lisbon apartment facade covered in blue ceramic tiles with French windows and wrought-iron balconies.',
      credit: { photographer: 'Pascal B.', source: 'Pexels', url: 'https://www.pexels.com/photo/blue-villa-with-balconies-17330288/' },
    },
    gallery: [
      {
        src: '/projects/alfama-lofts/gallery-1.jpg',
        alt: 'Terracotta rooftops and colourful houses of an old Lisbon hillside district sloping toward the river.',
        credit: { photographer: 'Ndumiso Zimu', source: 'Pexels', url: 'https://www.pexels.com/photo/colorful-rooftops-of-lisbon-overlooking-the-river-36492062/' },
      },
      {
        src: '/projects/alfama-lofts/gallery-2.jpg',
        alt: 'Pastel apartment buildings with wrought-iron balconies and hanging laundry under a blue sky.',
        credit: { photographer: 'Masood Aslami', source: 'Pexels', url: 'https://www.pexels.com/photo/facade-of-lisbon-buildings-16549951/' },
      },
    ],
  },
  {
    id: 2,
    slug: 'atlas-riad-hotel',
    showInConveyor: true,
    conveyorOrder: 2,
    title: 'Atlas Riad Hotel',
    type: 'hotel',
    status: 'completed',
    location: { city: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
    year: 2022,
    client: 'Maison Atlas Hospitality',
    description:
      'A nineteen-key boutique hotel built around three linked courtyards inside the medina walls. Each courtyard is given its own temperature and light: a shaded fountain court, an orange-tree garden and a rooftop pool terrace facing the Atlas mountains. Thick tadelakt walls and timber screens keep the rooms cool through the summer without heavy air conditioning.',
    thumbnail: '/projects/atlas-riad-hotel/thumb.jpg',
    hero: {
      src: '/projects/atlas-riad-hotel/hero.jpg',
      alt: 'A riad-style hotel courtyard with a turquoise pool, brick arches and carved columns.',
      credit: { photographer: 'IslandHopper X', source: 'Pexels', url: 'https://www.pexels.com/photo/swimming-pool-in-the-la-sultana-hotel-in-marrakech-morocco-18320907/' },
    },
    gallery: [
      {
        src: '/projects/atlas-riad-hotel/gallery-1.jpg',
        alt: 'A pink Moroccan courtyard with a tiled fountain, green arched doors and zellige tilework.',
        credit: { photographer: 'Mike van Schoonderwalt', source: 'Pexels', url: 'https://www.pexels.com/photo/pink-patio-with-decorative-tiles-and-fountain-5504503/' },
      },
      {
        src: '/projects/atlas-riad-hotel/gallery-2.jpg',
        alt: 'A view looking down into a white carved-plaster riad courtyard with a mosaic floor and seating.',
        credit: { photographer: 'Moussa Idrissi', source: 'Pexels', url: 'https://www.pexels.com/photo/interior-of-the-riad-palais-sebban-marrakesh-morocco-15531325/' },
      },
    ],
  },
  {
    id: 3,
    slug: 'aegean-cliff-villa',
    showInConveyor: true,
    conveyorOrder: 3,
    title: 'Aegean Cliff Villa',
    type: 'villa',
    status: 'completed',
    location: { city: 'Mykonos', country: 'Greece', lat: 37.4467, lng: 25.3289 },
    year: 2024,
    client: 'Private client',
    description:
      'A whitewashed family villa stepped down a cliff above the Aegean, every room opening onto the sea. The house is broken into four cubic volumes that follow the fall of the land, linked by outdoor stairs and shaded terraces. Deep window reveals and a planted roof protect the interiors from the meltemi wind, while an infinity pool runs along the lowest terrace.',
    thumbnail: '/projects/aegean-cliff-villa/thumb.jpg',
    hero: {
      src: '/projects/aegean-cliff-villa/hero.jpg',
      alt: 'A whitewashed cubic villa with stone walls and a turquoise pool under a deep blue sky.',
      credit: { photographer: 'Abdulrahman Alyaarobi', source: 'Pexels', url: 'https://www.pexels.com/photo/whitewashed-villas-and-pool-in-mykonos-greece-38035858/' },
    },
    gallery: [
      {
        src: '/projects/aegean-cliff-villa/gallery-1.jpg',
        alt: 'Whitewashed multi-level villas with arched terraces and blue accents stepping up a rocky hillside.',
        credit: { photographer: 'Diego F. Parra', source: 'Pexels', url: 'https://www.pexels.com/photo/traditional-white-buildings-on-a-greek-island-15241825/' },
      },
      {
        src: '/projects/aegean-cliff-villa/gallery-2.jpg',
        alt: 'A white facade with blue shutters and a wrought-iron balcony framed by orange flowering vines.',
        credit: { photographer: 'AXP Photography', source: 'Pexels', url: 'https://www.pexels.com/photo/balcony-of-a-white-seaside-villa-with-blue-shutters-16428291/' },
      },
    ],
  },
  {
    id: 4,
    slug: 'corniche-residences',
    showInConveyor: true,
    conveyorOrder: 4,
    title: 'Corniche Residences',
    type: 'residential',
    status: 'in-progress',
    location: { city: 'Beirut', country: 'Lebanon', lat: 33.8959, lng: 35.4784 },
    year: 2026,
    client: 'Raouché Estates',
    description:
      'A sixteen-storey residential building facing the Mediterranean along the Beirut corniche. Every apartment has a deep loggia that doubles as an outdoor room. The loggias shift slightly from floor to floor, giving the facade a gentle rhythm and shading the glass behind them. A shared garden on the podium roof sits above the street noise.',
    thumbnail: '/projects/corniche-residences/thumb.jpg',
    hero: {
      src: '/projects/corniche-residences/hero.jpg',
      alt: 'A terraced residential tower with white balconies and planted decks, seen through palm fronds against a blue sky.',
      credit: { photographer: 'Ali MAROUNI', source: 'Pexels', url: 'https://www.pexels.com/photo/modern-urban-architecture-with-palm-tree-29677954/' },
    },
    gallery: [
      {
        src: '/projects/corniche-residences/gallery-1.jpg',
        alt: 'A waterfront city skyline glowing at sunset with a small boat on calm water in the foreground.',
        credit: { photographer: 'Eyüpcan Timur', source: 'Pexels', url: 'https://www.pexels.com/photo/sunset-view-of-the-beirut-waterfront-skyline-31629167/' },
      },
      {
        src: '/projects/corniche-residences/gallery-2.jpg',
        alt: 'The upper floors of a high-rise apartment tower with stacked, angled concrete balconies.',
        credit: { photographer: 'Jason D', source: 'Pexels', url: 'https://www.pexels.com/photo/beirut-terraces-in-beirut-17107019/' },
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
    location: { city: 'Dubai', country: 'United Arab Emirates', lat: 25.0805, lng: 55.1403 },
    year: 2021,
    client: 'Crown Hospitality Group',
    description:
      'A 320-key waterfront hotel tower with a sky lobby and pool deck overlooking Dubai Marina. The tower is wrapped in a fine vertical fin facade that reads as a single crown from the water and filters the desert sun. A sky lobby on the 40th floor gives every guest the view on arrival, and the podium opens onto the promenade with shaded terraces.',
    thumbnail: '/projects/marina-crown-hotel/thumb.jpg',
    hero: {
      src: '/projects/marina-crown-hotel/hero.jpg',
      alt: 'A luxury resort hotel made of stacked, illuminated terraced volumes glowing gold against the night sky.',
      credit: { photographer: 'San Photography', source: 'Pexels', url: 'https://www.pexels.com/photo/facade-of-an-illuminated-atlantis-the-royal-hotel-in-dubai-uae-14915303/' },
    },
    gallery: [
      {
        src: '/projects/marina-crown-hotel/gallery-1.jpg',
        alt: 'A sand-coloured beachfront hotel complex and high-rise towers beside a curved sandy shoreline at sunset.',
        credit: { photographer: 'Mikhail Nilov', source: 'Pexels', url: 'https://www.pexels.com/photo/dubai-sea-shore-with-bahi-ajman-palace-hotel-8319468/' },
      },
      {
        src: '/projects/marina-crown-hotel/gallery-2.jpg',
        alt: 'A glass tower with a large rectangular opening rising above palm trees.',
        credit: { photographer: 'Mauricio Krupka Buendia', source: 'Pexels', url: 'https://www.pexels.com/photo/iconic-modern-skyscraper-against-blue-sky-30506369/' },
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
    location: { city: 'Ubud', country: 'Indonesia', lat: -8.5069, lng: 115.2625 },
    year: 2023,
    client: 'Private client',
    description:
      'An open-sided retreat raised on stone plinths at the edge of a rainforest ravine. Pavilions with wide overhanging roofs sit on stone plinths, connected by covered walkways. Walls slide away entirely so living spaces become verandas, and the pool is set into the ravine edge so it appears to merge with the treetops.',
    thumbnail: '/projects/ubud-forest-villa/thumb.jpg',
    hero: {
      src: '/projects/ubud-forest-villa/hero.jpg',
      alt: 'A contemporary tropical villa with timber cladding, stone walls and a cantilevered canopy among palms.',
      credit: { photographer: 'Alef Morais', source: 'Pexels', url: 'https://www.pexels.com/photo/tropical-luxury-home-with-modern-architecture-34277690/' },
    },
    gallery: [
      {
        src: '/projects/ubud-forest-villa/gallery-1.jpg',
        alt: 'Low-rise villa pavilions and a pool on a green clifftop above tropical forest.',
        credit: { photographer: 'Tom Fisk', source: 'Pexels', url: 'https://www.pexels.com/photo/luxury-cliffside-villa-in-bali-with-infinity-pool-35043038/' },
      },
      {
        src: '/projects/ubud-forest-villa/gallery-2.jpg',
        alt: 'A long lap pool in a lush tropical garden with frangipani trees and a villa pavilion.',
        credit: { photographer: 'Mark Direen', source: 'Pexels', url: 'https://www.pexels.com/photo/tropical-villa-pool-in-lush-bali-garden-36418268/' },
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
    location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    year: 2028,
    client: 'Harbourline Living',
    description:
      'A slender residential tower with winter gardens on every level, overlooking Sydney Harbour. The tower tapers as it rises, and its corners are carved into enclosed winter gardens with operable glass, giving every home a sheltered outdoor room. A public laneway at ground level links the street to the harbour foreshore.',
    thumbnail: '/projects/harbour-tower-apartments/thumb.jpg',
    hero: {
      src: '/projects/harbour-tower-apartments/hero.jpg',
      alt: 'Two modern residential towers rising against a clear blue sky.',
      credit: { photographer: 'Cesar G', source: 'Pexels', url: 'https://www.pexels.com/photo/skyscrapers-under-clear-sydney-sky-33927009/' },
    },
    gallery: [
      {
        src: '/projects/harbour-tower-apartments/gallery-1.jpg',
        alt: 'Contemporary waterfront apartment buildings on a timber wharf beside blue harbour water.',
        credit: { photographer: 'sasif awan', source: 'Pexels', url: 'https://www.pexels.com/photo/modern-waterfront-buildings-against-clear-sky-38715566/' },
      },
      {
        src: '/projects/harbour-tower-apartments/gallery-2.jpg',
        alt: 'The upper floors of a residential tower with layered horizontal balconies against a deep blue sky.',
        credit: { photographer: 'Jan van der Wolf', source: 'Pexels', url: 'https://www.pexels.com/photo/modern-high-rise-apartment-building-against-blue-sky-40065479/' },
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
    location: { city: 'Cape Town', country: 'South Africa', lat: -33.9399, lng: 18.377 },
    year: 2022,
    client: 'Private client',
    description:
      'A cantilevered concrete house above Clifton Bay, framed between the ocean and Lion’s Head. Two concrete planes slide past each other: the lower one holds bedrooms tucked into the hillside, the upper one cantilevers towards the ocean with an open living floor and a pool that projects beyond the rock. A glazed stair links the two and frames the mountain.',
    thumbnail: '/projects/clifton-bay-house/thumb.jpg',
    hero: {
      src: '/projects/clifton-bay-house/hero.jpg',
      alt: 'A contemporary white villa with glass balconies, palm trees and a long swimming pool on a timber deck.',
      credit: { photographer: 'Abid Ali', source: 'Pexels', url: 'https://www.pexels.com/photo/white-and-brown-concrete-building-near-the-swimming-pool-10647324/' },
    },
    gallery: [
      {
        src: '/projects/clifton-bay-house/gallery-1.jpg',
        alt: 'A modern two-storey house with timber and pale stone cladding behind a rectangular pool and lawn.',
        credit: { photographer: 'Max Vakhtbovych', source: 'Pexels', url: 'https://www.pexels.com/photo/a-modern-house-with-swimming-pool-8134745/' },
      },
      {
        src: '/projects/clifton-bay-house/gallery-2.jpg',
        alt: 'Houses perched on a wooded hillside above the water.',
        credit: { photographer: 'Robert So', source: 'Pexels', url: 'https://www.pexels.com/photo/houses-by-the-sea-17944688/' },
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
    location: { city: 'Tulum', country: 'Mexico', lat: 20.2114, lng: -87.4654 },
    year: 2026,
    client: 'Selva Mar Resorts',
    description:
      'A low-rise beach hotel of forty suites set among the jungle and dunes of the Riviera Maya. Suites are grouped in small two-storey clusters threaded between existing trees, raised on piles above the dune. Timber lattices and chukum plaster soften the buildings into the jungle, and a sinuous boardwalk leads from the arrival court to the sea.',
    thumbnail: '/projects/tulum-beach-hotel/thumb.jpg',
    hero: {
      src: '/projects/tulum-beach-hotel/hero.jpg',
      alt: 'An aerial view of a boutique hotel with a thatched pavilion and rooftop pool surrounded by jungle.',
      credit: { photographer: 'hugoteconecta', source: 'Pexels', url: 'https://www.pexels.com/photo/mansion-among-trees-on-an-estate-20068205/' },
    },
    gallery: [
      {
        src: '/projects/tulum-beach-hotel/gallery-1.jpg',
        alt: 'Thatched-roof beachfront hotel suites behind green coastal vegetation and a white sand shore.',
        credit: { photographer: 'Edgar Del Valle', source: 'Pexels', url: 'https://www.pexels.com/photo/brown-nipa-hut-near-a-beach-6048627/' },
      },
      {
        src: '/projects/tulum-beach-hotel/gallery-2.jpg',
        alt: 'An aerial view of a beachside resort tucked into coastal forest beside turquoise sea.',
        credit: { photographer: 'Amar Preciado', source: 'Pexels', url: 'https://www.pexels.com/photo/aerial-view-of-hotel-bahia-principe-grand-tulum-on-the-seashore-in-tulum-mexico-14359340/' },
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
    location: { city: 'New York', country: 'United States', lat: 40.7163, lng: -74.0086 },
    year: 2020,
    client: 'Hudson Row Partners',
    description:
      'A cast-iron loft building in Tribeca restored and extended with a recessed glass penthouse. The historic facade was restored piece by piece, while a two-storey glass penthouse is set back so it disappears from the sidewalk. Inside, the original columns and timber floors define open lofts, and a new light well brings daylight to the centre of the deep plan.',
    thumbnail: '/projects/tribeca-lofts/thumb.jpg',
    hero: {
      src: '/projects/tribeca-lofts/hero.jpg',
      alt: 'An ornate cast-iron building facade with arched windows and carved columns against a blue sky.',
      credit: { photographer: 'Eva Bronzini', source: 'Pexels', url: 'https://www.pexels.com/photo/e-v-haughwout-building-in-new-york-city-usa-6076539/' },
    },
    gallery: [
      {
        src: '/projects/tribeca-lofts/gallery-1.jpg',
        alt: 'Red-brick apartment towers with rows of balconies on a city street.',
        credit: { photographer: '_ Whittington', source: 'Pexels', url: 'https://www.pexels.com/photo/new-york-city-brick-apartment-buildings-38894397/' },
      },
      {
        src: '/projects/tribeca-lofts/gallery-2.jpg',
        alt: 'A red-brick loft building with arched upper windows and small balconies catching the late light.',
        credit: { photographer: 'Willian Justen de Vasconcellos', source: 'Pexels', url: 'https://www.pexels.com/photo/brick-building-with-modern-industrial-design-29560594/' },
      },
    ],
  },
];
