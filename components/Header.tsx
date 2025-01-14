"use client";

import React from "react";
import {
  UserIcon,
  MapIcon,
  Cog6ToothIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import "./Header.css";

interface HeaderProps {
  toggleView: (view: "Chat" | "Profile" | "Map" | "NFCReader") => void;
  onConfigureClick: () => void;
  activeView: "Chat" | "Profile" | "Map" | "NFCReader";
}

const Header: React.FC<HeaderProps> = ({
  toggleView,
  onConfigureClick,
  activeView,
}) => {
  return (
    <header>
      {/* Profile Icon */}
      <button
        className={`icon-button base-button ${
          activeView === "Profile" ? "active" : ""
        }`}
        onClick={() => toggleView("Profile")}
      >
        <UserIcon className="h-6 w-6" />
      </button>

      {/* Slider */}
      <div className="slider-container">
        <div
          className={`slider-pill ${
            activeView === "Chat" ? "active-chat" : "active-discover"
          }`}
        ></div>
        <button
          className={`slider-button ${
            activeView === "Chat" ? "active" : ""
          }`}
          onClick={() => toggleView("Chat")}
        >
          Loob
        </button>
        <button
          className={`slider-button ${
            activeView === "Map" ? "active" : ""
          }`}
          onClick={() => toggleView("Map")}
        >
          Discover
        </button>
      </div>

      {/* Right-side Icons */}
      <div className="flex space-x-4">
        {/* NFCReader Icon */}
        <button
          className={`icon-button base-button ${
            activeView === "NFCReader" ? "active" : ""
          }`}
          onClick={() => toggleView("NFCReader")}
        >
          <QrCodeIcon className="h-6 w-6" />
        </button>

        {/* Settings Icon */}
        <button
          className="icon-button base-button"
          onClick={onConfigureClick}
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
