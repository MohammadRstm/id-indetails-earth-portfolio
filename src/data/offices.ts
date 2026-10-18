/** ID-Indetails studios: red points on the globe, and the addresses and maps on the contact page. */
export interface Office {
  id: string;
  city: string;
  country: string;
  /** Exact position, used for the globe and the map. */
  lat: number;
  lng: number;
  /** PLACEHOLDER: replace with the real street address. */
  address: string;
  /** PLACEHOLDER: replace with the real number, in international format. */
  phone: string;
}

export const offices: Office[] = [
  {
    id: 'beirut',
    city: 'Beirut',
    country: 'Lebanon',
    lat: 33.8938,
    lng: 35.5018,
    address: 'Street and building to be confirmed, Beirut, Lebanon',
    phone: '+961 1 000 000',
  },
  {
    id: 'abidjan',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    lat: 5.36,
    lng: -4.0083,
    address: 'Street and building to be confirmed, Abidjan, Côte d’Ivoire',
    phone: '+225 27 00 00 00 00',
  },
];
