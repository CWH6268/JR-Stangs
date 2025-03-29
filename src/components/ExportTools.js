import React from 'react';
import { Button } from 'react-bootstrap';
import { exportToCsv } from '../utils/dataParser';

const ExportTools = ({ players }) => {
  // Export all player data to CSV
  const handleExport = () => {
    if (players.length === 0) {
      alert('No player data to export.');
      return;
    }

    // Generate the CSV content
    const csv = exportToCsv(players);

    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Set up and trigger the download
    link.setAttribute('href', url);
    link.setAttribute('download', `jr-stangs-roster-${getFormattedDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get formatted date for file naming
  const getFormattedDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0'
    )}`;
  };

  return (
    <Button className="btn-primary" onClick={handleExport}>
      Export CSV
    </Button>
  );
};

export default ExportTools;
