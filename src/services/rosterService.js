// src/services/rosterService.js
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Generate a unique ID for a player
const generatePlayerId = (player) => {
  // Create a consistent ID based on name and DOB to avoid duplicates
  const firstName = (player['First Name'] || '').toLowerCase().trim();
  const lastName = (player['Last Name'] || '').toLowerCase().trim();
  const dob = (player['Date of Birth'] || '').replace(/\//g, '-');

  return `${firstName}-${lastName}-${dob}`;
};

// Load roster data from paste.txt
export const loadRosterFromFile = async () => {
  try {
    const response = await fetch('/paste.txt');
    if (!response.ok) {
      throw new Error('Failed to load roster data');
    }

    const data = await response.text();
    const lines = data.split('\n').filter((line) => line.trim());

    // First line is headers
    const headers = lines[0].split('\t');

    // Parse roster data
    const players = lines.slice(1).map((line) => {
      const values = line.split('\t');
      const player = {};

      headers.forEach((header, index) => {
        player[header.trim()] = values[index]?.trim() || '';
      });

      return player;
    });

    return players;
  } catch (error) {
    console.error('Error loading roster:', error);
    throw error;
  }
};

// Sync roster data with Firebase
export const syncRosterWithFirebase = async (players) => {
  try {
    // Keep track of successful saves
    let successCount = 0;

    // Process each player
    for (const player of players) {
      // Generate a consistent ID for the player
      const playerId = generatePlayerId(player);

      // Check if player already exists in Firestore
      const playerRef = doc(db, 'players', playerId);
      const playerDoc = await getDoc(playerRef);

      // If player exists, keep their notes and just update other fields
      let notesData = {};
      if (playerDoc.exists()) {
        const existingData = playerDoc.data();
        // Preserve notes and notes history if they exist
        if (existingData.notes) {
          notesData.notes = existingData.notes;
        }
        if (existingData.notesHistory) {
          notesData.notesHistory = existingData.notesHistory;
        }
        if (existingData['Jersey #']) {
          notesData['Jersey #'] = existingData['Jersey #'];
        }
      }

      // Prepare data for Firestore
      await setDoc(
        playerRef,
        {
          ...player, // Preserve all original fields from paste.txt
          lastUpdated: serverTimestamp(),
          ...notesData, // Add back any existing notes
        },
        { merge: true }
      );

      successCount++;
    }

    return {
      total: players.length,
      success: successCount,
    };
  } catch (error) {
    console.error('Error syncing roster with Firebase:', error);
    throw error;
  }
};

// Get players from Firebase
export const getPlayersFromFirebase = async (divisionFilter = null) => {
  try {
    let playersRef;

    if (divisionFilter) {
      // Query with division filter
      playersRef = query(collection(db, 'players'), where('Division', '==', divisionFilter));
    } else {
      // Get all players
      playersRef = collection(db, 'players');
    }

    const snapshot = await getDocs(playersRef);

    // Convert to array with ID
    const players = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return players;
  } catch (error) {
    console.error('Error fetching players from Firebase:', error);
    throw error;
  }
};

// Export roster as CSV
export const exportRosterAsCSV = (players) => {
  try {
    if (!players || players.length === 0) {
      throw new Error('No players to export');
    }

    // Determine headers from first player
    const samplePlayer = players[0];
    const headers = Object.keys(samplePlayer).filter(
      (key) =>
        key !== 'id' && key !== 'notes' && key !== 'notesHistory' && key !== 'lastUpdated' && key !== 'lastUpdatedBy'
    );

    // Create CSV content
    const csvContent = [
      // Headers row
      headers.join(','),
      // Data rows
      ...players.map((player) => {
        return headers
          .map((header) => {
            const value = player[header] || '';
            // Wrap in quotes if contains comma or is a string
            return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
              ? `"${value.replace(/"/g, '""')}"` // Escape quotes by doubling them
              : value;
          })
          .join(',');
      }),
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting roster as CSV:', error);
    throw error;
  }
};
