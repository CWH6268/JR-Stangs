// src/components/PlayerCard.js
import React, { useState } from 'react';
import JerseyNumberEditor from './JerseyNumberEditor';
import PlayerNotes from './PlayerNotes';
import './PlayerCard.css';

function PlayerCard({ player, playerId }) {
  const [showNotes, setShowNotes] = useState(false);

  // Toggle notes visibility
  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };

  return (
    <div className="player-card">
      <div className="player-card-header">
        <JerseyNumberEditor playerId={playerId} currentNumber={player['Jersey #']} />
        <div className="player-info">
          <h3 className="player-name">
            {player['First Name']} {player['Last Name']}
          </h3>
          <div className="player-position">{player['Position']}</div>
        </div>
      </div>

      <div className="player-details">
        <div className="player-detail">
          <span className="detail-label">DOB:</span>
          <span className="detail-value">{player['Date of Birth']}</span>
        </div>
        <div className="player-detail">
          <span className="detail-label">School:</span>
          <span className="detail-value">{player['School']}</span>
        </div>
        <div className="player-detail">
          <span className="detail-label">Division:</span>
          <span className="detail-value">{player['Division']}</span>
        </div>
      </div>

      <div className="player-actions">
        <button className="notes-toggle-button" onClick={toggleNotes}>
          {showNotes ? 'Hide Notes' : 'Show Notes'}
        </button>
      </div>

      {showNotes && <PlayerNotes playerId={playerId} playerName={`${player['First Name']} ${player['Last Name']}`} />}
    </div>
  );
}

export default PlayerCard;
