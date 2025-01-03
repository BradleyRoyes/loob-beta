'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css'; // Import the CSS file below
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';
import VenueProfile from './VenueProfile';
import VenueSelector from './VenueSelector'; // Make sure the path is correct

type VisualType = 'Today' | 'ThisWeek' | 'AllTime';

interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  vibe: string;
  visualType: VisualType;
}

const Map: React.FC = () => {
  // References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // States
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'Berghain',
      lat: 52.511,
      lon: 13.438,
      label: 'Berghain',
      vibe: 'Pulsating beats and untamed energy',
      visualType: 'Today',
    },
    {
      id: 'Sisyphos',
      lat: 52.520,
      lon: 13.462,
      label: 'Sisyphos',
      vibe: 'Endless party with an outdoor twist',
      visualType: 'ThisWeek',
    },
    {
      id: 'Tresor',
      lat: 52.512,
      lon: 13.428,
      label: 'Tresor',
      vibe: 'Industrial techno wonderland',
      visualType: 'AllTime',
    },
    {
      id: 'KitKat',
      lat: 52.513,
      lon: 13.432,
      label: 'KitKat',
      vibe: 'Playful freedom, let your wild side out',
      visualType: 'Today',
    },
  ]);

  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // ===== Larger Venue Profile Modal =====
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [showVenueProfile, setShowVenueProfile] = useState(false);

  // ===== Small Popup Preview =====
  const [previewNode, setPreviewNode] = useState<Node | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // ===== Sidebar & Venue Selector =====
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVenueSelector, setShowVenueSelector] = useState(false);

  // ===== New Venue Name =====
  const [newVenueName, setNewVenueName] = useState<string>('');

  // ========== Initialize Map ==========
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors.',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [13.405, 52.52], // Default center: Berlin
        zoom: 12,
      });

      // Apply grayscale effect on load
      map.on('load', () => {
        map.getCanvas().style.filter = 'grayscale(100%)';
      });

      mapInstanceRef.current = map;

      // ===== Add markers for all nodes =====
      nodes.forEach((node) => {
        const markerElement = document.createElement('div');
        markerElement.className = 'map-marker'; // Glowing orange sphere

        new maplibregl.Marker({ element: markerElement })
          .setLngLat([node.lon, node.lat])
          .addTo(map)
          .getElement()
          .addEventListener('click', () => {
            // On marker click, show small preview popup above the marker
            const screenPos = map.project([node.lon, node.lat]);
            setPopupPosition({ x: screenPos.x, y: screenPos.y });
            setPreviewNode(node);
            setShowPreviewPopup(true);
          });
      });

      // ===== Get user location, if available =====
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userLocation: [number, number] = [longitude, latitude];
            setCurrentLocation(userLocation);

            // Center map on user location
            map.setCenter(userLocation);

            // Check for a nearby venue
            const nearbyNode = nodes.find(
              (n) =>
                Math.abs(n.lat - latitude) < 0.001 && Math.abs(n.lon - longitude) < 0.001
            );
            if (nearbyNode) {
              const screenPos = map.project([nearbyNode.lon, nearbyNode.lat]);
              setPopupPosition({ x: screenPos.x, y: screenPos.y });
              setPreviewNode(nearbyNode);
              setShowPreviewPopup(true);
            }
          },
          (err) => console.error('Error retrieving location:', err)
        );
      }
    }
  }, [nodes]);

  // ========== Add a New Venue at user location ==========
  const handleAddVenue = () => {
    if (newVenueName.trim() && currentLocation) {
      const [lon, lat] = currentLocation;
      const newNode: Node = {
        id: `Node-${Date.now()}`,
        lat,
        lon,
        label: newVenueName,
        vibe: 'User-created vibe',
        visualType: 'Today',
      };

      setNodes((prev) => [...prev, newNode]);

      // Add a marker for the new venue
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        const markerElement = document.createElement('div');
        markerElement.className = 'map-marker';

        new maplibregl.Marker({ element: markerElement })
          .setLngLat([lon, lat])
          .addTo(map)
          .getElement()
          .addEventListener('click', () => {
            const screenPos = map.project([lon, lat]);
            setPopupPosition({ x: screenPos.x, y: screenPos.y });
            setPreviewNode(newNode);
            setShowPreviewPopup(true);
          });

        // Fly to newly added venue
        map.flyTo({ center: [lon, lat], zoom: 14 });
      }
    }
  };

  // ========== Filter nodes in the sidebar ==========
  const filteredNodes = useMemo(
    () => nodes.filter((node) => node.label.toLowerCase().includes(searchQuery.toLowerCase())),
    [nodes, searchQuery]
  );

  // ========== Render correct 3D sphere based on visualType ==========
  const renderSphereForNode = (node: Node) => {
    switch (node.visualType) {
      case 'ThisWeek':
        return <TorusSphereWeek />;
      case 'AllTime':
        return <TorusSphereAll />;
      default:
        return <TorusSphere />;
    }
  };

  return (
    <div className="map-container">
      {/* ========================= MAP LAYER ========================= */}
      <div ref={mapContainerRef} className="map-layer" />

      {/* ========================= SIDEBAR ========================= */}
      {showSidebar && (
        <div className="sidebar-container">
          <h2 className="sidebar-title">Search Locations</h2>
          <input
            type="text"
            className="sidebar-input"
            placeholder="Search for a venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="sidebar-list">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                className="sidebar-item"
                onClick={() => {
                  if (mapInstanceRef.current) {
                    const screenPos = mapInstanceRef.current.project([node.lon, node.lat]);
                    setPopupPosition({ x: screenPos.x, y: screenPos.y });
                  }
                  setPreviewNode(node);
                  setShowPreviewPopup(true);

                  // Fly to node
                  mapInstanceRef.current?.flyTo({ center: [node.lon, node.lat], zoom: 14 });
                }}
              >
                <div className="sidebar-item-title">{node.label}</div>
                <div className="sidebar-item-description">{node.vibe}</div>
                {/* We don't directly open the big modal from here; we open the small preview popup. */}
              </div>
            ))}
          </div>

          {/* Example: Optionally add a field to create new venue */}
          <input
            type="text"
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            placeholder="New venue name..."
            className="sidebar-input"
          />
          <button onClick={handleAddVenue} className="sidebar-item-link">
            Add New Venue at My Location
          </button>
        </div>
      )}

      {/* ========================= SMALL POPUP PREVIEW ========================= */}
      {showPreviewPopup && previewNode && popupPosition && (
        <div
          className="small-popup"
          style={{
            position: 'absolute',
            top: popupPosition.y,
            left: popupPosition.x,
          }}
        >
          <div className="small-popup-inner">
            {/* Close button */}
            <button
              className="close-popup-btn"
              onClick={() => {
                setShowPreviewPopup(false);
                setPreviewNode(null);
              }}
            >
              ×
            </button>

            {/* 3D Sphere */}
            <div className="sphere-preview">{renderSphereForNode(previewNode)}</div>

            {/* "More Info" -> Open big modal */}
            <button
              className="more-info-btn"
              onClick={() => {
                setShowPreviewPopup(false);
                setPreviewNode(null);
                setActiveNode(previewNode);
                setShowVenueProfile(true);
              }}
            >
              More Info
            </button>
          </div>
        </div>
      )}

      {/* ========================= BIG VENUE PROFILE MODAL ========================= */}
      {showVenueProfile && activeNode && (
        <div
          className="venue-profile-overlay"
          onClick={(e) => {
            // Close if click outside
            if (e.target === e.currentTarget) {
              setShowVenueProfile(false);
            }
          }}
        >
          <div className="venue-profile-modal">
            <VenueProfile onClose={() => setShowVenueProfile(false)} />
          </div>
        </div>
      )}

      {/* ========================= TOGGLE SIDEBAR BUTTON ========================= */}
      <button
        className="toggle-sidebar"
        onClick={() => setShowSidebar(!showSidebar)}
        title="Toggle Sidebar"
      >
        {showSidebar ? '←' : '→'}
      </button>

      {/* ========================= VENUE SELECTOR BUTTON ========================= */}
      <button
        className="venue-selector-button"
        onClick={() => setShowVenueSelector(true)}
        title="Open Venue Selector"
      >
        Select Venue
      </button>

      {/* ========================= VENUE SELECTOR MODAL ========================= */}
      {showVenueSelector && (
        <VenueSelector
          nodes={nodes}
          setActiveVenue={(venue) => {
            setActiveNode(venue);
            setShowVenueSelector(false);
            setShowVenueProfile(true);
          }}
          onClose={() => setShowVenueSelector(false)}
        />
      )}
    </div>
  );
};

export default Map;
