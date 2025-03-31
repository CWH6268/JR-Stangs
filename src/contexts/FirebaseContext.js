// src/contexts/FirebaseContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, storage, rtdb, auth } from '../firebase';

// Create context
const FirebaseContext = createContext(null);

// Hook to use the Firebase context
export const useFirebase = () => {
  return useContext(FirebaseContext);
};

// Provider component that makes Firebase available to child components
export function FirebaseProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Context value
  const value = {
    db,
    storage,
    rtdb,
    auth,
    user,
  };

  return <FirebaseContext.Provider value={value}>{!loading && children}</FirebaseContext.Provider>;
}
