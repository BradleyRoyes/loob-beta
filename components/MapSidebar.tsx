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
  loobricate?: string;       // Single loobricate relationship
  loobricates?: string[];    // Multiple loobricate relationships
  isLoobricate?: boolean;    // Is this node itself a loobricate
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

// Update type constants to ensure exact matches
const NODE_TYPES = {
  VENUE: "venue",
  TALENT: "talent",
  GEAR: "gear",
  LOOBRICATE: "loobricate"
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

  // Update the filteredNodes logic
  const filteredNodes = useMemo(() => {
    // Log all nodes for debugging
    console.log("All nodes:", nodes.map(node => ({
      type: node.type.toLowerCase(),
      label: node.label,
      loobricate: node.loobricate
    })));
    
    return nodes.filter((node) => {
      // Normalize types for comparison
      const nodeType = node.type.toLowerCase().trim();
      const selectedTypeLC = selectedType.toLowerCase().trim();

      // Match Loobricate selection
      const matchesLoobricate = !selectedLoobricate || 
        selectedLoobricate === "All" || 
        (node.loobricate && node.loobricate.toLowerCase() === selectedLoobricate.toLowerCase()) ||
        (Array.isArray(node.loobricates) && 
          node.loobricates.some(l => l.toLowerCase() === selectedLoobricate.toLowerCase())) ||
        (node.isLoobricate && node.label.toLowerCase() === selectedLoobricate.toLowerCase());

      // Match type selection
      const matchesType = !selectedType || nodeType === selectedTypeLC;

      // Match search query
      const matchesSearch = !searchQuery || 
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.details?.toLowerCase().includes(searchQuery.toLowerCase());

      // Debug logging for all filtering
      console.log("Node filtering:", {
        id: node.id,
        label: node.label,
        type: nodeType,
        selectedType: selectedTypeLC,
        loobricate: node.loobricate,
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
    console.log("Selected node:", node); // Add logging for node selection
    onNodeSelect(node);
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  /**
   * Toggles the selected type filter.
   */
  const handleTypeSelection = (type: string) => {
    // Convert type to lowercase for consistency
    const normalizedType = type.toLowerCase();
    
    console.log("Type selection:", {
      currentType: selectedType,
      newType: normalizedType,
      matchingNodes: nodes.filter(node => 
        node.type.toLowerCase().trim() === normalizedType
      ).map(n => ({
        label: n.label,
        type: n.type,
        loobricate: n.loobricate
      }))
    });
    
    setSelectedType(prevType => {
      const newType = prevType.toLowerCase() === normalizedType ? "" : normalizedType;
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
              {Object.entries(NODE_TYPES).map(([key, value]) => (
                key !== 'LOOBRICATE' && (
                  <div
                    key={value}
                    className={`search-icon ${selectedType.toLowerCase() === value ? "active" : ""}`}
                    onClick={() => handleTypeSelection(value)}
                    aria-label={value}
                  >
                    {value === NODE_TYPES.VENUE ? (
                      <FaMapMarkerAlt className="icon" />
                    ) : value === NODE_TYPES.TALENT ? (
                      <FaUser className="icon" />
                    ) : (
                      <FaTools className="icon" />
                    )}
                    <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
                  </div>
                )
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