"use client";

import React, { useState } from "react";
import { GlobalStateProvider } from "../components/GlobalStateContext";
import SplashScreen from "../components/SplashScreen";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Profile from "../components/Profile";
import Map from "../components/Map";
import ConfigureModal from "../components/ConfigureModal";
import ChatSection from "../components/ChatModal";
import NFCReader from "../components/NFCReader";
import "./globals.css";

const RootLayout: React.FC = () => {
  const [view, setView] = useState<"Chat" | "Profile" | "Map" | "NFCReader">(
    "Chat"
  );
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => setShowSplash(false);

  const handleToggleView = (newView: "Chat" | "Profile" | "Map" | "NFCReader") => {
    setView(newView);
  };

  const handleConfigureClick = () => setConfigureOpen(true);
  const handleCloseConfigure = () => setConfigureOpen(false);

  const renderAppContent = () => {
    switch (view) {
      case "Profile":
        return <Profile />;
      case "Map":
        return <Map />;
      case "NFCReader":
        return <NFCReader />;
      case "Chat":
      default:
        return (
          <ChatSection
            onConfigureOpen={handleConfigureClick}
            showModal={() => {}}
          />
        );
    }
  };

  return (
    <html lang="en">
      <body className="bg-background-primary text-text-primary flex flex-col min-h-screen">
        <GlobalStateProvider>
          {showSplash ? (
            <SplashScreen onClose={handleSplashComplete} />
          ) : (
            <>
              {/* Sticky Header */}
              <Header
                toggleView={handleToggleView}
                onConfigureClick={handleConfigureClick}
                activeView={view}
              />
              {/* Main Content */}
              <main className="flex flex-1 flex-col items-center justify-between w-full overflow-hidden">
                {renderAppContent()}
                {configureOpen && <ConfigureModal onClose={handleCloseConfigure} />}
              </main>
              {/* Footer */}
              <Footer />
            </>
          )}
        </GlobalStateProvider>
      </body>
    </html>
  );
};

export default RootLayout;
