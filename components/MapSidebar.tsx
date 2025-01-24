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
  const [selectedType, setSelectedType] = useState<string | "All">("Loobricate");
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

    if (sidebarActive && selectedType === 'Loobricate') {
      fetchLoobricates();
    }
  }, [sidebarActive, selectedType]);

  /**
   * Memoized filtered nodes based on search query and selected type.
   */
  const filteredNodes = useMemo(() => {
    if (selectedType === 'Loobricate') {
      return loobricates.map(loobricate => ({
        id: loobricate.id,
        label: loobricate.name,
        details: loobricate.description,
        type: 'Loobricate',
        lat: 52.52, // Default to Berlin center
        lon: 13.405,
        contact: loobricate.address || 'No contact info',
        visualType: 'Today' as const,
        loobricate: loobricate.name
      }));
    }

    return nodes.filter((node) => {
      const matchesType = selectedType === "All" || node.type.toLowerCase() === selectedType.toLowerCase();
      const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [nodes, loobricates, searchQuery, selectedType]);

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
            <h3 className="search-by-title">Search by...</h3>
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
          </div>

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