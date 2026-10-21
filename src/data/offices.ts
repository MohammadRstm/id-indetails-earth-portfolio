/** An ID-Indetails studio, from the website API: a red point on the globe, and an address and map on the contact page. */
export interface Office {
  id: number;
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2, upper case ("LB"). */
  countryCode: string;
  /** Exact position, used for the globe and the map. */
  lat: number;
  lng: number;
  /** May be empty. */
  address: string;
  /** May be empty; in international format when set. */
  phone: string;
}
