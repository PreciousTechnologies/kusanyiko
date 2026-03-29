import React, { useState, useEffect } from 'react';
import ProfilePictureModal from './ProfilePictureModal';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface ProfilePictureProps {
  src?: File | string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  clickable?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  src, 
  firstName, 
  lastName, 
  size = 'md', 
  className = '',
  clickable = true 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl'
  };

  const clickableClasses = clickable 
    ? `cursor-pointer hover:ring-2 hover:ring-green-300 transition-all duration-200 hover:scale-105 active:scale-95 ${
        isClicked ? 'ring-4 ring-green-400' : ''
      }` 
    : '';
  const baseClasses = `relative bg-white border-2 border-green-200 rounded-full flex items-center justify-center text-green-600 font-bold shadow-lg ring-4 ring-green-100 overflow-hidden ${sizeClasses[size]} ${className} ${clickableClasses}`;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      event.preventDefault();
      event.stopPropagation();
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Effect to handle image URL conversion
  useEffect(() => {
    if (!src) {
      setImageUrl(null);
      return;
    }

    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setImageUrl(url);
      
      // Cleanup object URL when component unmounts or src changes
      return () => URL.revokeObjectURL(url);
    }

    if (typeof src === 'string') {
      setImageUrl(resolveMediaUrl(src));
    }
  }, [src]);

  // If there's a picture, display it
  if (imageUrl && imageUrl.trim() !== '') {
    return (
      <>
        <div 
          className={baseClasses} 
          onClick={handleClick}
          title={clickable ? "Click to view larger" : undefined}
        >
          <img
            src={imageUrl}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={() => {
              // If image fails to load, show initials instead
              setImageUrl(null);
            }}
          />
          {clickable && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-0 hover:bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-200 transform scale-0 hover:scale-100">
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <ProfilePictureModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          src={src}
          firstName={firstName}
          lastName={lastName}
        />
      </>
    );
  }

  // Fallback to initials
  return (
    <>
      <div 
        className={`${baseClasses} ${!src ? 'animate-pulse' : ''}`}
        onClick={handleClick}
        title={clickable ? "Click to view larger" : undefined}
      >
        {firstName.charAt(0)}{lastName.charAt(0)}
        {clickable && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white bg-opacity-0 hover:bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-200 transform scale-0 hover:scale-100">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <ProfilePictureModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        src={src}
        firstName={firstName}
        lastName={lastName}
      />
    </>
  );
};

export default ProfilePicture;