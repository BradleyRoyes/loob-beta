"use client";

import React from "react";
import {
  UserIcon,
  MapIcon,
  Cog6ToothIcon,
  QrCodeIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import "./Header.css";
import Image from 'next/image';

interface HeaderProps {
  toggleView: (view: "Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry") => void;
  onConfigureClick: () => void;
  activeView: "Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry";
}

const Header: React.FC<HeaderProps> = ({
  toggleView,
  onConfigureClick,
  activeView,
}) => {
  return (
    <header className="header-container">
      {/* Left Section */}
      <div className="left-icons">
        {/* Add Entry Icon */}
        <button
          className={`icon-button ${
            activeView === "AddEntry" ? "active" : ""
          }`}
          onClick={() => toggleView("AddEntry")}
        >
          <PlusCircleIcon className="h-6 w-6" />
        </button>

        {/* NFC Reader Icon */}
        <button
          className={`icon-button ${
            activeView === "NFCReader" ? "active" : ""
          }`}
          onClick={() => toggleView("NFCReader")}
        >
          <QrCodeIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="slider-container">
  <div
    className={`slider-pill ${
      activeView === "Chat" ? "active-chat" : "active-discover"
    }`}
  ></div>
<button
  className={`slider-button flex items-center justify-center ${
    activeView === "Chat" ? "active" : ""
  }`}
  onClick={() => toggleView("Chat")}
>
  <Image 
    src="/favicon.ico"
    alt="Favicon"
    width={500}
    height={300}
    className="h-6 w-6 mr-2"
  />
  Loob
</button>

<button
  className={`slider-button flex items-center justify-center ${
    activeView === "Map" ? "active" : ""
  }`}
  onClick={() => toggleView("Map")}
>
  Explore
  <MapIcon className="h-6 w-6 ml-2" />
</button>



</div>

      {/* Right Section */}
      <div className="right-icons">
        {/* Profile Icon */}
        <button
          className={`icon-button ${
            activeView === "Profile" ? "active" : ""
          }`}
          onClick={() => toggleView("Profile")}
        >
          <UserIcon className="h-6 w-6" />
        </button>

        {/* Settings Icon */}
        <button
          className="icon-button"
          onClick={onConfigureClick}
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;