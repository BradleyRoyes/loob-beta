import React, { useMemo, useState } from "react";
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from "react-icons/fa";
import "./MapSidebar.css";

/**
 * Interface representing a node item in the map.
 */
export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: string;
  details: string;
  contact: string;
  visualType: "Today" | "ThisWeek" | "AllTime";
  loobricate?: string;
}

/**
 * Props interface for the MapSidebar component.
 */
interface MapSidebarProps {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onMoreInfo: (node: Node) => void;
  sidebarActive: boolean;
  toggleSidebar: () => void;
}

/**
 * MapSidebar Component
 */
const MapSidebar: React.FC<MapSidebarProps> = ({
  nodes,
  onNodeSelect,
  onMoreInfo,
  sidebarActive,
  toggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | "All">("All");

  /**
   * Memoized filtered nodes based on search query and selected type.
   */
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesType =
        selectedType === "All" ||
        (selectedType === "Loobricate"
          ? node.loobricate
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
   */
  const handleNodeSelect = (node: Node) => {
    onNodeSelect(node);
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  /**
   * Toggles the selected type filter.
   */
  const handleTypeSelection = (type: string) => {
    setSelectedType(type === selectedType ? "All" : type);
  };

  return (
    <div className={`sidebar-container ${sidebarActive ? "active" : ""}`}>
      <div className={`sidebar-content ${sidebarActive ? "visible" : "hidden"}`}>
        <h3 className="search-by-title">Search by...</h3>
        {/* Filter by type icons */}
        <div className="search-by-icons">
          {["Loobricate", "Venue", "Talent", "Gear"].map((type) => (
            <div
              key={type}
              className={`search-icon ${
                selectedType === type ? "active" : ""
              } ${type === "Loobricate" ? "loobricate" : ""}`}
              onClick={() => handleTypeSelection(type)}
              aria-label={type}
            >
              {type === "Loobricate" ? (
                <FaUsers className="icon" />
              ) : type === "Venue" ? (
                <FaMapMarkerAlt className="icon" />
              ) : type === "Talent" ? (
                <FaUser className="icon" />
              ) : (
                <FaTools className="icon" />
              )}
              <span>{type}</span>
            </div>
          ))}
        </div>
        {/* Glowing thread animation when Loobricate is active */}
        {selectedType === "Loobricate" && <div className="glowing-thread"></div>}

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
                  e.stopPropagation();
                  onMoreInfo(node);
                }}
              >
                More Info
              </button>
            </div>
          ))}
        </div>

        {/* Search input */}
        <div className="search-input-container">
          <input
            type="text"
            className="sidebar-input"
            placeholder="Search for a Loobricate, venue, gear, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
