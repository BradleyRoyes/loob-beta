// TestVisual.js
import React from 'react';

const keywords = [
  'transformation', 'consciousness', 'psychedelic', 'journey', 'insight',
  'awareness', 'mystical', 'experience', 'healing', 'meditation',
  'mindfulness', 'spirituality', 'expansion', 'perception', 'enlightenment'
];

const getRandomStyles = () => {
  const rotation = Math.random() * 90 - 45; // Rotate between -45 to 45 degrees
  const fontSize = Math.random() * (24 - 12) + 12; // Font size between 12px and 24px
  return {
    transform: `rotate(${rotation}deg)`,
    fontSize: `${fontSize}px`,
    margin: '5px',
    display: 'inline-block',
    color: `hsl(${Math.random() * 360}, 100%, 50%)`, // Full saturation, 50% lightness, random hue
  };
};

const TestVisual = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {keywords.map((keyword, index) => (
        <span key={index} style={getRandomStyles()}>
          {keyword}
        </span>
      ))}
    </div>
  );
};

export default TestVisual;
