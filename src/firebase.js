import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database'; // Add this import

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAcbXAuPnvxDjPoOntYRj_NUdhANoNw8Fo',
  authDomain: 'jr-mustangs.firebaseapp.com',
  projectId: 'jr-mustangs',
  storageBucket: 'jr-mustangs.firebasestorage.app',
  messagingSenderId: '101459255521',
  appId: '1:101459255521:web:ca315844a13e2bdaa757a0',
  measurementId: 'G-WR1NHCM2JF',
  databaseURL: 'https://jr-mustangs-default-rtdb.firebaseio.com', // Add this line
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app); // Add this line

export { db, storage, rtdb }; // Add rtdb to exports
