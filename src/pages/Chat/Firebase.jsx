import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
	apiKey: "AIzaSyAbkvs2nkoRimkoIHuH7gkl6MdQu0H20KY",
	authDomain: "social-sanitation.firebaseapp.com",
	databaseURL: "https://social-sanitation-default-rtdb.firebaseio.com",
	projectId: "social-sanitation",
	storageBucket: "social-sanitation.firebasestorage.app",
	messagingSenderId: "458756624470",
	appId: "1:458756624470:web:5bf02a4c7484e61064abf7",
	measurementId: "G-ZLYQSV2Z0D",
};

// ✅ Prevent duplicate initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;