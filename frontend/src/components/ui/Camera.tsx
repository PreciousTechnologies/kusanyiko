import React, { useRef, useState, useCallback } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import CameraPermissionGuide from './CameraPermissionGuide';
import '../../styles/camera-permission-guide.css';

interface CameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageFile: File) => void;
}

const Camera: React.FC<CameraProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    if (!mountedRef.current || !isOpen) return;
    
    try {
      setError(null);
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current && isOpen && mountedRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for the video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && isOpen && mountedRef.current) {
            videoRef.current.play().catch(err => {
              console.warn('Video play interrupted:', err);
            });
          }
        };
      }
      
      if (mountedRef.current) {
        setStream(mediaStream);
      } else {
        // Component unmounted, clean up the stream
        mediaStream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (mountedRef.current) {
        // Check for specific permission errors
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setShowPermissionGuide(true);
          setError('Camera access denied. Please grant camera permissions to continue.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotSupportedError') {
          setError('Camera is not supported by this browser.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is already in use by another application.');
        } else {
          setShowPermissionGuide(true);
          setError('Unable to access camera. Please ensure camera permissions are granted.');
        }
      }
    }
  }, [facingMode, isOpen, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    if (isCapturing) return; // Prevent switching during capture
    
    // Stop current stream
    stopCamera();
    
    // Small delay to ensure stream is properly stopped
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Switch facing mode
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera, isCapturing]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        onCapture(file);
        handleClose();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  }, [onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    setError(null);
    setShowPermissionGuide(false);
    onClose();
  }, [stopCamera, onClose]);

  const handlePermissionRetry = useCallback(() => {
    setShowPermissionGuide(false);
    setError(null);
    startCamera();
  }, [startCamera]);

  // Start camera when component opens
  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    }

    // Cleanup on unmount or close
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, facingMode]);

  // Cleanup when component unmounts
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-screen bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <h3 className="text-lg font-semibold">Take Photo</h3>
            <div className="flex items-center space-x-2">
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
                title="Switch Camera"
                disabled={isCapturing}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-200"
                title="Close"
                disabled={isCapturing}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative w-full h-full flex items-center justify-center">
          {error ? (
            <div className="text-center text-white p-8">
              <div className="bg-red-500/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Viewfinder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-full"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex items-center justify-center">
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Capture Photo"
              >
                {isCapturing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
                ) : (
                  <CameraIcon className="h-8 w-8 text-gray-800" />
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-white/70 text-sm">
                Tap the camera button to take a photo
              </p>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>

      {/* Camera Permission Guide */}
      <CameraPermissionGuide
        isVisible={showPermissionGuide}
        onRetry={handlePermissionRetry}
        onClose={handleClose}
      />
    </div>
  );
};

export default Camera;