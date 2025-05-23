import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZlOvGVbB5Qlz9NPVVTgdeLvTOzIfFDWY",
  authDomain: "garbage-c2a4f.firebaseapp.com",
  projectId: "garbage-c2a4f",
  storageBucket: "garbage-c2a4f.firebasestorage.app",
  messagingSenderId: "641797346740",
  appId: "1:641797346740:web:70631e59a466dc0902cee1",
  measurementId: "G-EDEFCN69DT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth }; 