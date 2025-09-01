/**
 * Firebase Web SDK (v12) — Auth + Firestore init
 * Keep this file as a browser ES module.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

//  Use your exact config from Firebase Console → Project settings → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyDFeblZ1C-c1LvnbT9zh-bbdTqcwEu6TL8",
  authDomain: "shortkatto.firebaseapp.com",
  projectId: "shortkatto",
  storageBucket: "shortkatto.firebasestorage.app",
  messagingSenderId: "120302865552",
  appId: "1:120302865552:web:22168c78e40192428a9c15",
  measurementId: "G-97735B8EGT"
};

// --- Initialize ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persist sessions in the browser (survives tab refresh)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Providers & DB
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// --- Re-exports for convenience (used by dashboard.js) ---
export {
  // Auth flows
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  // Firestore helpers (future use)
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
};
