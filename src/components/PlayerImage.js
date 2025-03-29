import React, { useState, useEffect } from 'react';
import { Button, Spinner, Image } from 'react-bootstrap';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PlayerImage = ({ playerId, playerName }) => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load image on component mount
  useEffect(() => {
    const loadImage = async () => {
      try {
        const imageRef = ref(storage, `player-images/${playerId}`);
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } catch (error) {
        // No image found for this player - this is normal
        if (error.code !== 'storage/object-not-found') {
          console.error('Error loading player image:', error);
        }
      }
    };

    if (playerId) {
      loadImage();
    }
  }, [playerId]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image) return;

    try {
      setUploading(true);
      setError(null);

      // Create a reference to the player's image file
      const imageRef = ref(storage, `player-images/${playerId}`);

      // Upload the image
      await uploadBytes(imageRef, image);

      // Get the download URL
      const url = await getDownloadURL(imageRef);

      // Update the UI
      setImageUrl(url);
      setImage(null);
      setUploading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="player-image-container text-center">
      {imageUrl ? (
        <div className="mb-3">
          <Image src={imageUrl} alt={playerName} thumbnail className="player-photo" />
        </div>
      ) : (
        <div className="mb-3 player-placeholder">
          <div className="placeholder-text">No photo</div>
        </div>
      )}

      <div className="mb-3">
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="form-control form-control-sm"
          disabled={uploading}
        />
      </div>

      <Button
        variant="outline-primary"
        onClick={handleUpload}
        disabled={!image || uploading}
        size="sm"
        className="w-100"
      >
        {uploading ? (
          <>
            <Spinner as="span" animation="border" size="sm" /> Uploading...
          </>
        ) : (
          'Upload Photo'
        )}
      </Button>

      {error && <div className="text-danger mt-2 small">{error}</div>}
    </div>
  );
};

export default PlayerImage;
