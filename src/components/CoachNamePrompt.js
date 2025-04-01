import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function CoachNamePrompt({ onSave }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if coach name is already set
    const existingName = localStorage.getItem('coachName');
    console.log('Checking for coach name:', existingName ? 'Found' : 'Not found');

    if (!existingName) {
      // Set a small timeout to make sure the modal appears after component mount
      setTimeout(() => {
        console.log('Showing coach name prompt');
        setShow(true);
      }, 500);
    }
  }, []);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    // Make sure the name format is good for our notes structure
    // Avoid characters that would break our parsing
    if (trimmedName.includes(':')) {
      setError('Your name cannot contain the colon character (:)');
      return;
    }

    localStorage.setItem('coachName', trimmedName);
    console.log('Coach name saved:', trimmedName);

    // Call the onSave prop if provided
    if (onSave) {
      onSave(trimmedName);
    }

    setShow(false);

    // Force reload to make sure the name is used
    window.location.reload();
  };

  return (
    <Modal show={show} backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Coach Identification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please enter your name to identify yourself when editing player notes:</p>
        <Form.Control
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              handleSave();
            }
          }}
        />
        {error && <div className="text-danger mt-2">{error}</div>}
        <small className="text-muted mt-2 d-block">
          Your name will appear next to notes you add for each player, allowing coaches to see who added which comments.
        </small>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CoachNamePrompt;
