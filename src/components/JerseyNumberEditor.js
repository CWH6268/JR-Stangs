// src/components/JerseyNumberEditor.js
import React, { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import './JerseyNumberEditor.css';

function JerseyNumberEditor({ playerId, currentNumber }) {
  const { user, db } = useFirebase();
  const [jerseyNumber, setJerseyNumber] = useState(currentNumber || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle entering edit mode
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setJerseyNumber(currentNumber || '');
    setIsEditing(false);
  };

  // Handle jersey number change
  const handleJerseyChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setJerseyNumber(value);
  };

  // Save jersey number to Firestore
  const handleSaveJersey = async () => {
    if (!user || !playerId) return;

    setIsSaving(true);

    try {
      const playerRef = doc(db, 'players', playerId);

      await updateDoc(playerRef, {
        'Jersey #': jerseyNumber,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: {
          uid: user.uid,
          displayName: user.displayName || user.email || 'A coach',
        },
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating jersey number:', error);
      alert('Failed to save jersey number. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="jersey-editor">
      {isEditing ? (
        <div className="jersey-edit-mode">
          <input
            type="text"
            value={jerseyNumber}
            onChange={handleJerseyChange}
            maxLength={3}
            disabled={isSaving}
            autoFocus
          />
          <div className="jersey-buttons">
            <button onClick={handleCancelEdit} disabled={isSaving} className="jersey-cancel-btn">
              Cancel
            </button>
            <button onClick={handleSaveJersey} disabled={isSaving} className="jersey-save-btn">
              {isSaving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="jersey-display" onClick={handleStartEditing} title="Click to edit jersey number">
          <span className="jersey-number">{jerseyNumber || '#'}</span>
          <span className="jersey-edit-icon">✏️</span>
        </div>
      )}
    </div>
  );
}

export default JerseyNumberEditor;
