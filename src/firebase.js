// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1Qvpa7h8FAtVQdasd5gqwV5TaAeGUMZk",
  authDomain: "visualmate-f9cbb.firebaseapp.com",
  projectId: "visualmate-f9cbb",
  storageBucket: "visualmate-f9cbb.firebasestorage.app",
  messagingSenderId: "390700130437",
  appId: "1:390700130437:web:7a155d101de9269c0bc9ec",
  measurementId: "G-X313VJ8K2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, firebaseConfig, storage };