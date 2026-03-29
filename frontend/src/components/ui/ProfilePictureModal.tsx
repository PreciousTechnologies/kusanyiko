import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: File | string | null;
  firstName: string;
  lastName: string;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
  src,
  firstName,
  lastName,
}) => {
  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const scrollYRef = useRef(0);
  const [fileImageUrl, setFileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (src instanceof File) {
      const objectUrl = URL.createObjectURL(src);
      setFileImageUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
        setFileImageUrl(null);
      };
    }
    setFileImageUrl(null);
  }, [src]);

  // Convert File to URL if needed
  let imageUrl: string | null = null;
  if (src) {
    if (typeof src === 'string') {
      imageUrl = resolveMediaUrl(src);
    } else if (src instanceof File) {
      imageUrl = fileImageUrl;
    }
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPanPosition({ x: 0, y: 0 });
      setImageError(false);
      setIsAnimating(true);
      setIsDragging(false);
      // Remove animation class after animation completes
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isOpen, imageUrl]);

  // Handle ESC key press and other keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case '=':
        case '+':
          event.preventDefault();
          setZoom(prev => Math.min(prev + 0.2, 3));
          break;
        case '-':
          event.preventDefault();
          setZoom(prev => Math.max(prev - 0.2, 0.5));
          break;
        case '0':
          event.preventDefault();
          setZoom(1);
          break;
      }
    };

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      // Lock body scroll without losing the current scroll position.
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;

      if (isOpen) {
        window.scrollTo(0, scrollYRef.current);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - panPosition.x,
        y: touch.clientY - panPosition.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPanPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel handler for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
    
    // Reset pan position if zooming out to 1x
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-all duration-300 ease-out ${
        isAnimating ? 'bg-opacity-0' : 'bg-opacity-95'
      }`}
      onClick={handleBackdropClick}
      style={{
        backdropFilter: isAnimating ? 'blur(0px)' : 'blur(2px)',
      }}
    >
      <div className={`relative w-full h-full flex items-center justify-center p-4 md:p-8 transition-transform duration-300 ease-out ${
        isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Top Control Bar */}
        <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6 transition-all duration-500 ${
          isAnimating ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <div className="flex items-center justify-between text-white">
            {/* Profile Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{firstName} {lastName}</h3>
                <p className="text-white/70 text-sm">Profile Picture</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {imageUrl && !imageError && (
                <>
                  {/* Zoom Controls */}
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 hover:scale-110"
                    title="Zoom Out (-)"
                  >
                    <MagnifyingGlassMinusIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleZoomReset}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-sm font-medium min-w-[60px] hover:scale-105"
                    title="Reset Zoom (0)"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 hover:scale-110"
                    title="Zoom In (+)"
                  >
                    <MagnifyingGlassPlusIcon className="h-5 w-5" />
                  </button>

                  <div className="w-px h-6 bg-white/30 mx-2"></div>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-110"
                title="Close (ESC)"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex items-center justify-center w-full h-full mt-20 mb-16 overflow-hidden">
          {imageUrl && imageUrl.trim() !== '' && !imageError ? (
            <div 
              className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <img
                src={imageUrl}
                alt={`${firstName} ${lastName}`}
                className="profile-modal-image max-w-full max-h-full object-contain transition-transform duration-300 ease-out shadow-2xl rounded-lg opacity-100 select-none"
                style={{ 
                  transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`,
                  imageRendering: zoom > 1 ? 'crisp-edges' : 'auto',
                  maxWidth: zoom > 1 ? 'none' : '90vw',
                  maxHeight: zoom > 1 ? 'none' : '90vh',
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onDoubleClick={handleImageDoubleClick}
                title={zoom > 1 ? "Drag to pan, double-click to reset" : "Double-click to zoom"}
                draggable={false}
              />
              
              {/* Zoom indicator */}
              {zoom !== 1 && (
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm pointer-events-none">
                  {Math.round(zoom * 100)}%
                </div>
              )}
            </div>
          ) : (
            /* Fallback to large initials if no image or error */
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-8xl font-bold shadow-2xl border-4 border-white/20 animate-pulse">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
              {imageError && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center bg-red-500/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                  <p>Image not available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Instructions */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent p-6 transition-all duration-500 ${
          isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <div className="text-center text-white/70 text-sm space-y-1">
            <p>Click outside or press <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono">ESC</kbd> to close</p>
            {imageUrl && !imageError && (
              <div className="space-y-1">
                <p>
                  Use <kbd className="px-1 bg-white/20 rounded text-xs font-mono">+</kbd> <kbd className="px-1 bg-white/20 rounded text-xs font-mono">-</kbd> to zoom, 
                  <kbd className="px-1 bg-white/20 rounded text-xs font-mono">0</kbd> to reset, or double-click image
                </p>
                <p>
                  Scroll to zoom • Drag to pan when zoomed • Works on mobile too
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureModal;