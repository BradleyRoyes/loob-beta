// ./components/Carousel.jsx
import React, { useState } from 'react';

export default function Carousel({ children }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % React.Children.count(children));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? React.Children.count(children) - 1 : prevIndex - 1
    );
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="whitespace-nowrap transition-transform duration-500"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {React.Children.map(children, (child, index) => (
          <div className="inline-block w-full">{child}</div>
        ))}
      </div>
      <button
        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white p-2 rounded-full"
        onClick={prevSlide}
      >
        ◀
      </button>
      <button
        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white p-2 rounded-full"
        onClick={nextSlide}
      >
        ▶
      </button>
    </div>
  );
}
