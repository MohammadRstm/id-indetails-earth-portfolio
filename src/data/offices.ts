/** ID-Indetails studios, shown on the globe as fixed red points with the company's name. */
export interface Office {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export const offices: Office[] = [
  { id: 'beirut', city: 'Beirut', country: 'Lebanon', lat: 33.8938, lng: 35.5018 },
  { id: 'abidjan', city: 'Abidjan', country: "Côte d'Ivoire", lat: 5.36, lng: -4.0083 },
];
