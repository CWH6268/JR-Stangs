import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import NotesEditor from './NotesEditor';
import { ref, onValue, remove } from 'firebase/database';
import { rtdb } from '../firebase';

const PlayerTable = ({ players, updatePlayerData }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [activeLocks, setActiveLocks] = useState({});

  // Set up listener for active locks
  useEffect(() => {
    const locksRef = ref(rtdb, 'playerLocks');

    // Clean up any localStorage locks when component mounts
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('lock_')) {
        localStorage.removeItem(key);
      }
    });

    // Clean up potentially stale locks in Firebase
    const cleanupStaleLocks = async () => {
      try {
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        // Get all locks
        const snapshot = await new Promise((resolve) => {
          onValue(locksRef, resolve, { onlyOnce: true });
        });

        if (snapshot.exists()) {
          const locks = snapshot.val();

          // Check each lock for staleness
          Object.entries(locks).forEach(([playerId, lockData]) => {
            if (lockData && lockData.timestamp) {
              const lockAge = now - lockData.timestamp;

              // If lock is older than 5 minutes, remove it
              if (lockAge > FIVE_MINUTES) {
                const staleLockRef = ref(rtdb, `playerLocks/${playerId}`);
                remove(staleLockRef).catch((err) => {
                  console.error('Error removing stale lock:', err);
                });
              }
            }
          });
        }
      } catch (err) {
        console.error('Error cleaning up stale locks:', err);
      }
    };

    // Run cleanup on mount
    cleanupStaleLocks();

    const unsubscribe = onValue(locksRef, (snapshot) => {
      const locks = snapshot.val() || {};
      setActiveLocks(locks);
    });

    return () => {
      unsubscribe();

      // Clean up any localStorage locks on unmount
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('lock_')) {
          localStorage.removeItem(key);
        }
      });
    };
  }, []);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Invalid Date') return 'N/A';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  // Open notes editor
  const openNotesEditor = (player) => {
    // Check if this browser instance has any locks
    const hasLocalLock = Object.keys(localStorage).some((key) => key.startsWith('lock_'));

    // If we have a lock, clear it first
    if (hasLocalLock) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('lock_')) {
          localStorage.removeItem(key);
        }
      });
    }

    setSelectedPlayer(player);
    setShowNotesEditor(true);
  };

  // Save notes
  const saveNotes = (notes) => {
    if (selectedPlayer) {
      updatePlayerData(selectedPlayer.id, 'Notes', notes);
      setShowNotesEditor(false);
      setSelectedPlayer(null);

      // Ensure any locks are removed
      if (selectedPlayer.id) {
        const lockRef = ref(rtdb, `playerLocks/${selectedPlayer.id}`);
        remove(lockRef).catch((err) => {
          console.error('Error removing lock after save in PlayerTable:', err);
        });
      }
    }
  };

  // Handle close with cleanup
  const handleCloseWithCleanup = () => {
    // Ensure any locks are removed
    if (selectedPlayer && selectedPlayer.id) {
      const lockRef = ref(rtdb, `playerLocks/${selectedPlayer.id}`);
      remove(lockRef).catch((err) => {
        console.error('Error removing lock on close in PlayerTable:', err);
      });
    }

    // Clean up any localStorage locks
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('lock_')) {
        localStorage.removeItem(key);
      }
    });

    setShowNotesEditor(false);
    setSelectedPlayer(null);
  };

  // Truncate notes for display
  const truncateNotes = (notes, maxLength = 30) => {
    if (!notes) return '';

    if (notes.length <= maxLength) return notes;

    return notes.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="table-container">
        <div className="table-responsive">
          <Table striped hover>
            <thead>
              <tr className="text-center">
                <th className="text-center">Jersey #</th>
                <th className="text-center">First Name</th>
                <th className="text-center">Last Name</th>
                <th className="text-center">DOB</th>
                <th className="text-center">School</th>
                <th className="text-center">Position</th>
                <th className="text-center">Notes</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id}>
                    <td className="text-center">{player.Jersey || ''}</td>
                    <td className="text-center">{player.FirstName}</td>
                    <td className="text-center">{player.LastName}</td>
                    <td className="text-center">{formatDate(player.DOB)}</td>
                    <td className="text-center">{player.School}</td>
                    <td className="text-center">{player.Position}</td>
                    <td className="text-center">
                      {player.Notes ? (
                        <div className="notes-preview">{truncateNotes(player.Notes)}</div>
                      ) : (
                        <span className="no-notes">No notes</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Button className="btn-edit" size="sm" onClick={() => openNotesEditor(player)}>
                        Edit Notes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Notes Editor Modal */}
      {showNotesEditor && selectedPlayer && (
        <NotesEditor
          player={selectedPlayer}
          show={showNotesEditor}
          handleClose={handleCloseWithCleanup}
          handleSave={saveNotes}
        />
      )}
    </>
  );
};

export default PlayerTable;
