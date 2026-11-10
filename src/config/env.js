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

const withoutTrailingSlash = (url) => url.replace(/\/+$/, "");

/** The backend's address with no path, such as https://api.socialsanitation.com. */
export const API_URL = withoutTrailingSlash(required("VITE_API_URL"));

/** The admin side of the API: every panel call except sign-in. */
export const ADMIN_API_URL = `${API_URL}/api/v2/admin`;

/** Sign-in, one-time codes and password resets. These need no token. */
export const AUTH_API_URL = `${API_URL}/api/v2/auth`;

/** Public lists the panel shares with the website, such as countries, states and cities. */
export const WEB_API_URL = `${API_URL}/api/v2/web`;

/** Uploaded images the API names by file name only (see utils/files.js). */
export const IMAGE_BASE_URL = `${API_URL}/api/v1/images/`;

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
