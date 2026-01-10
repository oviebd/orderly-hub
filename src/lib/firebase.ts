import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config from Firebase Console
// Go to: Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyAPlQVWw0nsBdXGW2DFgzWtd1x2W8ZCRx8",
  authDomain: "waautoreply-b2f1d.firebaseapp.com",
  projectId: "waautoreply-b2f1d",
  storageBucket: "waautoreply-b2f1d.firebasestorage.app",
  messagingSenderId: "161568446086",
  appId: "1:161568446086:web:5466e1a90ef7da31f16307",
  measurementId: "G-M823LTTCRE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
