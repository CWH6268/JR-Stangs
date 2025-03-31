import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function CoachNamePrompt() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    // Check if coach name is already set
    const existingName = localStorage.getItem('coachName');
    if (!existingName) {
      setShow(true);
    }
  }, []);

  const handleSave = () => {
    if (name.trim()) {
      localStorage.setItem('coachName', name.trim());
      setShow(false);
    }
  };

  return (
    <Modal show={show} backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Coach Identification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please enter your name to identify yourself when editing player notes:</p>
        <Form.Control type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
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
