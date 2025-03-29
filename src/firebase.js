import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAcbXAuPnvxDjPoOntYRj_NUdhANoNw8Fo',
  authDomain: 'jr-mustangs.firebaseapp.com',
  projectId: 'jr-mustangs',
  storageBucket: 'jr-mustangs.firebasestorage.app',
  messagingSenderId: '101459255521',
  appId: '1:101459255521:web:ca315844a13e2bdaa757a0',
  measurementId: 'G-WR1NHCM2JF',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
