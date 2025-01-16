import React, { useMemo, useState, useRef, useEffect } from "react";
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from "react-icons/fa"; // Imported FaUsers for Loobricate
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
  loobricate?: string; // New field to associate a node with a Loobricate
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
 * by text input or filter by specific types (e.g., Loobricate, Venue, Talent, Gear).
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
    return nodes.filter((node) => {
      const matchesType =
        selectedType === "All" ||
        (selectedType === "Loobricate"
          ? node.loobricate // If Loobricate is selected, filter nodes that belong to any Loobricate
          : node.type.toLowerCase() === selectedType.toLowerCase());

      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.loobricate && node.loobricate.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesSearch;
    });
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
        {/* Filter by type icons */}
        <div className="search-by-container">
          {/* "Search by..." Title */}
          <h3 className="search-by-title">Search by...</h3>

          {/* Loobricate Filter - Own Row, Centered, Slightly Bigger */}
          <div className="search-by-icons">
            <div
              className={`search-icon loobricate ${selectedType === "Loobricate" ? "active" : ""}`}
              onClick={() => handleTypeSelection("Loobricate")}
              aria-label="Loobricate"
            >
              <FaUsers className="icon" />
              <span>Loobricate</span>
            </div>
          </div>

          {/* Other Filters - Arranged Below Loobricate */}
          <div className="search-by-icons other-filters">
            {/* Venue Filter */}
            <div
              className={`search-icon ${selectedType === "Venue" ? "active" : ""}`}
              onClick={() => handleTypeSelection("Venue")}
              aria-label="Venue"
            >
              <FaMapMarkerAlt className="icon" />
              <span>Venue</span>
            </div>
            {/* Talent Filter */}
            <div
              className={`search-icon ${selectedType === "Talent" ? "active" : ""}`}
              onClick={() => handleTypeSelection("Talent")}
              aria-label="Talent"
            >
              <FaUser className="icon" />
              <span>Talent</span>
            </div>
            {/* Gear Filter */}
            <div
              className={`search-icon ${selectedType === "Gear" ? "active" : ""}`}
              onClick={() => handleTypeSelection("Gear")}
              aria-label="Gear"
            >
              <FaTools className="icon" />
              <span>Gear</span>
            </div>
          </div>

          {/* Glowing Traveling Thread Effect */}
          {selectedType === "Loobricate" && <div className="glowing-thread"></div>}
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
            placeholder="Search for a Loobricate, venue, gear, artist..."
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
