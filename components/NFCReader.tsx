'use client';

import React, { useState, useEffect } from "react";
import ItemProfile from "./GearProfile"; // Import the updated ItemProfile component

export default function NFCReader() {
  const [isScanning, setIsScanning] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const [chipFound, setChipFound] = useState(false);
  const [itemData, setItemData] = useState<any | null>(null); // State for item data
  const [showItemProfile, setShowItemProfile] = useState(false); // Show/hide ItemProfile

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isScanning) {
      // Simulate scanning and finding a chip
      timeout = setTimeout(() => {
        setChipFound(true); // Simulate chip found
        setIsScanning(false);
        setNfcMessage("Sample NFC Data: Current Location: Library, Status: Checked In");

        // Mock item data after a successful scan
        setItemData({
          id: "item-001",
          name: "You've Unlocked a New Loobricate.",
          description:
            "Moos is a community exploring advancements and challenges in Artificial Intelligence.",
          availability: "Checked In",
          history: [
            { action: "Open Decks", date: "2025-01-10", location: "MOOS" },
            { action: "Experience Design Studio", date: "2025-01-07", location: "Online" },
          ],
        });
        setShowItemProfile(true); // Automatically show the ItemProfile modal
      }, 3000); // Mock a 3-second scan delay
    }

    return () => clearTimeout(timeout);
  }, [isScanning]);

  const handleScanClick = () => {
    setIsScanning(true);
    setChipFound(false);
    setNfcMessage(null); // Reset previous message
    setShowItemProfile(false); // Reset modal visibility
  };

  const handleCloseItemProfile = () => {
    setShowItemProfile(false); // Close the item profile modal
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Scanning Animation */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Pulsing Animation */}
        <div
          className={`absolute w-full h-full rounded-full border-4 ${
            isScanning ? "animate-ping border-gradient" : "border-transparent"
          }`}
        ></div>
        {/* Main Button with Gradient */}
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-r from-pink-300 to-orange-300 flex items-center justify-center shadow-lg">
          <button
            onClick={handleScanClick}
            className="bg-black text-white font-semibold rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            disabled={isScanning}
          >
            {isScanning ? "Scanning..." : "Scan NFC"}
          </button>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 text-center">
        {isScanning && <p className="text-pink-500">Searching for NFC chip...</p>}
        {!isScanning && !chipFound && nfcMessage === null && (
          <p className="text-gray-500">Click the button to start scanning.</p>
        )}
        {!isScanning && !chipFound && nfcMessage === "" && (
          <p className="text-red-500">No chip found. Try again.</p>
        )}
      </div>

      {/* Item Profile Modal */}
      {showItemProfile && itemData && (
        <ItemProfile gear={itemData} onClose={handleCloseItemProfile} />
      )}
    </div>
  );
}