import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import PlayerImage from './PlayerImage';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase';

const NotesEditor = ({ player, show, handleClose, handleSave }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [lockError, setLockError] = useState(null);

  // Use a ref to track if we own the lock
  const hasActiveLock = useRef(false);

  // Generate a unique coach name if not already set
  const coachName = localStorage.getItem('coachName') || `Coach`;

  // Store coach name for future use
  useEffect(() => {
    if (!localStorage.getItem('coachName')) {
      localStorage.setItem('coachName', coachName);
    }
  }, [coachName]);

  // Initialize notes when player changes
  useEffect(() => {
    if (player) {
      setNotes(player.Notes || '');
    }
  }, [player]);

  // Set up lock for this player when modal is shown
  useEffect(() => {
    if (!show || !player) {
      hasActiveLock.current = false;
      return;
    }

    console.log('Attempting to lock player:', player.id, 'as coach:', coachName);

    // Reference to this player's lock in Realtime Database
    const lockRef = ref(rtdb, `playerLocks/${player.id}`);

    // Create a lock when the modal opens
    const createLock = async () => {
      try {
        // Check if someone else has a lock
        const snapshot = await new Promise((resolve) => {
          onValue(lockRef, resolve, { onlyOnce: true });
        });

        const existingLock = snapshot.val();

        if (existingLock && existingLock.coachName !== coachName) {
          // Someone else has a lock - set error and close the modal
          console.log('Player already locked by another coach');
          setLockError(`This player is currently being edited`);
          hasActiveLock.current = false;

          // Close modal after showing error briefly
          setTimeout(() => handleClose(), 2000);
          return;
        }

        // Create our lock
        console.log('Creating lock as:', coachName);
        await set(lockRef, {
          coachName,
          timestamp: Date.now(),
        });

        // Set up automatic cleanup if coach disconnects
        onDisconnect(lockRef).remove();

        setLockStatus({ coachName, timestamp: Date.now() });
        hasActiveLock.current = true;
        setLockError(null);
      } catch (error) {
        console.error('Error creating lock:', error);
        setLockError('Failed to lock player for editing');
        hasActiveLock.current = false;
        setTimeout(() => handleClose(), 2000);
      }
    };

    createLock();

    // Listen for lock changes
    const unsubscribe = onValue(lockRef, (snapshot) => {
      const data = snapshot.val();

      // Important: Only react to lock changes if we don't own the lock
      // or if the lock is gone when we previously had it
      if (hasActiveLock.current) {
        // We had a lock - check if it's been removed by someone else
        if (!data) {
          console.log('Our lock was removed by someone else');
          hasActiveLock.current = false;
          setLockError('Your editing session was interrupted');
          setTimeout(() => handleClose(), 2000);
        } else if (data.coachName !== coachName) {
          // Someone else took our lock (very rare case)
          console.log('Our lock was taken by someone else');
          hasActiveLock.current = false;
          setLockError(`This player is now being edited by another coach`);
          setTimeout(() => handleClose(), 2000);
        }
      }
    });

    // Clear lock when component unmounts or modal closes
    return () => {
      unsubscribe();
      console.log('Cleaning up lock on unmount/close');

      // Only remove the lock if we own it
      if (player && hasActiveLock.current) {
        console.log('Removing our lock during cleanup');
        remove(lockRef).catch((err) => console.error('Error releasing lock:', err));
        hasActiveLock.current = false;
      }
    };
  }, [show, player, coachName, handleClose]);

  // Handle notes change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    // Reset save success when notes are changed
    setSaveSuccess(false);
  };

  // Save notes and close modal
  const saveNotes = async () => {
    if (!hasActiveLock.current) {
      setLockError('You no longer have edit permissions for this player');
      setTimeout(() => handleClose(), 2000);
      return;
    }

    setSaving(true);
    try {
      await handleSave(notes);
      setSaveSuccess(true);

      // Don't close the modal yet, show success message
      setTimeout(() => {
        // Release the lock
        if (player && hasActiveLock.current) {
          const lockRef = ref(rtdb, `playerLocks/${player.id}`);
          remove(lockRef).catch((err) => console.error('Error releasing lock after save:', err));
          hasActiveLock.current = false;
        }

        handleClose();
        setSaving(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaving(false);
    }
  };

  // Handle cancel - release lock and close
  const handleCancelWithUnlock = () => {
    if (player && hasActiveLock.current) {
      const lockRef = ref(rtdb, `playerLocks/${player.id}`);
      remove(lockRef).catch((err) => console.error('Error releasing lock on cancel:', err));
      hasActiveLock.current = false;
    }
    handleClose();
  };

  // Quick note buttons
  const quickNotes = [
    'Good speed',
    'Strong tackler',
    'Great hands',
    'Good football IQ',
    'Strong blocker',
    'Good field vision',
    'Needs work on footwork',
    'Coachable attitude',
    'Good arm strength',
    'Quick release',
  ];

  // Add quick note to text
  const addQuickNote = (note) => {
    setNotes(notes ? `${notes} ${note}.` : `${note}.`);
    // Reset save success when notes are changed
    setSaveSuccess(false);
  };

  return (
    <Modal show={show} onHide={handleCancelWithUnlock} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Notes for {player?.FirstName} {player?.LastName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {lockError && (
          <Alert variant="danger" className="mb-3">
            {lockError}
          </Alert>
        )}

        {saveSuccess && (
          <Alert variant="success" className="mb-3">
            Notes saved successfully!
          </Alert>
        )}

        <Row>
          <Col md={4}>
            {/* Player Image Upload */}
            <PlayerImage playerId={player?.id} playerName={`${player?.FirstName} ${player?.LastName}`} />
          </Col>
          <Col md={8}>
            <Form>
              <Form.Group>
                <Form.Label>Player Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Enter detailed notes about the player's performance, skills, attitude, etc."
                  className="mb-3"
                  disabled={!!lockError}
                />
              </Form.Group>
              {/* Quick note templates */}
              <div className="quick-notes-section">
                <p className="fw-bold mb-2">Quick Notes:</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {quickNotes.map((note, index) => (
                    <Button
                      key={index}
                      className="filter-btn"
                      size="sm"
                      onClick={() => addQuickNote(note)}
                      disabled={!!lockError}
                    >
                      {note}
                    </Button>
                  ))}
                </div>
              </div>
            </Form>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancelWithUnlock} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveNotes} disabled={saving || !!lockError}>
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesEditor;
