
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyA1Qvpa7h8FAtVQdasd5gqwV5TaAeGUMZk",
  authDomain: "visualmate-f9cbb.firebaseapp.com",
  projectId: "visualmate-f9cbb",
  storageBucket: "visualmate-f9cbb.firebasestorage.app",
  messagingSenderId: "390700130437",
  appId: "1:390700130437:web:7a155d101de9269c0bc9ec",
  measurementId: "G-X313VJ8K2V"
};

// initialize only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);        // canonical auth instance
export const db = getFirestore(app);     // canonical firestore
export default app;
