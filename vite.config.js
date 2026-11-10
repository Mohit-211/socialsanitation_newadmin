import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// Every variable the app needs (see .env.example and src/config/env.js).
const REQUIRED_ENV = [
  "VITE_API_URL",
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

export default defineConfig(({ mode }) => {
  // Reads .env files and the build server's environment.
  const env = loadEnv(mode, projectRoot, "VITE_");
  const missing = REQUIRED_ENV.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}.\n` +
        "Copy .env.example to .env (or set them in your hosting/CI settings) and fill them in.",
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
