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

// Initialize core services
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Initialize analytics only if not in a test environment
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn('Analytics initialization failed:', e);
}

// Try to enable persistence, but don't crash the app if it fails
try {
  // Enable offline persistence for Firestore with better error handling
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence is not available in this browser');
    } else {
      console.warn('Persistence error:', err);
    }
  });
} catch (error) {
  console.warn('Error setting up persistence:', error);
}

export { db, storage, rtdb, auth };
