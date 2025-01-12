'use client';

import React, { useState } from 'react';
import { GlobalStateProvider } from '../components/GlobalStateContext';
import SplashScreen from '../components/SplashScreen';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Profile from '../components/Profile';
import Map from '../components/Map';
import ConfigureModal from '../components/ConfigureModal';
import ChatSection from '../components/ChatModal';
import './globals.css'; // Ensure your global styles are imported

const RootLayout: React.FC = () => {
  const [view, setView] = useState<'Chat' | 'Profile' | 'Map'>('Chat');
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [chatActive, setChatActive] = useState(true); // Track chat modal visibility

  const handleSplashComplete = () => setShowSplash(false); // Hide splash screen after interaction

  const handleToggleView = (newView: 'Chat' | 'Profile' | 'Map') => setView(newView);

  const handleConfigureClick = () => setConfigureOpen(true);
  const handleCloseConfigure = () => setConfigureOpen(false);

  const handleShowModal = () => {
    setChatActive(false); // Close the chat modal when "End Chat" is clicked
    console.log('Chat ended'); // Optional: Add any additional logic for ending chat
  };

  const renderAppContent = () => {
    switch (view) {
      case 'Profile':
        return <Profile />;
      case 'Map':
        return <Map />;
      case 'Chat':
      default:
        return (
          chatActive && (
            <ChatSection
              onConfigureOpen={handleConfigureClick}
              showModal={handleShowModal} // Pass the function for "End Chat"
            />
          )
        );
    }
  };

  return (
    <html lang="en">
      <body className="bg-background-primary text-text-primary-inverse flex flex-col min-h-screen">
        {/* Wrap the entire app in GlobalStateProvider */}
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
