import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "inverapuestas-pro",
  "appId": "1:647499500263:web:16796018ca17c3b769f042",
  "storageBucket": "inverapuestas-pro.firebasestorage.app",
  "apiKey": "AIzaSyBOPG2W_DkzjwvZ-TtYZnQ3kFs75kRP_L8",
  "authDomain": "inverapuestas-pro.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "647499500263"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
