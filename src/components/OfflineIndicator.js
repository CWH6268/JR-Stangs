import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert variant="warning" className="m-3">
      <strong>You are offline.</strong> Changes will be synced when your connection is restored.
    </Alert>
  );
};

export default OfflineIndicator;
