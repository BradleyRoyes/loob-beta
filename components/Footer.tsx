import React from "react";

const Footer = ({ className = "" }) => {
  return (
    <footer className={`chatbot-text-tertiary flex justify-between items-center text-sm mt-6 px-4 ${className}`}>
      {/* Loob Labs Link */}
      <a
        className="vercel-link flex items-center h-8 w-max flex-none justify-center border rounded-md text-xs transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Visit Loob Labs"
        href="https://www.seks.design/looblabs/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="px-3">▲</span>
        <hr className="h-full border-r mx-2" />
        <span className="px-3">loob.labs</span>
      </a>

      {/* Powered By Section */}
      <div
        className="ml-auto flex items-center space-x-1"
        style={{ whiteSpace: "nowrap" }}
      >
        <span className="mr-1">Powered by</span>
        <a
          href="https://seks.design"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Seks Design"
          className="transition-opacity hover:opacity-75"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 650 713"
            width="30px"
            height="30px"
            aria-hidden="true"
          >
            <g transform="translate(25, -78)">
              <path
                d="M286.6,280.3l-3.7-72.2c0,0-61.2,20.3-74,32.2c-20.2,18.9-12.3,43.8-9.6,63.6c2.7,19.8,21.8,79.6-33.9,79.5
                  c-57.6-0.1-53.4-70.2-53.4-70.2"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="13"
                strokeMiterlimit="10"
              />
              <path
                d="M69.8,485.8h135.6c0,0-3.6-72.6-70.2-72.6C69.8,413.2,69.8,485.8,69.8,485.8z"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="13"
                strokeMiterlimit="10"
              />
              <path
                d="M69.8,488.9c0,0,0,43.9,32,67.7c50.4,37.4,102.6-15.5,102.6-15.5v28.7"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="13"
                strokeMiterlimit="10"
              />
              <polyline
                points="245.2,280.3 245.2,421.4 245.2,600"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="24"
                strokeMiterlimit="10"
              />
              <path
                d="M364.3,339.6c0,0-48.1,60.4-108.7,81.8l184,173.4"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="24"
                strokeMiterlimit="10"
              />
              <path
                d="M478.1,384.5c0,0-9.6-23.3-49-23.3c-39,0-54.2,18.4-54.2,35.9c0,17.5,15.6,30.1,53.5,31.7
                  c69.8,2.9,61.3,73.1,0.9,73.1c-54.5,0-60.3-28.1-60.3-28.1"
                fill="none"
                stroke="#6B6F73"
                strokeWidth="13"
                strokeMiterlimit="10"
              />
            </g>
            <circle
              cx="305.5"
              cy="336.5"
              r="300"
              fill="none"
              stroke="#6B6F73"
              strokeWidth="13"
            />
          </svg>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
