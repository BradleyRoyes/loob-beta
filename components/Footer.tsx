import React from "react";

const Footer = ({ className = "" }) => {
  return (
    <footer
      className={`footer-container bg-gray-800 text-gray-400 flex flex-wrap justify-between items-center px-4 py-2 text-sm w-full ${className}`}
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.2)", // Shadow for separation
      }}
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

      {/* Center Section: Separator (hidden on small screens) */}
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
