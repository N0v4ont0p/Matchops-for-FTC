import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZy64l5uAnNhlu0tzhFwlLw43T0yCoEHQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "matchops.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "matchops",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "matchops.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "818730128250",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:818730128250:web:ab59b9bbbd843e7022bcc3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J77DSCREQ3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics is optional in unsupported contexts.
  });
