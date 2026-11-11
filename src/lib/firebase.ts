import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { FIREBASE_CONFIG } from "@/config/env";

// Reuse the app if it is already initialized (for example after a hot reload).
const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

export default db;
