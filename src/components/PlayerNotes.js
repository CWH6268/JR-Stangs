// src/components/PlayerNotes.js
import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import PlayerEditingStatus from './PlayerEditingStatus';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import './PlayerNotes.css';

function PlayerNotes({ playerId, playerName }) {
  const { user, db } = useFirebase();
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const originalNotes = useRef('');
  const textareaRef = useRef(null);

  // Get the editing status component functions
  const { editingStatus, startEditing, stopEditing, isSomeoneElseEditing } = PlayerEditingStatus({
    playerId,
    onEditingStatusChange: (status) => setEditingInfo(status),
  });

  // Reference to player's document in Firestore
  const playerDocRef = playerId ? doc(db, 'players', playerId) : null;

  // Load player notes from Firestore
  useEffect(() => {
    if (!playerDocRef) return;

    const fetchNotes = async () => {
      try {
        const docSnapshot = await getDoc(playerDocRef);
        if (docSnapshot.exists()) {
          const playerData = docSnapshot.data();
          setNotes(playerData.notes || '');
          originalNotes.current = playerData.notes || '';
        }
      } catch (error) {
        console.error('Error fetching player notes:', error);
      }
    };

    fetchNotes();
  }, [playerId]);

  // Handle start editing
  const handleStartEditing = () => {
    if (startEditing()) {
      setIsEditing(true);
      originalNotes.current = notes;

      // Focus on textarea after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    setNotes(originalNotes.current);
    setIsEditing(false);
    stopEditing();
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!user || !playerDocRef) return;

    setIsSaving(true);

    try {
      // Update the player document with new notes
      await updateDoc(playerDocRef, {
        notes: notes,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: {
          uid: user.uid,
          displayName: user.displayName || user.email || 'A coach',
        },
        // Add to edit history array
        notesHistory: arrayUnion({
          timestamp: new Date(),
          userId: user.uid,
          displayName: user.displayName || user.email || 'A coach',
          previousValue: originalNotes.current,
          newValue: notes,
        }),
      });

      // Update local reference to match saved notes
      originalNotes.current = notes;

      // Stop editing status
      stopEditing();

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="player-notes-container">
      <div className="player-notes-header">
        <h3>{playerName} - Notes</h3>
        {isSomeoneElseEditing && (
          <div className="editing-status">Currently being edited by {editingInfo?.displayName || 'another user'}</div>
        )}
      </div>

      {isEditing ? (
        <div className="notes-editor">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            disabled={isSaving}
            placeholder="Enter player notes here..."
          />
          <div className="notes-actions">
            <button onClick={handleCancelEditing} disabled={isSaving} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleSaveChanges} disabled={isSaving} className="save-button">
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="notes-viewer">
          <div className="notes-content">
            {notes ? <pre>{notes}</pre> : <em>No notes yet. Click 'Edit Notes' to add some.</em>}
          </div>
          <button onClick={handleStartEditing} disabled={isSomeoneElseEditing} className="edit-button">
            Edit Notes
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayerNotes;
