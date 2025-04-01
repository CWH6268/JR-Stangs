// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAcbXAuPnvxDjPoOntYRj_NUdhANoNw8Fo',
  authDomain: 'jr-mustangs.firebaseapp.com',
  projectId: 'jr-mustangs',
  storageBucket: 'jr-mustangs.firebasestorage.app',
  messagingSenderId: '101459255521',
  appId: '1:101459255521:web:ca315844a13e2bdaa757a0',
  measurementId: 'G-WR1NHCM2JF',
  databaseURL: 'https://jr-mustangs-default-rtdb.firebaseio.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Persistence is not available in this browser');
  }
});

export { db, storage, rtdb, auth };
