import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAI, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyD__ezV-bjNFgeRpULlsM7mG1llffJqsXM",
  authDomain: "exam-portal-web.firebaseapp.com",
  projectId: "exam-portal-web",
  storageBucket: "exam-portal-web.firebasestorage.app",
  messagingSenderId: "534604879965",
  appId: "1:534604879965:web:2a12bd4c8160d9d1ab95b4",
  measurementId: "G-BSYRJDCRZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);


// Initialize AI Logic (Gemini API)
export const ai = getAI(app, { backend: new GoogleAIBackend() });
