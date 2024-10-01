
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaTwB-guK8IwQ1rMmX7Zlm6fLRO_VmC6U",
  authDomain: "docs-d899c.firebaseapp.com",
  projectId: "docs-d899c",
  storageBucket: "docs-d899c.appspot.com",
  messagingSenderId: "188756556551",
  appId: "1:188756556551:web:aac18436f15672dba1e3a2",
  measurementId: "G-7D2BDTX7LP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();