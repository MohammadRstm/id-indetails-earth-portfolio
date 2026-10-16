import type { Project } from './project';

/**
 * Fictional demonstration projects. Names, places and details are illustrative
 * and do not describe real ID-Indetails clients or engagements.
 */
export const demoProjects: Project[] = [
  {
    id: 'tideline',
    title: 'Tideline berth planning',
    location: { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393, timeZone: 'Europe/Lisbon' },
    status: 'live',
    category: 'Logistics',
    description:
      'A berth and crane scheduling platform for a container terminal, replacing spreadsheet planning with one shared, live timeline.',
    startDate: '2024-03',
    featured: true,
    image: { src: '/projects/tideline.svg', alt: 'Illustrative preview of a berth planning timeline with vessel bars' },
    details: {
      overview:
        'Planners, crane operators and the gate team work from the same schedule. Vessel delays flow in from tracking feeds and the timeline reflows around them, flagging crane conflicts before they reach the quay.',
      scope: ['Berth planning timeline', 'Crane allocation rules', 'Vessel tracking integration', 'Shift handover reports'],
      stack: ['TypeScript', 'React', '.NET', 'PostgreSQL'],
    },
  },
  {
    id: 'harvest-ledger',
    title: 'Harvest ledger',
    location: { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, timeZone: 'Africa/Nairobi' },
    status: 'in-development',
    category: 'Agriculture',
    description:
      'An offline-first mobile app that lets cooperative field officers record deliveries and payouts where connectivity is patchy.',
    startDate: '2025-01',
    image: { src: '/projects/harvest-ledger.svg', alt: 'Illustrative preview of three mobile screens for recording deliveries' },
    details: {
      overview:
        'Records are captured on the device first and synchronised when a signal returns, with conflict handling designed around how collection days actually run.',
      scope: ['Offline data capture', 'Background synchronisation', 'Delivery receipts', 'Cooperative dashboards'],
      stack: ['Kotlin', 'SQLite', 'Node.js', 'PostgreSQL'],
    },
  },
  {
    id: 'straits-telemetry',
    title: 'Straits building telemetry',
    location: { city: 'Singapore', country: 'Singapore', lat: 1.2903, lng: 103.8519, timeZone: 'Asia/Singapore' },
    status: 'live',
    category: 'Energy and facilities',
    description:
      'Sensor telemetry and alerting for a group of office towers, tracking cooling load floor by floor through the working day.',
    startDate: '2023-09',
    image: { src: '/projects/straits-telemetry.svg', alt: 'Illustrative preview of a floor-by-floor cooling load chart' },
    details: {
      overview:
        'Thousands of readings a minute are condensed into a few views facilities staff can act on: which floors are drifting, which plant is working hardest, and what changed overnight.',
      scope: ['Sensor ingestion', 'Floor heat maps', 'Threshold alerting', 'Monthly energy reports'],
      stack: ['Go', 'TimescaleDB', 'React', 'MQTT'],
    },
  },
  {
    id: 'concourse',
    title: 'Concourse wayfinding',
    location: { city: 'Singapore', country: 'Singapore', lat: 1.2903, lng: 103.8519, timeZone: 'Asia/Singapore' },
    status: 'discovery',
    category: 'Mobility',
    description:
      'A wayfinding prototype for a transit interchange, testing indoor routing and live platform information on public displays.',
    startDate: '2025-08',
    details: {
      overview:
        'The discovery phase pairs short on-site studies with working prototypes, so routing and signage decisions are tested with travellers rather than argued in meetings.',
      scope: ['Passenger flow study', 'Indoor routing prototype', 'Display content system'],
      stack: ['TypeScript', 'WebGL', 'Python'],
    },
  },
  {
    id: 'wardflow',
    title: 'Wardflow bed management',
    location: { city: 'Montréal', country: 'Canada', lat: 45.5019, lng: -73.5674, timeZone: 'America/Toronto' },
    status: 'live',
    category: 'Healthcare operations',
    description:
      'A bed management board that gives hospital coordinators one view of admissions, discharges and room turnaround.',
    startDate: '2023-05',
    image: { src: '/projects/wardflow.svg', alt: 'Illustrative preview of a ward board with columns of bed cards' },
    details: {
      overview:
        'Coordinators see every ward at a glance and can hand a bed from cleaning to admission in two taps. The board is built for wall screens as well as phones on rounds.',
      scope: ['Ward board', 'Discharge planning', 'Cleaning turnaround tracking', 'Role-based access'],
      stack: ['C#', 'ASP.NET Core', 'SQL Server', 'React'],
    },
  },
  {
    id: 'signal-room',
    title: 'Signal room localisation',
    location: { city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, timeZone: 'Asia/Seoul' },
    status: 'completed',
    category: 'Media',
    description:
      'A subtitle and dubbing pipeline that routes each episode through translation, review and delivery for a streaming catalogue.',
    startDate: '2022-11',
    details: {
      overview:
        'Each title moves through a visible chain of steps with clear owners, so a late script change no longer means a week of email threads.',
      scope: ['Workflow engine', 'Subtitle review tool', 'Delivery packaging'],
      stack: ['Python', 'FFmpeg', 'PostgreSQL', 'Vue'],
    },
  },
  {
    id: 'shelfline',
    title: 'Shelfline replenishment',
    location: { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, timeZone: 'America/Sao_Paulo' },
    status: 'in-development',
    category: 'Retail',
    description:
      'Store inventory and replenishment for a regional grocery chain, combining shelf scans with supplier lead times.',
    startDate: '2024-10',
    image: { src: '/projects/shelfline.svg', alt: 'Illustrative preview of a shelf grid with stock levels' },
    details: {
      overview:
        'Shelf scans and sales data feed a daily order suggestion per store. Store managers stay in control: every suggestion explains itself and can be adjusted.',
      scope: ['Shelf scanning app', 'Order suggestions', 'Supplier lead-time model'],
      stack: ['TypeScript', 'React Native', 'Python', 'BigQuery'],
    },
  },
  {
    id: 'basalt',
    title: 'Basalt well analytics',
    location: { city: 'Reykjavík', country: 'Iceland', lat: 64.1466, lng: -21.9426, timeZone: 'Atlantic/Reykjavik' },
    status: 'live',
    category: 'Energy',
    description:
      'Analytics for geothermal well sensors: trend views, anomaly flags and maintenance planning for field engineers.',
    startDate: '2024-06',
    image: { src: '/projects/basalt.svg', alt: 'Illustrative preview of pressure and temperature trend lines' },
    details: {
      overview:
        'Engineers compare wells side by side, mark events on the timeline and plan maintenance windows around forecast demand.',
      scope: ['Sensor trend views', 'Anomaly flags', 'Maintenance planner'],
      stack: ['Rust', 'ClickHouse', 'React'],
    },
  },
  {
    id: 'commons',
    title: 'Commons room booking',
    location: { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631, timeZone: 'Australia/Melbourne' },
    status: 'completed',
    category: 'Public sector',
    description:
      'A booking system for library rooms and equipment, built for accessibility first and for the scheduling rules staff already use.',
    startDate: '2023-02',
    details: {
      overview:
        'The public booking flow meets WCAG 2.2 AA and works with screen readers end to end. Staff rules such as buffer times and priority groups are configured, not coded.',
      scope: ['Public booking flow', 'Staff rules editor', 'Calendar sync'],
      stack: ['TypeScript', 'Next.js', 'PostgreSQL'],
    },
  },
];
