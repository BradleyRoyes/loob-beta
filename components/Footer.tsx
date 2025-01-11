import React from "react";

const Footer = ({ className = "" }) => {
  return (
    <footer
      className={`footer-container bg-gray-800 text-gray-400 flex justify-between items-center px-4 py-2 text-sm ${className}`}
    >
      {/* Left Section: Link to Labs */}
      <a
        href="https://www.seks.design/looblabs/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 hover:text-gray-300 transition"
        aria-label="Visit Loob Labs"
      >
        <span>▲</span>
        <span>Loob Labs</span>
      </a>

      {/* Center Section: Separator */}
      <span className="hidden md:inline">|</span>

      {/* Right Section: Powered By */}
      <div className="flex items-center space-x-2">
        <span>Powered by</span>
        <a
          href="https://seks.design"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-300 transition"
          aria-label="Visit Seks Design"
        >
          Seks Design
        </a>
      </div>
    </footer>
  );
};

export default Footer;
