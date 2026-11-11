import { GOOGLE_MAPS_API_KEY } from "@/config/env";

/** The parts of a Geocoding API answer the panel reads. */
export interface GeocodeResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components: { long_name: string; short_name: string; types: string[] }[];
}

export interface GeocodeAnswer {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

/**
 * Looks up an address with the Google Geocoding API and returns the raw
 * JSON response ({ status, results: [...] }).
 */
export async function geocodeAddress(address: string): Promise<GeocodeAnswer> {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  return response.json();
}
