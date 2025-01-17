'use client';

import React, { useState, useEffect } from "react";
import GearProfile from "./GearProfile";
import { useRouter } from "next/router";

export default function NFCReader() {
  const [isScanning, setIsScanning] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const [chipFound, setChipFound] = useState(false);
  const [itemData, setItemData] = useState<any | null>(null);
  const [showItemProfile, setShowItemProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isScanning) {
      timeout = setTimeout(() => {
        setChipFound(true);
        setIsScanning(false);
        setNfcMessage("Sample NFC Data: Current Location: Library, Status: Checked In");

        // Mock item data
        setItemData({
          id: "item-001",
          name: "Library Book: 'The Future of AI'",
          description:
            "An insightful book discussing the advancements and challenges in Artificial Intelligence.",
          availability: "Checked In",
          history: [
            { action: "Checked Out", date: "2025-01-10", location: "Library" },
            { action: "Checked In", date: "2025-01-07", location: "Library" },
          ],
        });

        setShowItemProfile(true);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isScanning]);

  const handleScanClick = () => {
    setIsScanning(true);
    setChipFound(false);
    setNfcMessage(null);
    setShowItemProfile(false);
  };

  const handleCloseItemProfile = () => {
    setShowItemProfile(false);
  };

  const handleAddToMap = () => {
    router.push("/components/map"); // Navigate to the map view
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="relative flex items-center justify-center w-40 h-40">
        <div
          className={`absolute w-full h-full rounded-full border-4 ${
            isScanning ? "animate-ping border-gradient" : "border-transparent"
          }`}
        ></div>
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

      <div className="mt-4 text-center">
        {isScanning && <p className="text-pink-500">Searching for NFC chip...</p>}
        {!isScanning && !chipFound && nfcMessage === null && (
          <p className="text-gray-500">Click the button to start scanning.</p>
        )}
      </div>

      {showItemProfile && itemData && (
        <GearProfile
          gear={itemData}
          onClose={handleCloseItemProfile}
          onAddToMap={handleAddToMap} // Pass the required function here
        />
      )}
    </div>
  );
}
