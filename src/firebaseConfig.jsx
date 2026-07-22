// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrpjWi6rwbL8cp760_U4-g2NEbYKOrP1g",
  authDomain: "nunamoving-mobile-app.firebaseapp.com",
  databaseURL: "https://nunamoving-mobile-app-default-rtdb.firebaseio.com",
  projectId: "nunamoving-mobile-app",
  storageBucket: "nunamoving-mobile-app.appspot.com",
  messagingSenderId: "1062290442356",
  appId: "1:1062290442356:web:7e227d530d365bca172921",
  measurementId: "G-R9M1SYNC4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default firebaseConfig;