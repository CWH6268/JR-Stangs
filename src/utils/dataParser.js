import Papa from 'papaparse';

/**
 * Generate a unique, consistent ID for a player based on their personal data
 * This ID will remain the same even if the player's position in the file changes
 * @param {Object} player - Player data object
 * @returns {string} - Unique ID
 */
const generatePlayerID = (player) => {
  // Create a consistent ID using first name, last name, and date of birth
  // This combination should be unique for each player
  const firstName = (player.FirstName || '').toLowerCase().trim();
  const lastName = (player.LastName || '').toLowerCase().trim();
  const dob = (player.DOB || '').trim();

  // Create a string that combines these fields
  const idString = `${firstName}-${lastName}-${dob}`;

  // Replace any characters that might cause issues in Firebase document IDs
  // Firebase doesn't allow: ., /, [, ], #, $
  return idString.replace(/[.\/\[\]#$]/g, '_');
};

/**
 * Parse date from different formats to a consistent format
 * @param {string} dateStr - Date string in various formats
 * @returns {string} - Formatted date string or original if parsing fails
 */
const parseDate = (dateStr) => {
  if (!dateStr) return '';

  try {
    // Handle different date formats
    let date;

    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      date = new Date(dateStr);
    }
    // Handle M/D/YY format
    else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      // Assume 20xx for years in the range 00-29
      const fullYear = parseInt(year) < 30 ? `20${year}` : `19${year}`;
      date = new Date(`${fullYear}-${month}-${day}`);
    }
    // Handle any other format
    else {
      date = new Date(dateStr);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateStr}`);
      return dateStr; // Return original if can't parse
    }

    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return dateStr;
  }
};

/**
 * Load roster data from the paste.txt file in the public folder
 * with support for offline caching
 * @returns {Promise<Array>} - Array of player objects
 */
export const loadRosterData = async () => {
  try {
    // Check if we're offline first
    const isOffline = !navigator.onLine;

    // Try to load from cache first if offline or for faster loading
    const cachedData = localStorage.getItem('rosterDataCache');
    const cacheTimestamp = localStorage.getItem('rosterDataTimestamp');
    const now = new Date().getTime();

    // Use cache if offline or if the cache is less than 24 hours old
    const shouldUseCache =
      (isOffline && cachedData) ||
      (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000);

    if (shouldUseCache) {
      console.log('Using cached roster data');
      return JSON.parse(cachedData);
    }

    // If online and cache is stale or doesn't exist, fetch from file
    console.log('Fetching fresh roster data');
    const response = await fetch('/paste.txt');

    if (!response.ok) {
      throw new Error('Failed to load roster data file');
    }

    const text = await response.text();

    // Parse the tab-delimited data
    const { data, errors } = Papa.parse(text, {
      header: true,
      delimiter: '\t',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (errors.length > 0) {
      console.error('Parsing errors:', errors);
      throw new Error('Error parsing roster data');
    }

    // Process the data to add stable IDs, format dates
    const processedData = data.map((player, index) => {
      // Format date fields
      const formattedPlayer = { ...player };

      // Handle the "Date of Birth" field
      if (formattedPlayer['Date of Birth']) {
        formattedPlayer.DOB = parseDate(formattedPlayer['Date of Birth']);
        // Remove original field to avoid duplication
        delete formattedPlayer['Date of Birth'];
      }

      // Map First Name and Last Name to FirstName and LastName if needed
      if (formattedPlayer['First Name'] && !formattedPlayer.FirstName) {
        formattedPlayer.FirstName = formattedPlayer['First Name'];
        delete formattedPlayer['First Name'];
      }

      if (formattedPlayer['Last Name'] && !formattedPlayer.LastName) {
        formattedPlayer.LastName = formattedPlayer['Last Name'];
        delete formattedPlayer['Last Name'];
      }

      // Handle Jersey field (if it exists in the paste.txt)
      if (formattedPlayer['Jersey'] && !formattedPlayer.Jersey) {
        formattedPlayer.Jersey = formattedPlayer['Jersey'];
        delete formattedPlayer['Jersey'];
      } else if (formattedPlayer['Jersey #'] && !formattedPlayer.Jersey) {
        formattedPlayer.Jersey = formattedPlayer['Jersey #'];
        delete formattedPlayer['Jersey #'];
      }

      // Generate a stable ID for this player using their personal data
      const stableId = generatePlayerID(formattedPlayer);

      // Keep the array index ID as a fallback
      const arrayIndexId = `player-${index}`;

      return {
        ...formattedPlayer,
        id: stableId, // Primary ID - stable across file changes
        legacyId: arrayIndexId, // Fallback ID - for backward compatibility
        Notes: '',
      };
    });

    // Save to cache
    localStorage.setItem('rosterDataCache', JSON.stringify(processedData));
    localStorage.setItem('rosterDataTimestamp', now.toString());

    return processedData;
  } catch (error) {
    console.error('Error loading roster data:', error);

    // If we're offline and have any cached data, use it as a fallback
    if (!navigator.onLine) {
      const cachedData = localStorage.getItem('rosterDataCache');
      if (cachedData) {
        console.log('Offline - using cached data as fallback');
        return JSON.parse(cachedData);
      }
    }

    throw error;
  }
};

/**
 * Export roster data to CSV format
 * @param {Array} players - Array of player objects
 * @returns {string} - CSV string
 */
export const exportToCsv = (players) => {
  // Map the players to ensure we export the fields we want
  const exportData = players.map((player) => ({
    'Jersey #': player.Jersey || '',
    'First Name': player.FirstName,
    'Last Name': player.LastName,
    DOB: player.DOB,
    School: player.School,
    Position: player.Position,
    Notes: player.Notes || '',
  }));

  const csv = Papa.unparse(exportData, {
    delimiter: ',',
    header: true,
  });

  return csv;
};
