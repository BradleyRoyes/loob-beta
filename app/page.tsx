'use client';

import React, { useState } from 'react';

// Import necessary components
import ChatSection from '../components/ChatModal';
import ModalOverlay from '../components/ModalOverlay';
import ConfigureModal from '../components/ConfigureModal';
import Profile from '../components/Profile';
import Map from '../components/Map';

export default function Page() {
  const [view, setView] = useState<'Chat' | 'Profile' | 'Map'>('Chat');
  const [showModal, setShowModal] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);

  const handleToggleView = (newView: 'Chat' | 'Profile' | 'Map') => {
    setView(newView);
  };

  const handleConfigureClick = () => {
    setConfigureOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-between pb-32">
        {/* Modal Overlay */}
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        {/* Dynamic View Rendering */}
        {view === 'Profile' && <Profile />}
        {view === 'Map' && (
          <div className="absolute inset-0">
            <Map />
          </div>
        )}
        {view === 'Chat' && (
          <ChatSection
            onConfigureOpen={handleConfigureClick}
            showModal={() => setShowModal(true)}
          />
        )}

        {/* Configure Modal */}
        {configureOpen && (
          <ConfigureModal onClose={() => setConfigureOpen(false)} />
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gray-800 text-center">
        Footer content here
      </footer>
    </div>
  );
}
