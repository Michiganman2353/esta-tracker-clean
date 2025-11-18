import React, { useState, useRef, useEffect } from 'react';
import './PhotoCapture.css';

/**
 * PhotoCapture Component
 * 
 * Mobile-friendly photo capture interface with:
 * - Camera access
 * - Photo preview
 * - Confirmation dialogue
 * - Retake/correction workflow
 * - Quality validation
 */

interface PhotoCaptureProps {
  onPhotoConfirmed: (photo: File) => void;
  onCancel?: () => void;
  maxFileSize?: number; // in bytes, default 10MB
  acceptedFormats?: string[];
  requireQualityCheck?: boolean;
}

interface PhotoQuality {
  isValid: boolean;
  warnings: string[];
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoConfirmed,
  onCancel,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png'],
  requireQualityCheck = true,
}) => {
  const [step, setStep] = useState<'capture' | 'preview' | 'confirm'>('capture');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [quality, setQuality] = useState<PhotoQuality>({ isValid: true, warnings: [] });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera when component mounts
  useEffect(() => {
    return () => {
      // Cleanup: stop camera when component unmounts
      stopCamera();
    };
  }, []);

  /**
   * Start the camera stream
   */
  const startCamera = async () => {
    try {
      // Request camera access with preference for rear camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(
        'Unable to access camera. Please ensure camera permissions are granted.'
      );
    }
  };

  /**
   * Stop the camera stream
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Capture photo from video stream
   */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Failed to create image blob');
          return;
        }

        // Create File object
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Validate file
        const validation = validatePhoto(file);
        if (!validation.isValid) {
          alert(validation.error);
          return;
        }

        // Check quality
        const qualityCheck = checkPhotoQuality(canvas);
        setQuality(qualityCheck);

        // Create preview URL
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        setPhotoFile(file);

        // Stop camera
        stopCamera();

        // Move to preview step
        setStep('preview');
      },
      'image/jpeg',
      0.95 // High quality JPEG
    );
  };

  /**
   * Validate photo file
   */
  const validatePhoto = (file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
      };
    }

    // Check file format
    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${acceptedFormats.join(', ')}`,
      };
    }

    return { isValid: true };
  };

  /**
   * Check photo quality
   */
  const checkPhotoQuality = (canvas: HTMLCanvasElement): PhotoQuality => {
    const warnings: string[] = [];
    const context = canvas.getContext('2d');

    if (!context) {
      return { isValid: true, warnings };
    }

    // Check resolution
    const minWidth = 640;
    const minHeight = 480;

    if (canvas.width < minWidth || canvas.height < minHeight) {
      warnings.push(
        `Low resolution: ${canvas.width}x${canvas.height}. Recommended: at least ${minWidth}x${minHeight}`
      );
    }

    // Check brightness (basic check)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let brightness = 0;

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    brightness = brightness / (data.length / 40);

    if (brightness < 50) {
      warnings.push('Image appears too dark. Consider better lighting.');
    } else if (brightness > 200) {
      warnings.push('Image appears too bright. Consider adjusting lighting.');
    }

    const isValid = warnings.length === 0 || !requireQualityCheck;

    return { isValid, warnings };
  };

  /**
   * Handle file input selection (fallback for devices without camera access)
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validatePhoto(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setPhotoFile(file);

    // For uploaded files, we'll skip detailed quality check
    setQuality({ isValid: true, warnings: [] });

    // Move to preview step
    setStep('preview');
  };

  /**
   * Retake photo
   */
  const retakePhoto = () => {
    // Clean up previous photo
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(null);
    setPhotoFile(null);
    setQuality({ isValid: true, warnings: [] });

    // Go back to capture
    setStep('capture');
    startCamera();
  };

  /**
   * Confirm photo
   */
  const confirmPhoto = () => {
    if (!photoFile) return;

    // Clean up URL (will be recreated if needed)
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    // Call parent callback
    onPhotoConfirmed(photoFile);
  };

  /**
   * Cancel capture
   */
  const handleCancel = () => {
    stopCamera();
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    if (onCancel) {
      onCancel();
    }
  };

  // Render capture step
  if (step === 'capture') {
    return (
      <div className="photo-capture">
        <div className="photo-capture-header">
          <h3>Capture Photo</h3>
          <button onClick={handleCancel} className="btn-cancel">
            Cancel
          </button>
        </div>

        {cameraError ? (
          <div className="camera-error">
            <p>{cameraError}</p>
            <div className="camera-fallback">
              <p>Use file picker instead:</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="file-input"
              />
            </div>
          </div>
        ) : (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-preview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="camera-controls">
              <button
                onClick={startCamera}
                className="btn-start-camera"
                disabled={!!streamRef.current}
              >
                {streamRef.current ? 'Camera Active' : 'Start Camera'}
              </button>
              <button
                onClick={capturePhoto}
                className="btn-capture"
                disabled={!streamRef.current}
              >
                <span className="capture-icon">📷</span>
                <span>Capture</span>
              </button>
              <div className="file-fallback">
                <label htmlFor="file-input" className="file-label">
                  Or choose file
                </label>
                <input
                  id="file-input"
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render preview/confirm step
  return (
    <div className="photo-preview">
      <div className="photo-preview-header">
        <h3>Review Photo</h3>
      </div>

      <div className="photo-preview-container">
        {photoUrl && (
          <img src={photoUrl} alt="Captured photo" className="photo-preview-image" />
        )}
      </div>

      {quality.warnings.length > 0 && (
        <div className="quality-warnings">
          <h4>⚠️ Quality Warnings:</h4>
          <ul>
            {quality.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          {requireQualityCheck && (
            <p className="warning-note">
              Consider retaking the photo for better quality.
            </p>
          )}
        </div>
      )}

      <div className="photo-preview-actions">
        <button onClick={retakePhoto} className="btn-retake">
          Retake Photo
        </button>
        <button onClick={confirmPhoto} className="btn-confirm">
          Confirm & Upload
        </button>
      </div>
    </div>
  );
};

export default PhotoCapture;
