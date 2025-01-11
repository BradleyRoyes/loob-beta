import React, { useState, useMemo } from 'react';
import './MapSidebar.css';
import { Node } from './MockMapData';

interface MapSidebarProps {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onMoreInfo: (node: Node) => void;
  sidebarActive: boolean;
  toggleSidebar: () => void;
}

const MapSidebar: React.FC<MapSidebarProps> = ({ nodes, onNodeSelect, onMoreInfo, sidebarActive, toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | 'All'>('All');

  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        (selectedType === 'All' || node.type === selectedType) &&
        (node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [nodes, searchQuery, selectedType]);

  const handleNodeSelect = (node: Node) => {
    onNodeSelect(node);
    if (window.innerWidth <= 768) {
      toggleSidebar(); // Close sidebar on mobile
    }
  };

  const uniqueTypes = useMemo(() => {
    const types = nodes.map((node) => node.type);
    return ['All', ...Array.from(new Set(types))];
  }, [nodes]);

  return (
    <div className={`sidebar-container ${sidebarActive ? 'active' : ''}`}>
      <div className={`sidebar-content ${sidebarActive ? 'visible' : 'hidden'}`}>
        <div className="sticky-controls">
          <h2 className="sidebar-title">Search Locations</h2>
          <input
            type="text"
            className="sidebar-input"
            placeholder="Search for a venue, gear, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="filter-container">
            <label htmlFor="type-filter">Filter by Type:</label>
            <select
              id="type-filter"
              className="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="sidebar-list">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className="sidebar-item"
              onClick={() => handleNodeSelect(node)}
              style={{ cursor: 'pointer' }}
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
