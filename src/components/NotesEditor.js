import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import PlayerImage from './PlayerImage';

const NotesEditor = ({ player, show, handleClose, handleSave }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize notes when player changes
  useEffect(() => {
    if (player) {
      setNotes(player.Notes || '');
    }
  }, [player]);

  // Handle notes change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    // Reset save success when notes are changed
    setSaveSuccess(false);
  };

  // Save notes and close modal
  const saveNotes = async () => {
    setSaving(true);
    try {
      await handleSave(notes);
      setSaveSuccess(true);
      // Don't close the modal yet, show success message
      setTimeout(() => {
        handleClose();
        setSaving(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaving(false);
      // Could add error handling here
    }
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
    <Modal show={show} onHide={handleClose} size="lg">
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
                />
              </Form.Group>

              {/* Quick note templates */}
              <div className="quick-notes-section">
                <p className="fw-bold mb-2">Quick Notes:</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {quickNotes.map((note, index) => (
                    <Button key={index} className="filter-btn" size="sm" onClick={() => addQuickNote(note)}>
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
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveNotes} disabled={saving}>
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesEditor;
