import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large'; // Predefined sizes
  alt?: string; // Alt text for accessibility
  className?: string; // Additional CSS classes
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', alt = 'Loob Logo', className }) => {
  // Define sizes for the logo
  const sizeMap = {
    small: 50, // Width & Height in pixels
    medium: 100,
    large: 150,
  };

  const logoSize = sizeMap[size] || sizeMap['medium'];

  return (
    <div
      className={`logo-wrapper ${className || ''}`}
      style={{
        width: `${logoSize}px`,
        height: `${logoSize}px`,
      }}
      role="img"
      aria-label={alt}
    >
      {/* Inline SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        fill="none"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <circle cx="50" cy="50" r="45" stroke="pink" strokeWidth="5" fill="orange" />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontFamily="Arial, sans-serif"
        >
          Loob
        </text>
      </svg>
    </div>
  );
};

export default Logo;
