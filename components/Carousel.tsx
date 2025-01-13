import React, { useState, useEffect } from 'react';

export default function Carousel({ children }) {
  const totalSlides = React.Children.count(children);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishedCycle, setFinishedCycle] = useState(false);

  // Automatically cycle slides ONCE
  useEffect(() => {
    if (!finishedCycle) {
      const slideInterval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex === totalSlides - 1) {
            // If we’re at the last slide, stop cycling
            setFinishedCycle(true);
            return prevIndex;
          } else {
            return prevIndex + 1;
          }
        });
      }, 3000); // 3s interval; adjust as needed

      return () => clearInterval(slideInterval);
    }
  }, [finishedCycle, totalSlides]);

  // Advance to the next slide on click
  const handleClick = () => {
    setCurrentIndex((prevIndex) => {
      // If we’re already at the last slide, do nothing
      if (prevIndex === totalSlides - 1) return 0;

      return prevIndex + 1;
    });
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onClick={handleClick}  // Advance to next slide upon click
      style={{ cursor: 'pointer' }} // Let users know they can click
    >
      <div
        className="whitespace-nowrap transition-transform duration-500"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {React.Children.map(children, (child) => (
          <div
            className="inline-block w-full"
            style={{
              padding: '0 1.5rem',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
