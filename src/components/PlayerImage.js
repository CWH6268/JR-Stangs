import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Image, Modal, Form, Row, Col } from 'react-bootstrap';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Cropper from 'react-easy-crop';

const PlayerImage = ({ playerId, playerName }) => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      const file = e.target.files[0];
      setImage(file);
      // Create a preview URL for the cropper
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setShowCropper(true);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Function to get the cropped image
  const getCroppedImage = async (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.8
        ); // 80% JPEG quality
      };
      image.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handleCloseCropper = () => {
    setShowCropper(false);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleCropSave = async () => {
    try {
      if (!imagePreview || !croppedAreaPixels) return;

      const croppedImageBlob = await getCroppedImage(imagePreview, croppedAreaPixels);
      const croppedFile = new File([croppedImageBlob], image ? image.name : 'cropped-image.jpg', {
        type: 'image/jpeg',
      });

      setImage(croppedFile);
      handleCloseCropper();

      // Auto-upload after cropping
      const imageRef = ref(storage, `player-images/${playerId}`);
      setUploading(true);
      await uploadBytes(imageRef, croppedFile);
      const url = await getDownloadURL(imageRef);
      setImageUrl(url);
      setUploading(false);
      setImage(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Failed to crop image. Please try again.');
      setUploading(false);
    }
  };

  // Clean up image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

      {error && <div className="text-danger mt-2 small">{error}</div>}

      {/* Cropping Modal */}
      <Modal show={showCropper} onHide={handleCloseCropper} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crop Player Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ position: 'relative', height: '400px', width: '100%' }}>
            {imagePreview && (
              <Cropper
                image={imagePreview}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <Row className="mt-3">
            <Col>
              <Form.Label>Zoom: {zoom.toFixed(1)}x</Form.Label>
              <Form.Range value={zoom} onChange={(e) => setZoom(Number(e.target.value))} min={1} max={3} step={0.1} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCropper}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCropSave} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" /> Processing...
              </>
            ) : (
              'Crop & Save'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlayerImage;
