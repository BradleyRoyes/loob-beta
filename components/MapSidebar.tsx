import React, { useMemo, useState, useEffect } from "react";
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from "react-icons/fa";
import "./MapSidebar.css";

/**
 * Interface representing a node item in the map.
 */
export type VisualView = "Today";

export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: string;
  details: string;
  contact: string;
  visualType: VisualView;
  loobricate?: string;
  isLoobricate?: boolean;
  members?: string[];
  admins?: string[];
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

// Add type constants at the top of the file
const NODE_TYPES = {
  VENUE: "Venue",
  TALENT: "Talent",
  GEAR: "Gear",
  LOOBRICATE: "Loobricate"
} as const;

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
  const [selectedLoobricate, setSelectedLoobricate] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [loobricates, setLoobricates] = useState<any[]>([]);

  // Fetch loobricates when sidebar is active
  useEffect(() => {
    const fetchLoobricates = async () => {
      try {
        const response = await fetch('/api/loobricates');
        if (response.ok) {
          const data = await response.json();
          setLoobricates(data);
        }
      } catch (error) {
        console.error('Error fetching loobricates:', error);
      }
    };

    if (sidebarActive) {
      fetchLoobricates();
    }
  }, [sidebarActive]);

  // Memoized filtered nodes based on selected loobricate and type
  const filteredNodes = useMemo(() => {
    console.log("Current nodes:", nodes);
    console.log("Selected type:", selectedType);
    console.log("Selected loobricate:", selectedLoobricate);

    return nodes.filter((node) => {
      // Match Loobricate selection
      const matchesLoobricate = !selectedLoobricate || 
        selectedLoobricate === "All" || 
        node.loobricate === selectedLoobricate ||
        (node.isLoobricate && node.label === selectedLoobricate);

      // Match type selection - ensure exact match with our constants
      const matchesType = !selectedType || 
        node.type.toLowerCase() === selectedType.toLowerCase();

      // Match search query
      const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());

      // Debug log for each node
      console.log("Node:", {
        id: node.id,
        type: node.type,
        isLoobricate: node.isLoobricate,
        matchesType,
        matchesLoobricate,
        matchesSearch
      });

      return matchesLoobricate && matchesType && matchesSearch;
    });
  }, [nodes, searchQuery, selectedLoobricate, selectedType]);

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
    console.log("Selecting type:", type);
    setSelectedType(prevType => {
      const newType = prevType === type ? "" : type;
      console.log("New selected type:", newType);
      return newType;
    });
  };

  return (
    <div className={`sidebar-container ${sidebarActive ? "active" : ""}`}>
      <button
        className="toggle-sidebar"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      />
      <div className={`sidebar-content`}>
        {/* Sticky header section */}
        <div className="sidebar-header">
          <button
            className="sidebar-close"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            ×
          </button>
          
          <div className="search-by-container">
            <h3 className="search-by-title">Explore your Loobrary</h3>
            <select
              className="explore-dropdown"
              value={selectedLoobricate}
              onChange={(e) => setSelectedLoobricate(e.target.value)}
            >
              <option value="">Select Loobricate</option>
              <option value="All">All Loobricates</option>
              {loobricates.map(loobricate => (
                <option key={loobricate.id} value={loobricate.name}>
                  {loobricate.name}
                </option>
              ))}
            </select>
            <div className="search-by-icons">
              {[NODE_TYPES.VENUE, NODE_TYPES.TALENT, NODE_TYPES.GEAR].map((type) => (
                <div
                  key={type}
                  className={`search-icon ${selectedType === type ? "active" : ""}`}
                  onClick={() => handleTypeSelection(type)}
                  aria-label={type}
                >
                  {type === NODE_TYPES.VENUE ? (
                    <FaMapMarkerAlt className="icon" />
                  ) : type === NODE_TYPES.TALENT ? (
                    <FaUser className="icon" />
                  ) : (
                    <FaTools className="icon" />
                  )}
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="search-input-container">
            <input
              type="text"
              className="sidebar-input"
              placeholder="Search for a venue, gear, artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable list */}
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
      </div>
    </div>
  );
};

export default MapSidebar;