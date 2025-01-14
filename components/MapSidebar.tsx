import React, { useMemo, useState } from "react";
import { FaMapMarkerAlt, FaUser, FaTools } from "react-icons/fa";
import "./MapSidebar.css";

// Match the Node type from Map.tsx
export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: string; // e.g., "Venue", "Gear", "Talent", etc.
  details: string; // e.g., description or details
  contact: string; // e.g., "mailto:someone@example.com"
  visualType: "Today" | "ThisWeek" | "AllTime"; // Matches VisualView type
}

// Props for MapSidebar
interface MapSidebarProps {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onMoreInfo: (node: Node) => void;
  sidebarActive: boolean;
  toggleSidebar: () => void;
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  nodes,
  onNodeSelect,
  onMoreInfo,
  sidebarActive,
  toggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState(""); // Search input state
  const [selectedType, setSelectedType] = useState<string | "All">("All"); // Filter state

  // Filter nodes based on search query and type
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        (selectedType === "All" || node.type.toLowerCase() === selectedType.toLowerCase()) &&
        (node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [nodes, searchQuery, selectedType]);

  const handleNodeSelect = (node: Node) => {
    onNodeSelect(node);
    if (window.innerWidth <= 768) {
      toggleSidebar(); // Close the sidebar on mobile
    }
  };

  const handleTypeSelection = (type: string) => {
    // Toggle between "All" and the selected type
    setSelectedType(type === selectedType ? "All" : type);
  };

  return (
    <div className={`sidebar-container ${sidebarActive ? "active" : ""}`}>
      <div className={`sidebar-content ${sidebarActive ? "visible" : "hidden"}`}>
        <div className="sticky-controls">
          <h2 className="sidebar-title">Search Loobrary</h2>

          {/* Search input */}
          <input
            type="text"
            className="sidebar-input"
            placeholder="Search for a venue, gear, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Search by icons */}
          <div className="search-by-container">
            <h3 className="search-by-title">Search by...</h3>
            <div className="search-by-icons">
              <div
                className={`search-icon ${selectedType === "Venue" ? "active" : ""}`}
                onClick={() => handleTypeSelection("Venue")}
              >
                <FaMapMarkerAlt className="icon" />
                <span>Location</span>
              </div>
              <div
                className={`search-icon ${selectedType === "Talent" ? "active" : ""}`}
                onClick={() => handleTypeSelection("Talent")}
              >
                <FaUser className="icon" />
                <span>Talent</span>
              </div>
              <div
                className={`search-icon ${selectedType === "Gear" ? "active" : ""}`}
                onClick={() => handleTypeSelection("Gear")}
              >
                <FaTools className="icon" />
                <span>Thing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered nodes list */}
        <div className="sidebar-list">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className="sidebar-item"
              onClick={() => handleNodeSelect(node)}
              style={{ cursor: "pointer" }}
            >
              <div className="sidebar-item-content">
                <div className="sidebar-item-title">{node.label}</div>
                <div className="sidebar-item-description">{node.details}</div>
              </div>
              <button
                className="more-info-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent onClick
                  onMoreInfo(node);
                }}
              >
                More Info
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
