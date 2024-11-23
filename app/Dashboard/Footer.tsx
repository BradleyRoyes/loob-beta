'use client';

import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={`chatbot-text-tertiary flex flex-col items-center md:flex-row md:justify-between text-sm mt-6 px-4 py-6 bg-black text-white ${className}`}>
      <a
        className="vercel-link flex h-8 items-center justify-center border rounded-md text-xs mb-4 md:mb-0"
        aria-label="Create with seks"
        href="https://www.seks.design/looblabs/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="px-3">▲</span>
        <hr className="h-full border-r" />
        <span className="px-3">loob.labs</span>
      </a>
      <div
        className="ml-auto flex flex-row items-center"
        style={{ whiteSpace: 'nowrap' }}
      >
        <span className="mr-1" style={{ whiteSpace: 'nowrap' }}>
          Powered by
        </span>
        <a href="https://seks.design" target="_blank" rel="noopener noreferrer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 650 713"
            style={{
              width: '30px',
              height: 'auto',
              marginLeft: '4px',
            }}
          >
            <g transform="translate(25, -78)">
              <path
                className="st0"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 13,
                  strokeMiterlimit: 10,
                }}
                d="M286.6,280.3l-3.7-72.2c0,0-61.2,20.3-74,32.2c-20.2,18.9-12.3,43.8-9.6,63.6c2.7,19.8,21.8,79.6-33.9,79.5
                    c-57.6-0.1-53.4-70.2-53.4-70.2"
              />
              <path
                className="st0"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 13,
                  strokeMiterlimit: 10,
                }}
                d="M69.8,485.8h135.6c0,0-3.6-72.6-70.2-72.6C69.8,413.2,69.8,485.8,69.8,485.8z"
              />
              <path
                className="st0"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 13,
                  strokeMiterlimit: 10,
                }}
                d="M69.8,488.9c0,0,0,43.9,32,67.7c50.4,37.4,102.6-15.5,102.6-15.5v28.7"
              />
              <polyline
                className="st1"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 24,
                  strokeMiterlimit: 10,
                }}
                points="245.2,280.3 245.2,421.4 245.2,600 "
              />
              <path
                className="st1"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 24,
                  strokeMiterlimit: 10,
                }}
                d="M364.3,339.6c0,0-48.1,60.4-108.7,81.8l184,173.4"
              />
              <path
                className="st0"
                style={{
                  fill: 'none',
                  stroke: '#6B6F73',
                  strokeWidth: 13,
                  strokeMiterlimit: 10,
                }}
                d="M478.1,384.5c0,0-9.6-23.3-49-23.3c-39,0-54.2,18.4-54.2,35.9c0,17.5,15.6,30.1,53.5,31.7
                    c69.8,2.9,61.3,73.1,0.9,73.1c-54.5,0-60.3-28.1-60.3-28.1"
              />
            </g>
            <circle
              cx="305.5"
              cy="336.5"
              r="300"
              style={{
                fill: 'none',
                stroke: '#6B6F73',
                strokeWidth: '13',
              }}
            />
          </svg>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
