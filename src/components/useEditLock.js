// src/useEditLock.js
import { useEffect, useState } from 'react';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';
import { rtdb } from './firebase'; // Adjust path if needed

export function useEditLock(playerId, coachName) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);

  // Reference to this player's lock in Realtime Database
  const lockRef = ref(rtdb, `playerLocks/${playerId}`);

  // Listen for lock changes
  useEffect(() => {
    if (!playerId) return;

    const unsubscribe = onValue(lockRef, (snapshot) => {
      const data = snapshot.val();
      setIsLocked(!!data);
      setLockedBy(data);
    });

    return () => unsubscribe();
  }, [playerId]);

  // Lock the player for editing
  const lockPlayer = () => {
    const lockData = {
      coachName,
      timestamp: Date.now(),
    };

    set(lockRef, lockData);

    // Automatically remove lock if coach disconnects
    onDisconnect(lockRef).remove();

    return true;
  };

  // Unlock the player
  const unlockPlayer = () => {
    remove(lockRef);
  };

  return {
    isLocked,
    lockedBy,
    lockPlayer,
    unlockPlayer,
    isLockedBySelf: isLocked && lockedBy && lockedBy.coachName === coachName,
  };
}
