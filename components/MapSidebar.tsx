import React, { useMemo, useState } from "react";
import { FaMapMarkerAlt, FaUser, FaTools } from "react-icons/fa";
import "./MapSidebar.css";

/**
 * Interface representing a node item in the map.
 */
export interface Node {
  id: string; // Unique identifier for the node
  lat: number; // Latitude of the node location
  lon: number; // Longitude of the node location
  label: string; // Display label for the node
  type: string; // Type of the node (e.g., "Venue", "Gear", "Talent", etc.)
  details: string; // Additional details or description about the node
  contact: string; // Contact information (e.g., email address)
  visualType: "Today" | "ThisWeek" | "AllTime"; // Visibility duration for the node
}

/**
 * Props interface for the MapSidebar component.
 */
interface MapSidebarProps {
  nodes: Node[]; // Array of node data to display
  onNodeSelect: (node: Node) => void; // Callback when a node is selected
  onMoreInfo: (node: Node) => void; // Callback to show more information about a node
  sidebarActive: boolean; // Whether the sidebar is currently active/visible
  toggleSidebar: () => void; // Function to toggle the sidebar visibility
}

/**
 * MapSidebar Component
 * 
 * Renders a sidebar for filtering and displaying map nodes. Users can search for nodes
 * by text input or filter by specific types (e.g., Venue, Talent, Gear).
 */
const MapSidebar: React.FC<MapSidebarProps> = ({
  nodes,
  onNodeSelect,
  onMoreInfo,
  sidebarActive,
  toggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [selectedType, setSelectedType] = useState<string | "All">("All"); // Selected filter type

  /**
   * Memoized filtered nodes based on search query and selected type.
   */
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        (selectedType === "All" || node.type.toLowerCase() === selectedType.toLowerCase()) &&
        (node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [nodes, searchQuery, selectedType]);

  /**
   * Handles the selection of a node.
   * Closes the sidebar if the viewport is small (mobile devices).
   */
  const handleNodeSelect = (node: Node) => {
    onNodeSelect(node);
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  /**
   * Toggles the selected type filter.
   * If the current type is selected, resets to "All".
   */
  const handleTypeSelection = (type: string) => {
    setSelectedType(type === selectedType ? "All" : type);
  };

  return (
    <div className={`sidebar-container ${sidebarActive ? "active" : ""}`}>
      <div className={`sidebar-content ${sidebarActive ? "visible" : "hidden"}`}>
        {/* Sticky header with title and toggle buttons */}
        <div
          className="sticky-controls"
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#333",
            zIndex: 10,
            padding: "10px",
          }}
        >
          <h2 className="sidebar-title">Search Loobrary</h2>

          {/* Filter by type icons */}
          <div className="search-by-container">
            <h3 className="search-by-title">Search by...</h3>
            <div className="search-by-icons">
              {/* Location Filter */}
              <div
                className={`search-icon ${selectedType === "Venue" ? "active" : ""}`}
                onClick={() => handleTypeSelection("Venue")}
              >
                <FaMapMarkerAlt className="icon" />
                <span>Location</span>
              </div>
              {/* Talent Filter */}
              <div
                className={`search-icon ${selectedType === "Talent" ? "active" : ""}`}
                onClick={() => handleTypeSelection("Talent")}
              >
                <FaUser className="icon" />
                <span>Talent</span>
              </div>
              {/* Gear Filter */}
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

        {/* Display filtered nodes */}
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

        {/* Search input at the bottom, sticky */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "10px",
            backgroundColor: "#333",
          }}
        >
          <input
            type="text"
            className="sidebar-input"
            placeholder="Search for a venue, gear, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#222",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px",
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
