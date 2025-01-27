"use client";

import React, { useState, useEffect } from "react";
import { GlobalStateProvider, useGlobalState } from "../components/GlobalStateContext";
import SplashScreen from "../components/SplashScreen";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Profile from "../components/Profile";
import Map from "../components/Map";
import ConfigureModal from "../components/ConfigureModal";
import ChatSection from "../components/ChatModal";
import NFCReader from "../components/NFCReader";
import AddEntry from "../components/AddEntry"; // Import AddEntry
import "./globals.css";

const RootLayout: React.FC = () => {
  const [view, setView] = useState<"Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry">("Chat");
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => setShowSplash(false);

  const handleToggleView = (
    newView: "Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry"
  ) => {
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
      case "AddEntry":
        return <AddEntry />;
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#121212" />
      </head>
      <body className="bg-background-primary text-text-primary flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden">
        <GlobalStateProvider>
          {showSplash ? (
            <SplashScreen onClose={handleSplashComplete} />
          ) : (
            <>
              <Header
                toggleView={handleToggleView}
                onConfigureClick={handleConfigureClick}
                activeView={view}
              />
              <main className="flex flex-1 flex-col items-center justify-between w-full pt-[4rem] px-4 md:px-6 overflow-y-auto">
                {renderAppContent()}
                {configureOpen && <ConfigureModal onClose={handleCloseConfigure} />}
              </main>
              <Footer />
            </>
          )}
        </GlobalStateProvider>
      </body>
    </html>
  );
};

export default RootLayout;
