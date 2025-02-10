"use client";

import React, { useState, useEffect } from "react";
import ChatModal from "../components/ChatModal";
import ModalOverlay from "../components/ModalOverlay";
import ConfigureModal from "../components/ConfigureModal";
import Profile from "../components/Profile";
import Map from "../components/Map";
import NFCReader from "../components/NFCReader";
import LoobricatesList from '../components/LoobricatesList';
import CompanionSelection from '../components/CompanionSelection';
import { useGlobalState } from '../components/GlobalStateContext';

export default function Page() {
  const { hasChosenCompanion, setUserState, activeServitor, isAnonymous } = useGlobalState();
  const [view, setView] = useState<"Chat" | "Profile" | "Map" | "NFCReader">("Chat");
  const [showModal, setShowModal] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showCompanionSelection, setShowCompanionSelection] = useState(false);

  useEffect(() => {
    // Only show companion selection for logged-in users without a companion
    const shouldShowSelection = !isAnonymous && !hasChosenCompanion && !activeServitor;
    
    console.log('Companion Selection State:', {
      isAnonymous,
      hasChosenCompanion,
      activeServitor,
      shouldShowSelection
    });

    setShowCompanionSelection(shouldShowSelection);
  }, [isAnonymous, hasChosenCompanion, activeServitor]);

  const handleToggleView = (newView: "Chat" | "Profile" | "Map" | "NFCReader") => {
    setView(newView);
  };

  const handleConfigureClick = () => {
    setConfigureOpen(true);
  };

  const handleCompanionSelect = (servitor) => {
    console.log('Companion Selected:', servitor);
    
    // Update both the active servitor and mark as chosen
    setUserState({ 
      activeServitor: servitor,
      hasChosenCompanion: true 
    });

    // Update localStorage to persist the selection
    const userState = localStorage.getItem('userState');
    if (userState) {
      const updatedState = {
        ...JSON.parse(userState),
        activeServitor: servitor,
        hasChosenCompanion: true
      };
      localStorage.setItem('userState', JSON.stringify(updatedState));
    }
    
    setShowCompanionSelection(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center">
        {/* Modal Overlay */}
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        {/* Initial Companion Selection for new users */}
        {showCompanionSelection && (
          <CompanionSelection
            isOpen={true}
            onClose={() => {
              // If they try to close without selecting, we'll still mark it as chosen
              // but they won't have an active servitor
              setUserState({ hasChosenCompanion: true });
              setShowCompanionSelection(false);
            }}
            onSelect={handleCompanionSelect}
          />
        )}

        {/* Dynamic View Rendering */}
        {!showCompanionSelection && (
          <>
            {view === "Profile" && <Profile />}
            {view === "Map" && <Map />}
            {view === "Chat" && (
              <ChatModal
                onConfigureOpen={handleConfigureClick}
                showModal={() => setShowModal(true)}
              />
            )}
            {view === "NFCReader" && <NFCReader />}

            {/* Configure Modal */}
            {configureOpen && <ConfigureModal onClose={() => setConfigureOpen(false)} />}

            <LoobricatesList />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gray-800 text-center">Footer content here</footer>
    </div>
  );
}
