import React, { useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import NotesEditor from './NotesEditor';

const PlayerTable = ({ players, updatePlayerData }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNotesEditor, setShowNotesEditor] = useState(false);

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
    setSelectedPlayer(player);
    setShowNotesEditor(true);
  };

  // Save notes
  const saveNotes = (notes) => {
    if (selectedPlayer) {
      updatePlayerData(selectedPlayer.id, 'Notes', notes);
      setShowNotesEditor(false);
      setSelectedPlayer(null);
    }
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
                        <div className="notes-preview">
                          {player.Notes.substring(0, 30)}
                          {player.Notes.length > 30 ? '...' : ''}
                        </div>
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
          handleClose={() => setShowNotesEditor(false)}
          handleSave={saveNotes}
        />
      )}
    </>
  );
};

export default PlayerTable;
