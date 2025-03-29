import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import Header from './components/Header';
import PlayerTable from './components/PlayerTable';
import FilterControls from './components/FilterControls';
import ExportTools from './components/ExportTools';
import { loadRosterData } from './utils/dataParser';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

function App() {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    position: '',
    school: '',
    searchTerm: '',
  });

  // Load roster data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load player data from paste.txt
        const data = await loadRosterData();

        console.log('Loaded player data from paste.txt:', data.length, 'players');

        // Load notes from Firebase
        try {
          const notesQuery = query(collection(db, 'playerNotes'));
          const querySnapshot = await getDocs(notesQuery);

          // Log notes for debugging
          console.log('Found', querySnapshot.size, 'notes in Firebase');

          // Create maps of player ID to notes
          const notesMap = {};
          const legacyNotesMap = {};

          querySnapshot.forEach((document) => {
            const docData = document.data();
            // Store by document ID (which could be stable ID or legacy ID)
            notesMap[document.id] = docData.notes;

            // If there's a playerId field, use it as a possible legacy ID
            if (docData.playerId) {
              legacyNotesMap[docData.playerId] = docData.notes;
            }
          });

          // Merge notes with player data
          const playersWithNotes = data.map((player) => {
            // Check for notes using the stable ID
            if (notesMap[player.id]) {
              return { ...player, Notes: notesMap[player.id] };
            }

            // Fall back to legacy ID if no match found with stable ID
            if (legacyNotesMap[player.legacyId]) {
              return { ...player, Notes: legacyNotesMap[player.legacyId] };
            }

            // No notes found for this player
            return player;
          });

          setPlayers(playersWithNotes);
          setFilteredPlayers(playersWithNotes);
        } catch (firebaseError) {
          console.error('Error loading notes from Firebase:', firebaseError);
          // If Firebase fails, still show players without notes
          setPlayers(data);
          setFilteredPlayers(data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading roster data:', err);
        setError('Failed to load roster data. Please check that paste.txt is correctly formatted.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    const applyFilters = () => {
      let result = [...players];

      // Filter by position - check if the position string contains the filter value
      if (filters.position) {
        result = result.filter((player) => {
          if (!player.Position) return false;

          // Split the position string by commas and trim each part
          const playerPositions = player.Position.split(',').map((p) => p.trim());

          // Check if any of the player's positions match or contain the filter
          return playerPositions.some((pos) => pos === filters.position || pos.includes(filters.position));
        });
      }

      // Filter by school
      if (filters.school) {
        result = result.filter((player) => player.School === filters.school);
      }

      // Enhanced search: Filter by name OR jersey number
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        result = result.filter((player) => {
          // Check first name
          const firstNameMatch = player.FirstName && player.FirstName.toLowerCase().includes(term);

          // Check last name
          const lastNameMatch = player.LastName && player.LastName.toLowerCase().includes(term);

          // Check jersey number (if it exists)
          const jerseyMatch = player.Jersey && player.Jersey.toString().includes(term);

          // Return true if any of the fields match
          return firstNameMatch || lastNameMatch || jerseyMatch;
        });
      }

      console.log('Applied filters:', filters, '- showing', result.length, 'of', players.length, 'players');

      setFilteredPlayers(result);
    };

    applyFilters();
  }, [filters, players]);

  // Update player data (notes only) and save to Firebase
  const updatePlayerData = async (playerId, field, value) => {
    // Only allow updating Notes field
    if (field !== 'Notes') return;

    // Find the player by ID
    const playerToUpdate = players.find((p) => p.id === playerId);
    if (!playerToUpdate) {
      console.error('Player not found with ID:', playerId);
      return;
    }

    // Update local state
    const updatedPlayers = players.map((player) => {
      if (player.id === playerId) {
        return { ...player, [field]: value };
      }
      return player;
    });

    setPlayers(updatedPlayers);

    // Save to Firebase using the stable ID
    try {
      // Find the player to get their info
      const playerName = `${playerToUpdate.FirstName || ''} ${playerToUpdate.LastName || ''}`.trim();

      const playerRef = doc(db, 'playerNotes', playerId);
      await setDoc(playerRef, {
        notes: value,
        timestamp: new Date().toISOString(),
        playerId: playerId,
        legacyId: playerToUpdate.legacyId,
        playerName: playerName,
      });

      console.log('Notes saved to Firebase for player:', playerName, 'with ID:', playerId);
    } catch (error) {
      console.error('Error saving notes to Firebase:', error);
    }
  };

  return (
    <Container fluid className="app-container p-0">
      <Header />

      <Container className="mt-4 mb-5">
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Row className="mb-4 align-items-center">
          <Col>
            <h5 className="mb-0 text-secondary">Player Roster</h5>
          </Col>
          <Col xs="auto">
            <ExportTools players={filteredPlayers} />
          </Col>
        </Row>

        <FilterControls players={players} filters={filters} setFilters={setFilters} />

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-muted">
              Showing {filteredPlayers.length} of {players.length} players
            </div>
            <PlayerTable players={filteredPlayers} updatePlayerData={updatePlayerData} />
          </>
        )}
      </Container>
    </Container>
  );
}

export default App;
