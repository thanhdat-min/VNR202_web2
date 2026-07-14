import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Helper to check multiple environment prefixes allowing maximum compatibility with Vercel variables
const getEnv = (keyBase: string) => {
  const env = (import.meta as any).env || {};
  const prefixes = ["VITE_FIREBASE_", "FIREBASE_", "REACT_APP_FIREBASE_", "NEXT_PUBLIC_FIREBASE_", "VITE_", "REACT_APP_", "NEXT_PUBLIC_"];
  for (const prefix of prefixes) {
    const val = env[`${prefix}${keyBase}`] || env[`${prefix}${keyBase.replace(/^FIREBASE_/, '')}`];
    if (val && typeof val === "string" && val !== "YOUR_API_KEY_HERE" && val !== "undefined" && val !== "null") {
      return val.trim();
    }
  }
  return undefined;
};

// Check runtime configuration saved in localStorage (from UI setup modal)
const getCustomStoredConfig = () => {
  try {
    const saved = localStorage.getItem("vnr201_custom_firebase_config");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return null;
};

const storedConfig = getCustomStoredConfig();

// Firebase credentials loaded with multi-prefix fallback or localStorage runtime config
const firebaseConfig = storedConfig && storedConfig.apiKey && storedConfig.projectId ? storedConfig : {
  apiKey: getEnv("FIREBASE_API_KEY") || getEnv("API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || getEnv("AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID") || getEnv("PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || getEnv("STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || getEnv("MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID") || getEnv("APP_ID"),
  measurementId: getEnv("FIREBASE_MEASUREMENT_ID") || getEnv("MEASUREMENT_ID")
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
    if (!firebaseConfig.apiKey) {
      console.warn("⚠️ [Kiểm tra Firebase]: Thiếu API Key. Vui lòng vào Vercel Dashboard -> Project Settings -> Environment Variables, thêm biến 'VITE_FIREBASE_API_KEY' và nhấn Redeploy!");
    } else if (!firebaseConfig.projectId) {
      console.warn("⚠️ [Kiểm tra Firebase]: Thiếu Project ID. Vui lòng kiểm tra biến 'VITE_FIREBASE_PROJECT_ID' trên Vercel!");
    }
  }
} catch (error) {
  console.error("❌ Firebase init failed. Falling back to offline mode:", error);
}

export const saveCustomFirebaseConfig = (config: any) => {
  if (!config || !config.apiKey || !config.projectId) {
    localStorage.removeItem("vnr201_custom_firebase_config");
  } else {
    localStorage.setItem("vnr201_custom_firebase_config", JSON.stringify(config));
  }
  window.location.reload();
};

export const clearCustomFirebaseConfig = () => {
  localStorage.removeItem("vnr201_custom_firebase_config");
  window.location.reload();
};

export { db, isFirebaseEnabled, firebaseConfig };
