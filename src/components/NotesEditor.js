import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import PlayerImage from './PlayerImage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ref, remove } from 'firebase/database';
import { rtdb } from '../firebase';

const NotesEditor = ({ player, show, handleClose, handleSave }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState(null);
  const [originalNotesData, setOriginalNotesData] = useState({});
  const [allCoachNotes, setAllCoachNotes] = useState({});

  // Get the coach name
  const coachName = localStorage.getItem('coachName');

  // If there's no coach name, force a page reload to trigger the prompt
  useEffect(() => {
    if (!coachName && show) {
      console.log('No coach name found, reloading page to trigger prompt');
      localStorage.removeItem('coachName'); // Clear it just to be safe
      window.location.reload();
    }
  }, [coachName, show]);

  // Clean up any localStorage locks when component mounts
  useEffect(() => {
    // Remove any stale lock indicators from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('lock_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Clean up locks when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (player) {
        // Try to clean up any locks in Firebase
        const lockRef = ref(rtdb, `playerLocks/${player.id}`);
        remove(lockRef).catch((err) => {
          console.error('Error removing lock on unmount:', err);
        });

        // Clear any localStorage indicators
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('lock_')) {
            localStorage.removeItem(key);
          }
        });
      }
    };
  }, [player]);

  // Helper to parse existing notes by coach
  const parseNotesByCoach = (notesString) => {
    // Default empty structure
    const coachNotes = {};

    if (!notesString) return coachNotes;

    try {
      // Try to parse as JSON first in case it's already in our format
      const notesObj = JSON.parse(notesString);
      if (typeof notesObj === 'object' && notesObj !== null) {
        return notesObj;
      }
    } catch (e) {
      // Not JSON, continue with parsing old text format
    }

    // Old format - try to parse it
    // This is a simple heuristic, might need adjustment based on actual data
    const lines = notesString.split('\n');
    let currentCoach = 'Unknown Coach';
    let currentNotes = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check if this line has a coach name (e.g., "Coach A:")
      const coachMatch = trimmedLine.match(/^([^:]+):/);

      if (coachMatch) {
        // New coach section - save previous coach's notes if any
        if (currentNotes.length > 0) {
          coachNotes[currentCoach] = (coachNotes[currentCoach] || '') + currentNotes.join(' ').trim();
        }

        // Start new coach section
        currentCoach = coachMatch[1].trim();
        currentNotes = [trimmedLine.replace(coachMatch[0], '').trim()];
      } else if (trimmedLine !== '') {
        // Continue with current coach's notes
        currentNotes.push(trimmedLine);
      }
    });

    // Add the last coach's notes
    if (currentNotes.length > 0) {
      coachNotes[currentCoach] = (coachNotes[currentCoach] || '') + currentNotes.join(' ').trim();
    }

    return coachNotes;
  };

  // Helper to convert notes by coach to string format
  const formatNotesForDisplay = (notesByCoach) => {
    let formattedNotes = '';

    Object.entries(notesByCoach).forEach(([coach, notes]) => {
      if (notes.trim()) {
        formattedNotes += `${coach}: ${notes.trim()}\n\n`;
      }
    });

    return formattedNotes.trim();
  };

  // Fetch the latest notes when the modal opens
  useEffect(() => {
    if (show && player && coachName) {
      // Fetch the latest notes directly from Firebase to ensure we have current data
      const fetchLatestNotes = async () => {
        try {
          // Get the latest notes
          const notesRef = doc(db, 'playerNotes', player.id);
          const notesSnapshot = await getDoc(notesRef);

          let notesByCoach = {};

          if (notesSnapshot.exists()) {
            const data = notesSnapshot.data();

            // Try to parse notes into coach structure
            if (data.notesByCoach) {
              // Already in our new format
              notesByCoach = data.notesByCoach;
            } else if (data.notes) {
              // Old format - parse it
              notesByCoach = parseNotesByCoach(data.notes);
            }

            // Get this coach's notes
            setNotes(notesByCoach[coachName] || '');

            // Save all coach notes
            setAllCoachNotes(notesByCoach);

            // Save original data for conflict detection
            setOriginalNotesData({
              notesByCoach,
              lastUpdated: data.timestamp || new Date().toISOString(),
            });

            if (data.timestamp && data.lastUpdatedBy) {
              setLastUpdateInfo({
                coach: data.lastUpdatedBy,
                time: new Date(data.timestamp).toLocaleString(),
              });
            }
          } else {
            // No notes yet
            setNotes('');
            setAllCoachNotes({});
            setOriginalNotesData({
              notesByCoach: {},
              lastUpdated: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching latest notes:', error);
          // Fallback
          setNotes('');
          setAllCoachNotes({});
          setOriginalNotesData({
            notesByCoach: {},
            lastUpdated: new Date().toISOString(),
          });
        }
      };

      fetchLatestNotes();
    }
  }, [show, player, coachName]);

  // Handle notes change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    // Reset save success when notes are changed
    setSaveSuccess(false);
  };

  // Save notes
  const saveNotes = async () => {
    if (!coachName) {
      alert('Please reload the page and enter your name before saving notes.');
      return;
    }

    setSaving(true);

    try {
      // Check if someone else modified the notes while we were editing
      const notesRef = doc(db, 'playerNotes', player.id);
      const latestSnapshot = await getDoc(notesRef);

      let updatedCoachNotes = { ...allCoachNotes };

      // If this coach's notes have content, add them
      if (notes.trim()) {
        updatedCoachNotes[coachName] = notes.trim();
      } else {
        // Remove this coach's entry if empty
        delete updatedCoachNotes[coachName];
      }

      // Check for conflicts
      if (latestSnapshot.exists()) {
        const latestData = latestSnapshot.data();

        // Check if someone else updated the notes
        if (latestData.timestamp && latestData.timestamp !== originalNotesData.lastUpdated) {
          // Get the latest notes by coach
          let latestNotesByCoach = {};

          if (latestData.notesByCoach) {
            latestNotesByCoach = latestData.notesByCoach;
          } else if (latestData.notes) {
            latestNotesByCoach = parseNotesByCoach(latestData.notes);
          }

          // Merge the updates from other coaches
          Object.entries(latestNotesByCoach).forEach(([coach, coachNotes]) => {
            // Don't overwrite this coach's notes
            if (coach !== coachName) {
              updatedCoachNotes[coach] = coachNotes;
            }
          });

          // Alert that we're merging notes
          alert(
            'Another coach updated these notes while you were editing. Your changes will be saved along with theirs.'
          );
        }
      }

      // Generate a formatted version for old clients
      const formattedNotes = formatNotesForDisplay(updatedCoachNotes);

      // Save the structured notes AND a formatted version for backward compatibility
      await handleSave(formattedNotes, updatedCoachNotes);

      setSaveSuccess(true);

      // Ensure any locks are cleared from Firebase
      if (player) {
        const lockRef = ref(rtdb, `playerLocks/${player.id}`);
        remove(lockRef).catch((err) => {
          console.error('Error removing lock after save:', err);
        });
      }

      // Clear any localStorage locks
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('lock_')) {
          localStorage.removeItem(key);
        }
      });

      // Show success message briefly before closing
      setTimeout(() => {
        handleClose();
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaving(false);
      alert('Failed to save notes. Please try again.');

      // Still try to clean up locks even if save fails
      if (player) {
        const lockRef = ref(rtdb, `playerLocks/${player.id}`);
        remove(lockRef).catch((err) => {
          console.error('Error removing lock after failed save:', err);
        });
      }

      // Clear any localStorage locks
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('lock_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Handle modal close with explicit lock cleanup
  const handleCancelWithCleanup = () => {
    // Clean up any locks in Firebase
    if (player) {
      const lockRef = ref(rtdb, `playerLocks/${player.id}`);
      remove(lockRef).catch((err) => {
        console.error('Error removing lock on cancel:', err);
      });
    }

    // Clear any localStorage locks
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('lock_')) {
        localStorage.removeItem(key);
      }
    });

    // Close the modal
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

  // Format all coaches' notes for preview
  const getAllCoachesNotesPreview = () => {
    const otherCoaches = Object.entries(allCoachNotes).filter(([coach]) => coach !== coachName);

    if (otherCoaches.length === 0) return null;

    return (
      <div className="other-coaches-notes mb-3">
        <h6>Notes from other coaches:</h6>
        {otherCoaches.map(([coach, coachNotes]) => (
          <div key={coach} className="coach-note-entry">
            <strong>{coach}:</strong> {coachNotes}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={handleCancelWithCleanup} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Notes for {player?.FirstName} {player?.LastName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {saveSuccess && (
          <Alert variant="success" className="mb-3">
            Notes saved successfully!
          </Alert>
        )}

        {lastUpdateInfo && (
          <Alert variant="info" className="mb-3">
            Last updated by {lastUpdateInfo.coach} at {lastUpdateInfo.time}
          </Alert>
        )}

        <Row>
          <Col md={4}>
            {/* Player Image Upload */}
            <PlayerImage playerId={player?.id} playerName={`${player?.FirstName} ${player?.LastName}`} />
          </Col>
          <Col md={8}>
            {getAllCoachesNotesPreview()}

            <Form>
              <Form.Group>
                <Form.Label>Your Notes {coachName ? `(${coachName})` : ''}:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Enter your notes about the player's performance, skills, attitude, etc."
                  className="mb-3"
                  disabled={saving || !coachName}
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
                      disabled={saving || !coachName}
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
        <Button variant="secondary" onClick={handleCancelWithCleanup} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveNotes} disabled={saving || !coachName}>
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesEditor;
