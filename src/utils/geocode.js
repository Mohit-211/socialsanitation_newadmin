import { GOOGLE_MAPS_API_KEY } from "../config/google";

/**
 * Looks up an address with the Google Geocoding API and returns the raw
 * JSON response ({ status, results: [...] }).
 */
export async function geocodeAddress(address) {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  return response.json();
}
