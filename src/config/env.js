// Build-time configuration.
//
// Vite reads these values from .env files (see .env.example) or from the
// environment of the build server, and inlines them into the bundle. They are
// public settings, not secrets. vite.config.js refuses to start or build when
// a required one is missing, so the checks below only guard unusual setups
// such as tests.

const env = import.meta.env;

function required(name) {
  const value = env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);
const withoutTrailingSlash = (url) => url.replace(/\/+$/, "");

/** Backend REST API, always with a trailing slash (see .env.example). */
export const API_BASE_URL = withTrailingSlash(required("VITE_API_BASE_URL"));

/** Images uploaded through the API. */
export const IMAGE_BASE_URL = `${API_BASE_URL}images/`;

/** Server that hosts restock-request photos (joined with their file_uri). */
export const UPLOADS_BASE_URL = withoutTrailingSlash(
  required("VITE_UPLOADS_BASE_URL"),
);

/** Browser key for Google Maps and Geocoding; restrict it by HTTP referrer. */
export const GOOGLE_MAPS_API_KEY = required("VITE_GOOGLE_MAPS_API_KEY");

/** Firebase web app used for the realtime chats and file storage. */
export const FIREBASE_CONFIG = {
  apiKey: required("VITE_FIREBASE_API_KEY"),
  authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
  databaseURL: required("VITE_FIREBASE_DATABASE_URL"),
  projectId: required("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: required("VITE_FIREBASE_APP_ID"),
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};
