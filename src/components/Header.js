import React from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { collection, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase';

const Header = () => {
  // Clear all notes function
  const clearAllNotes = () => {
    if (window.confirm('WARNING: This will PERMANENTLY DELETE ALL player notes. Are you absolutely sure?')) {
      if (window.confirm('FINAL WARNING: This action cannot be undone. Type "DELETE" to confirm.')) {
        const deleteConfirm = prompt('Type "DELETE" to confirm you want to erase all notes');
        if (deleteConfirm === 'DELETE') {
          // Get all player notes
          const notesQuery = query(collection(db, 'playerNotes'));
          getDocs(notesQuery)
            .then((querySnapshot) => {
              // Delete each document
              querySnapshot.forEach((document) => {
                deleteDoc(doc(db, 'playerNotes', document.id));
              });
              alert('All notes have been cleared. Reload the page to see changes.');
            })
            .catch((error) => {
              console.error('Error clearing notes:', error);
              alert('Error clearing notes: ' + error.message);
            });
        }
      }
    }
  };

  // Clear coach name to force prompt
  const resetCoachName = () => {
    if (window.confirm('This will remove your coach name and prompt you to enter it again. Continue?')) {
      localStorage.removeItem('coachName');
      window.location.reload();
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand href="#home">
          <img src="/logo.png" width="60" height="60" className="d-inline-block align-top me-2" alt="JR Stangs Logo" />
          JR Stangs Tryout System
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Navbar.Text className="me-3">Western Junior Mustangs Football</Navbar.Text>
          <Button variant="outline-danger" size="sm" onClick={clearAllNotes} className="me-2">
            Clear All Notes
          </Button>
          <Button variant="outline-warning" size="sm" onClick={resetCoachName}>
            Reset Coach Name
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
