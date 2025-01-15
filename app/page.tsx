"use client";

import React, { useState } from "react";
import ChatModal from "../components/ChatModal";
import ConfigureModal from "../components/ConfigureModal";
import Profile from "../components/Profile";
import Map from "../components/Map";
import NFCReader from "../components/NFCReader";
import AddEntry from "../components/AddEntry";

export default function Page() {
  const [view, setView] = useState<"Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry">(
    "Chat"
  );
  const [configureOpen, setConfigureOpen] = useState(false);

  const handleToggleView = (newView: "Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry") => {
    console.log("Switching view to:", newView); // Debugging
    setView(newView);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Render Dynamic Views */}
      {view === "Profile" && <Profile />}
      {view === "Map" && <Map />}
      {view === "Chat" && <ChatModal />}
      {view === "NFCReader" && <NFCReader />}
      {view === "AddEntry" && <AddEntry />} {/* Ensure AddEntry is rendered */}

      {/* Configure Modal */}
      {configureOpen && <ConfigureModal onClose={() => setConfigureOpen(false)} />}
    </div>
  );
}
