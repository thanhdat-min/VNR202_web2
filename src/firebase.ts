import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Firebase credentials - loaded from .env (VITE_ prefix for Vite)
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID
};

let db: any = null;
let isFirebaseEnabled = false;

try {
  // Only initialize if a real API key is provided (not placeholder)
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.projectId
  ) {
    const app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    isFirebaseEnabled = true;
    console.log("🔥 Firebase Firestore connected! Realtime sync is ACTIVE.");
  } else {
    console.log("ℹ️ Firebase not configured. Using offline LocalStorage fallback.");
  }
} catch (error) {
  console.error("❌ Firebase init failed. Falling back to offline mode:", error);
}

export { db, isFirebaseEnabled };
