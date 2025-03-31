// src/components/PlayerEditingStatus.js
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { ref, onValue, set, onDisconnect } from 'firebase/database';

function PlayerEditingStatus({ playerId, onEditingStatusChange }) {
  const { user, rtdb } = useFirebase();
  const [editingStatus, setEditingStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reference to the player's editing status in Realtime Database
  const editingStatusRef = ref(rtdb, `playerEditing/${playerId}`);

  // Listen for changes to editing status
  useEffect(() => {
    if (!playerId) return;

    const unsubscribe = onValue(editingStatusRef, (snapshot) => {
      const data = snapshot.val();
      setEditingStatus(data);

      // Notify parent component of editing status changes
      if (onEditingStatusChange) {
        onEditingStatusChange(data);
      }
    });

    return () => unsubscribe();
  }, [playerId, onEditingStatusChange]);

  // Start editing
  const startEditing = () => {
    if (!user) return;

    // Check if someone else is already editing
    if (editingStatus && editingStatus.userId !== user.uid) {
      const editingTimeMs = Date.now() - editingStatus.startedAt;
      const editingTimeMinutes = Math.floor(editingTimeMs / 60000);

      // If someone has been editing for more than 5 minutes, allow overriding
      if (editingTimeMinutes < 5) {
        if (
          !window.confirm(
            `${editingStatus.displayName || 'Another user'} is currently editing this player. Do you want to take over?`
          )
        ) {
          return;
        }
      }
    }

    // Set editing status in Realtime Database
    const newStatus = {
      userId: user.uid,
      displayName: user.displayName || user.email || 'A coach',
      startedAt: Date.now(),
    };

    set(editingStatusRef, newStatus);

    // Set up automatic cleanup when user disconnects
    onDisconnect(editingStatusRef).remove();

    setIsEditing(true);

    return true; // Return success
  };

  // Stop editing
  const stopEditing = () => {
    if (isEditing && user) {
      // Only allow the current editor to stop editing
      if (editingStatus && editingStatus.userId === user.uid) {
        set(editingStatusRef, null);
        setIsEditing(false);
        return true;
      }
    }
    return false;
  };

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEditing && user) {
        stopEditing();
      }
    };
  }, [isEditing, user]);

  return {
    isEditing,
    editingStatus,
    startEditing,
    stopEditing,
    isSomeoneElseEditing: editingStatus && user && editingStatus.userId !== user.uid,
  };
}

export default PlayerEditingStatus;
